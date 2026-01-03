/* eslint-disable @typescript-eslint/no-explicit-any */

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isDCARole } from '@/lib/auth';
import { logUserAction, logSecurityEvent } from '@/lib/audit';
import { secureQuery } from '@/lib/auth/secure-query';
import { createClient } from '@/lib/supabase/server';
import { allocateCase } from '@/lib/allocation';

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
 * Create a new case (MANUAL)
 * 
 * GOVERNANCE RULES:
 * - ONLY FEDEX_ADMIN can create cases manually
 * - DCA assignment is ALWAYS done by SYSTEM (human input ignored)
 * - Agent assignment is ALWAYS done by SYSTEM
 * - actor_type = HUMAN, created_source = MANUAL
 * 
 * Permission: cases:create (FEDEX_ADMIN only)
 */
const handleCreateCase: ApiHandler = async (request, { user }) => {
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

    // ============================================================
    // GOVERNANCE CHECK: FEDEX_ADMIN ONLY
    // ============================================================
    if (user.role !== 'FEDEX_ADMIN') {
        await logSecurityEvent(
            'PERMISSION_DENIED',
            user.id,
            {
                action: 'CASE_CREATE_BLOCKED',
                reason: 'Only FEDEX_ADMIN can create cases manually',
                user_role: user.role,
                user_email: user.email,
            },
            ipAddress
        );

        return NextResponse.json(
            {
                error: {
                    code: 'FEDEX_ADMIN_ONLY',
                    message: 'Manual case creation is restricted to FEDEX_ADMIN role only.',
                    hint: 'Cases are primarily created automatically by SYSTEM. Manual creation is for exceptional scenarios only.',
                },
            },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const supabase = await createClient();

        // ============================================================
        // VALIDATION
        // ============================================================
        if (!body.customer_name?.trim()) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Customer name is required' } },
                { status: 400 }
            );
        }

        if (!body.original_amount || parseFloat(body.original_amount) <= 0) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Valid original amount is required' } },
                { status: 400 }
            );
        }

        if (!body.notes?.trim()) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Justification notes are required for manual case creation' } },
                { status: 400 }
            );
        }

        // ============================================================
        // SECURITY: STRIP SYSTEM-ONLY FIELDS FROM INPUT
        // ============================================================
        // Humans cannot set: assigned_dca_id, assigned_agent_id
        // These fields are ALWAYS set by SYSTEM allocation
        if (body.assigned_dca_id || body.assigned_agent_id) {
            await logSecurityEvent(
                'PERMISSION_DENIED',
                user.id,
                {
                    action: 'ASSIGNMENT_FIELD_STRIPPED',
                    reason: 'Human attempted to set SYSTEM-only assignment fields',
                    stripped_fields: {
                        assigned_dca_id: body.assigned_dca_id,
                        assigned_agent_id: body.assigned_agent_id,
                    },
                },
                ipAddress
            );
        }

        // Generate case number
        const caseNumber = `CASE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Determine region (default to user's region or AMERICAS)
        const region = body.region || 'AMERICAS';

        // Get region_id from region code
        const { data: regionData } = await (supabase as any)
            .from('regions')
            .select('id')
            .eq('code', region)
            .single();

        // ============================================================
        // CREATE CASE (HUMAN/MANUAL)
        // ============================================================
        const { data: newCase, error: insertError } = await (supabase as any)
            .from('cases')
            .insert({
                case_number: caseNumber,
                customer_name: body.customer_name.trim(),
                customer_id: body.customer_id?.trim() || null,
                customer_email: body.customer_email?.trim() || null,
                customer_phone: body.customer_phone?.trim() || null,
                original_amount: parseFloat(body.original_amount),
                outstanding_amount: parseFloat(body.original_amount),
                priority: body.priority || 'MEDIUM',
                status: 'PENDING_ALLOCATION', // Always pending - SYSTEM will allocate
                region: region,
                region_id: regionData?.id || null,
                // GOVERNANCE: Mark as human-created
                actor_type: 'HUMAN',
                created_source: 'MANUAL',
                created_by: user.id,
                created_by_role: user.role,
                internal_notes: body.notes?.trim(),
                // GOVERNANCE: NEVER set by human
                assigned_dca_id: null,
                assigned_agent_id: null,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Case creation error:', insertError);
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: insertError.message } },
                { status: 500 }
            );
        }

        // ============================================================
        // AUDIT LOG: HUMAN CASE CREATION
        // ============================================================
        await logUserAction(
            'CASE_CREATED',
            user.id,
            user.email,
            'case',
            newCase.id,
            {
                case_number: caseNumber,
                actor_type: 'HUMAN',
                created_source: 'MANUAL',
                created_by_role: user.role,
                justification: body.notes?.trim(),
                original_amount: body.original_amount,
                region: region,
            }
        );

        // ============================================================
        // SYSTEM AUTO-ALLOCATION (ASYNC)
        // ============================================================
        // Trigger SYSTEM allocation in background
        allocateCase({
            id: newCase.id,
            case_number: caseNumber,
            region_id: regionData?.id || '',
            region_code: region,
            priority: body.priority || 'MEDIUM',
            total_due: parseFloat(body.original_amount),
        }, 'MANUAL_CASE_ALLOCATION').catch(err => {
            console.error('Auto-allocation failed:', err);
            // Case remains in PENDING_ALLOCATION - can be retried
        });

        return NextResponse.json({
            data: newCase,
            message: 'Case created successfully. DCA assignment will be performed automatically by SYSTEM.',
        });

    } catch (error) {
        console.error('Case creation error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to create case' } },
            { status: 500 }
        );
    }
};

// Export wrapped handlers
export const GET = withPermission('cases:read', handleGetCases);
export const POST = withPermission('cases:create', handleCreateCase);

