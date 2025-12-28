/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/dcas/[id]
 * Get DCA details with performance metrics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const result = await (supabase as any)
            .from('dcas')
            .select('*')
            .eq('id', id)
            .single();

        if (result.error) {
            if (result.error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'DCA not found' } },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: result.error.message } },
                { status: 500 }
            );
        }

        const data = result.data;

        // Get case statistics for this DCA
        const caseResult = await (supabase as any)
            .from('cases')
            .select('status, outstanding_amount, recovered_amount')
            .eq('assigned_dca_id', id);

        const caseStats = caseResult.data ?? [];
        const stats = {
            totalCases: caseStats.length,
            activeCases: caseStats.filter((c: any) => !['CLOSED', 'WRITTEN_OFF', 'FULL_RECOVERY'].includes(c.status)).length,
            totalOutstanding: caseStats.reduce((sum: number, c: any) => sum + (c.outstanding_amount ?? 0), 0),
            totalRecovered: caseStats.reduce((sum: number, c: any) => sum + (c.recovered_amount ?? 0), 0),
        };

        const enrichedData = {
            ...data,
            capacity_percentage: data.capacity_limit > 0
                ? Math.round((data.capacity_used / data.capacity_limit) * 100)
                : 0,
            is_near_capacity: data.capacity_limit > 0
                ? (data.capacity_used / data.capacity_limit) >= 0.9
                : false,
            case_stats: stats,
        };

        return NextResponse.json({ data: enrichedData });
    } catch (error) {
        console.error('DCA API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch DCA' } },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/dcas/[id]
 * Update DCA details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        // Use admin client for write operations
        const supabase = createAdminClient();
        const body = await request.json();

        const updateData: Record<string, any> = {};
        const allowedFields = [
            'name', 'legal_name', 'registration_number', 'status', 'capacity_limit', 'max_case_value', 'min_case_value',
            'specializations', 'geographic_coverage', 'commission_rate',
            'primary_contact_name', 'primary_contact_email', 'primary_contact_phone',
            'license_expiry', 'insurance_valid_until', 'contract_start_date', 'contract_end_date'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update' } },
                { status: 400 }
            );
        }

        updateData['updated_at'] = new Date().toISOString();

        const result = await (supabase as any)
            .from('dcas')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (result.error) {
            if (result.error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'DCA not found' } },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: result.error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: result.data });
    } catch (error) {
        console.error('DCA API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to update DCA' } },
            { status: 500 }
        );
    }
}
