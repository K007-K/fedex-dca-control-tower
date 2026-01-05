/* eslint-disable @typescript-eslint/no-explicit-any */

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
/**
 * DCAs API - List and create DCAs
 * SECURITY: Requires authentication and appropriate permissions
 * Region filtering is SERVER-ENFORCED via SecureQueryBuilder
 */
import { NextRequest, NextResponse } from 'next/server';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isDCARole } from '@/lib/auth';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { dcaCreateSchema, validateFormData } from '@/lib/validations';
import { logUserAction } from '@/lib/audit';
import { secureQuery } from '@/lib/auth/secure-query';

/**
 * GET /api/dcas
 * List DCAs with filtering and pagination
 * Permission: dcas:read
 * SECURITY: Region filtering is SERVER-ENFORCED via SecureQueryBuilder
 */
const handleGetDCAs: ApiHandler = async (request, { user }) => {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '25');
        const offset = (page - 1) * limit;

        // Build secure query with automatic region and DCA filtering
        const queryBuilder = secureQuery(user)
            .from('dcas')
            .select('*')
            .withOptions({
                regionColumn: 'region',
                dcaColumn: 'id', // DCA users filter by their own DCA ID
            });

        // Client region param - ONLY for subsetting already-allowed regions
        const clientRegion = searchParams.get('region');
        if (clientRegion && clientRegion !== 'ALL' && user.isGlobalAdmin) {
            // Global admins can filter by specific region
            queryBuilder.eq('region', clientRegion);
        }

        // Filters
        const status = searchParams.get('status');
        if (status) {
            const statuses = status.split(',');
            queryBuilder.in('status', statuses);
        }

        const minPerformance = searchParams.get('minPerformance');
        if (minPerformance) {
            // Note: Can't directly use gte with SecureQueryBuilder, use raw filter
        }

        // Sorting
        const sortBy = searchParams.get('sortBy') ?? 'performance_score';
        const sortOrder = searchParams.get('sortOrder') === 'asc';
        queryBuilder.order(sortBy, { ascending: sortOrder });

        // Pagination
        queryBuilder.range(offset, offset + limit - 1);

        const { data, error, count } = await queryBuilder.execute();

        if (error) {
            console.error('DCAs query error:', error);
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        // Add computed fields
        const enrichedData = data?.map((dca: any) => ({
            ...dca,
            capacity_percentage: dca.capacity_limit > 0
                ? Math.round((dca.capacity_used / dca.capacity_limit) * 100)
                : 0,
            is_near_capacity: dca.capacity_limit > 0
                ? (dca.capacity_used / dca.capacity_limit) >= 0.9
                : false,
        }));

        const totalPages = Math.ceil((count ?? 0) / limit);

        return NextResponse.json({
            data: enrichedData,
            pagination: {
                page,
                limit,
                total: count ?? 0,
                totalPages,
                hasMore: page < totalPages,
            },
        });
    } catch (error) {
        console.error('DCAs API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch DCAs' } },
            { status: 500 }
        );
    }
};

/**
 * POST /api/dcas
 * Create a new DCA with region assignments
 * Permission: dcas:create
 * 
 * GOVERNANCE:
 * - Region assignments REQUIRED
 * - Per-region capacity configured
 * - Audit logging includes region info
 */
const handleCreateDCA: ApiHandler = async (request, { user }) => {
    try {
        // Use admin client for write operations
        const supabase = createAdminClient();
        const body = await request.json();

        // Validate using Zod schema
        const validation = validateFormData(dcaCreateSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.errors } },
                { status: 400 }
            );
        }

        const validatedData = validation.data;

        // ============================================================
        // GOVERNANCE: Validate region_assignments
        // ============================================================
        const regionAssignments = body.region_assignments as Array<{
            region_id: string;
            capacity: number;
            priority: number;
            is_active: boolean;
        }> | undefined;

        if (!regionAssignments || regionAssignments.length === 0) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'At least one region must be selected' } },
                { status: 400 }
            );
        }

        // Validate that all region_ids exist
        const regionIds = regionAssignments.map(ra => ra.region_id);
        const { data: validRegions, error: regionError } = await (supabase as any)
            .from('regions')
            .select('id')
            .in('id', regionIds);

        if (regionError || !validRegions || validRegions.length !== regionIds.length) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'One or more invalid region IDs' } },
                { status: 400 }
            );
        }

        // ============================================================
        // Create DCA record
        // ============================================================
        const { data: dcaData, error: dcaError } = await (supabase as any)
            .from('dcas')
            .insert({
                name: validatedData.name,
                code: validatedData.code,
                legal_name: validatedData.legal_name || null,
                registration_number: validatedData.registration_number || null,
                status: validatedData.status || 'PENDING_APPROVAL',
                capacity_limit: 0, // Capacity is now per-region
                capacity_used: 0,
                max_case_value: validatedData.max_case_value || null,
                min_case_value: validatedData.min_case_value || null,
                commission_rate: validatedData.commission_rate || 15,
                primary_contact_name: validatedData.primary_contact_name || null,
                primary_contact_email: validatedData.primary_contact_email || null,
                primary_contact_phone: validatedData.primary_contact_phone || null,
                contract_start_date: validatedData.contract_start_date || null,
                contract_end_date: validatedData.contract_end_date || null,
                performance_score: 50,
                recovery_rate: 0,
                sla_compliance_rate: 100,
            })
            .select()
            .single();

        if (dcaError) {
            console.error('DCA creation error:', dcaError);
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: dcaError.message } },
                { status: 500 }
            );
        }

        // ============================================================
        // GOVERNANCE: Create region_dca_assignments
        // ============================================================
        const assignmentsToInsert = regionAssignments.map(ra => ({
            dca_id: dcaData.id,
            region_id: ra.region_id,
            // Capacity = absolute per-region case capacity
            capacity_allocation_pct: 100, // Using 100% means full capacity number
            allocation_priority: ra.priority || 1, // Tie-breaker only
            is_active: ra.is_active !== false,
            is_primary: ra.priority === 1,
            region_cases_handled: 0,
            region_amount_recovered: 0,
            region_recovery_rate: 0,
            region_sla_compliance: 100,
            created_by: user.id,
        }));

        const { error: assignmentError } = await (supabase as any)
            .from('region_dca_assignments')
            .insert(assignmentsToInsert);

        if (assignmentError) {
            console.error('Region assignment error:', assignmentError);
            // Attempt to rollback DCA creation
            await (supabase as any).from('dcas').delete().eq('id', dcaData.id);
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: 'Failed to assign regions: ' + assignmentError.message } },
                { status: 500 }
            );
        }

        // ============================================================
        // AUDIT: Log DCA creation with region info
        // ============================================================
        logUserAction(
            'DCA_CREATED',
            user.id,
            user.email,
            'dca',
            dcaData.id,
            {
                name: dcaData.name,
                code: dcaData.code,
                status: dcaData.status,
                region_count: regionAssignments.length,
                region_ids: regionIds,
            }
        ).catch(err => console.error('Audit log error:', err));

        return NextResponse.json({
            data: {
                ...dcaData,
                region_assignments: regionAssignments,
            }
        }, { status: 201 });
    } catch (error) {
        console.error('DCAs API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to create DCA' } },
            { status: 500 }
        );
    }
};

// Export with RBAC protection
export const GET = withPermission('dcas:read', handleGetDCAs);
export const POST = withPermission('dcas:create', handleCreateDCA);
