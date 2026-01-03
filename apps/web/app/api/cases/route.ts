/* eslint-disable @typescript-eslint/no-explicit-any */

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isDCARole } from '@/lib/auth';
import { logUserAction } from '@/lib/audit';
import { secureQuery } from '@/lib/auth/secure-query';

/**
 * GET /api/cases
 * List cases with filtering, sorting, and pagination
 * Permission: cases:read
 * SECURITY: Region filtering is SERVER-ENFORCED via SecureQueryBuilder
 */
const handleGetCases: ApiHandler = async (request, { user }) => {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '25');
        const offset = (page - 1) * limit;

        // Sorting
        const sortBy = searchParams.get('sortBy') ?? 'created_at';
        const sortOrder = searchParams.get('sortOrder') === 'asc';

        // Build secure query with automatic region and DCA filtering
        const queryBuilder = secureQuery(user)
            .from('cases')
            .select('*, assigned_dca:dcas(id, name, status)')
            .withOptions({ regionColumn: 'region' }); // cases use 'region' not 'region_id'

        // Filters - these are ADDITIONAL filters on already region-scoped data
        const status = searchParams.get('status');
        if (status) {
            const statuses = status.split(',');
            queryBuilder.in('status', statuses);
        }

        const priority = searchParams.get('priority');
        if (priority) {
            const priorities = priority.split(',');
            queryBuilder.in('priority', priorities);
        }

        const assignedDcaId = searchParams.get('assignedDcaId');
        if (assignedDcaId) {
            // Verify DCA users can only filter their own DCA
            if (isDCARole(user.role) && assignedDcaId !== user.dcaId) {
                return NextResponse.json(
                    { error: { code: 'FORBIDDEN', message: 'Cannot access other DCA data' } },
                    { status: 403 }
                );
            }
            queryBuilder.eq('assigned_dca_id', assignedDcaId);
        }

        // Client region param - ONLY for subsetting already-allowed regions (NOT security)
        const clientRegion = searchParams.get('region');
        if (clientRegion && clientRegion !== 'ALL') {
            // Validate client-requested region is in user's accessible regions
            if (!user.isGlobalAdmin && !user.accessibleRegions.includes(clientRegion)) {
                // Silently ignore invalid region filter (don't error, just don't apply it)
                // User will only see their allowed data anyway
            } else {
                queryBuilder.eq('region', clientRegion);
            }
        }

        // Apply sorting and pagination
        queryBuilder.order(sortBy, { ascending: sortOrder });
        queryBuilder.range(offset, offset + limit - 1);

        const { data, error, count } = await queryBuilder.execute();

        if (error) {
            console.error('Cases query error:', error);
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        const totalPages = Math.ceil((count ?? 0) / limit);

        return NextResponse.json({
            data: data ?? [],
            pagination: {
                page,
                limit,
                total: count ?? 0,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error) {
        console.error('Cases API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch cases' } },
            { status: 500 }
        );
    }
};

/**
 * POST /api/cases
 * Create a new case
 * 
 * STEP 3: Human case creation is BLOCKED.
 * Cases can ONLY be created via SYSTEM pipeline.
 * 
 * Manual creation by FEDEX_ADMIN will be enabled in STEP 4.
 * Until then, all case creation must go through:
 *   POST /api/v1/cases/system-create (SYSTEM-only)
 * 
 * Permission: cases:create (but blocked for all humans in STEP 3)
 */
const handleCreateCase: ApiHandler = async (_request, { user }) => {
    // STEP 3: Block ALL human case creation
    // SYSTEM is the ONLY authorized creator
    // FEDEX_ADMIN manual creation will be enabled in STEP 4

    await logUserAction(
        'ACCESS_DENIED',
        user.id,
        user.email,
        'case',
        'N/A',
        {
            action: 'CASE_CREATE_BLOCKED',
            reason: 'Human case creation not allowed in STEP 3',
            user_role: user.role,
            redirect: '/api/v1/cases/system-create',
        }
    );

    return NextResponse.json(
        {
            error: {
                code: 'CASE_CREATION_DISABLED',
                message: 'Human case creation is not permitted. Cases are created automatically via SYSTEM integration.',
                hint: 'Manual case creation by FEDEX_ADMIN will be available in a future update.',
            },
        },
        { status: 403 }
    );
};

// Export wrapped handlers
export const GET = withPermission('cases:read', handleGetCases);
export const POST = withPermission('cases:create', handleCreateCase);
