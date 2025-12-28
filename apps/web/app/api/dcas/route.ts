/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/dcas
 * List DCAs with filtering and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') ?? '1');
        const limit = parseInt(searchParams.get('limit') ?? '25');
        const offset = (page - 1) * limit;

        // Build query
        let query = (supabase as any)
            .from('dcas')
            .select('*', { count: 'exact' });

        // Filters
        const status = searchParams.get('status');
        if (status) {
            const statuses = status.split(',');
            query = query.in('status', statuses);
        }

        const search = searchParams.get('search');
        if (search) {
            query = query.or(`name.ilike.%${search}%,primary_contact_name.ilike.%${search}%`);
        }

        const minPerformance = searchParams.get('minPerformance');
        if (minPerformance) {
            query = query.gte('performance_score', parseFloat(minPerformance));
        }

        // Sorting
        const sortBy = searchParams.get('sortBy') ?? 'performance_score';
        const sortOrder = searchParams.get('sortOrder') === 'asc';
        query = query.order(sortBy, { ascending: sortOrder });

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

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
}

/**
 * POST /api/dcas
 * Create a new DCA
 */
export async function POST(request: NextRequest) {
    try {
        // Use admin client for write operations
        const supabase = createAdminClient();
        const body = await request.json();

        // Only name is truly required
        if (!body.name) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'DCA name is required' } },
                { status: 400 }
            );
        }

        const { data, error } = await (supabase as any)
            .from('dcas')
            .insert({
                name: body.name,
                legal_name: body.legal_name || null,
                registration_number: body.registration_number || null,
                status: body.status || 'PENDING_APPROVAL',
                capacity_limit: body.capacity_limit || 100,
                capacity_used: 0,
                max_case_value: body.max_case_value || null,
                min_case_value: body.min_case_value || null,
                specializations: body.specializations || null,
                geographic_coverage: body.geographic_coverage || null,
                commission_rate: body.commission_rate || 15,
                primary_contact_name: body.primary_contact_name || null,
                primary_contact_email: body.primary_contact_email || null,
                primary_contact_phone: body.primary_contact_phone || null,
                performance_score: 50,
                recovery_rate: 0,
                sla_compliance_rate: 100,
            })
            .select()
            .single();

        if (error) {
            console.error('DCA creation error:', error);
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('DCAs API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to create DCA' } },
            { status: 500 }
        );
    }
}
