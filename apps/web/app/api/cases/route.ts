/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isDCARole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
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
            data,
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
 * Permission: cases:create
 */
const handleCreateCase: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Validate required fields - only customer_name and original_amount are truly required
        if (!body.customer_name) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Customer name is required' } },
                { status: 400 }
            );
        }

        if (!body.original_amount || body.original_amount <= 0) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'Valid original amount is required' } },
                { status: 400 }
            );
        }

        // Generate case number if not provided
        const caseNumber = body.case_number || `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

        // Build customer_contact JSONB if email/phone provided
        const customerContact = body.customer_contact || {};
        if (body.customer_email) customerContact.email = body.customer_email;
        if (body.customer_phone) customerContact.phone = body.customer_phone;

        const { data, error } = await (supabase as any)
            .from('cases')
            .insert({
                case_number: caseNumber,
                invoice_number: body.invoice_number || caseNumber,
                invoice_date: body.invoice_date || new Date().toISOString().split('T')[0],
                due_date: body.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                original_amount: body.original_amount,
                outstanding_amount: body.outstanding_amount ?? body.original_amount,
                currency: body.currency ?? 'USD',
                customer_id: body.customer_id || `CUST-${Date.now()}`,
                customer_name: body.customer_name,
                customer_type: body.customer_type,
                customer_segment: body.customer_segment,
                customer_industry: body.customer_industry,
                customer_country: body.customer_country || 'US',
                customer_state: body.customer_state,
                customer_city: body.customer_city,
                customer_contact: Object.keys(customerContact).length > 0 ? customerContact : null,
                priority: body.priority ?? 'MEDIUM',
                status: body.status ?? 'PENDING_ALLOCATION',
                assigned_dca_id: body.assigned_dca_id || null,
                internal_notes: body.notes || body.internal_notes,
                tags: body.tags,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Case creation error:', error);
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        // Auto-create SLA for the new case (P0-3 fix)
        if (data) {
            await createDefaultSLA(supabase, data.id);

            // Log audit event for case creation
            logUserAction(
                'CASE_CREATED',
                user.id,
                user.email,
                'case',
                data.id,
                {
                    case_number: data.case_number,
                    customer_name: data.customer_name,
                    original_amount: data.original_amount,
                    priority: data.priority,
                }
            ).catch(err => console.error('Audit log error:', err));
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Cases API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to create case' } },
            { status: 500 }
        );
    }
};

/**
 * Helper: Create default SLA for a new case (P0-3 fix)
 */
async function createDefaultSLA(supabase: any, caseId: string) {
    try {
        // Get default SLA template for FIRST_CONTACT
        const { data: template } = await supabase
            .from('sla_templates')
            .select('*')
            .eq('sla_type', 'FIRST_CONTACT')
            .eq('is_active', true)
            .limit(1)
            .single();

        const durationHours = template?.duration_hours ?? 24;
        const now = new Date();
        const dueAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

        await supabase.from('sla_logs').insert({
            case_id: caseId,
            sla_template_id: template?.id ?? null,
            sla_type: 'FIRST_CONTACT',
            started_at: now.toISOString(),
            due_at: dueAt.toISOString(),
            status: 'PENDING',
        });
    } catch (error) {
        console.error('Failed to create default SLA:', error);
        // Don't fail case creation if SLA fails
    }
}

// Export wrapped handlers
export const GET = withPermission('cases:read', handleGetCases);
export const POST = withPermission('cases:create', handleCreateCase);
