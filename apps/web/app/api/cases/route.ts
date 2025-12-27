/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/cases
 * List cases with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '25');
        const offset = (page - 1) * limit;

        // Sorting
        const sortBy = searchParams.get('sortBy') ?? 'created_at';
        const sortOrder = searchParams.get('sortOrder') === 'asc';

        // Build query
        let query = (supabase as any)
            .from('cases')
            .select('*, assigned_dca:dcas(id, name, status)', { count: 'exact' });

        // Filters
        const status = searchParams.get('status');
        if (status) {
            const statuses = status.split(',');
            query = query.in('status', statuses);
        }

        const priority = searchParams.get('priority');
        if (priority) {
            const priorities = priority.split(',');
            query = query.in('priority', priorities);
        }

        const assignedDcaId = searchParams.get('assignedDcaId');
        if (assignedDcaId) {
            query = query.eq('assigned_dca_id', assignedDcaId);
        }

        const search = searchParams.get('search');
        if (search) {
            query = query.or(`customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%,case_number.ilike.%${search}%`);
        }

        const minAmount = searchParams.get('minAmount');
        if (minAmount) {
            query = query.gte('outstanding_amount', parseFloat(minAmount));
        }

        const maxAmount = searchParams.get('maxAmount');
        if (maxAmount) {
            query = query.lte('outstanding_amount', parseFloat(maxAmount));
        }

        // Apply sorting and pagination
        query = query
            .order(sortBy, { ascending: sortOrder })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

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
}

/**
 * POST /api/cases
 * Create a new case
 */
export async function POST(request: NextRequest) {
    try {
        // Use admin client for write operations to bypass RLS
        const supabase = createAdminClient();
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

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Cases API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to create case' } },
            { status: 500 }
        );
    }
}
