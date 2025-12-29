import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

interface BulkRequest {
    case_ids: string[];
    operation: 'update_status' | 'assign_dca' | 'export';
    status?: string;
    dca_id?: string;
}

/**
 * POST /api/cases/bulk - Perform bulk operations on cases
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body: BulkRequest = await request.json();

        const { case_ids, operation, status, dca_id } = body;

        if (!case_ids || !Array.isArray(case_ids) || case_ids.length === 0) {
            return NextResponse.json(
                { error: 'case_ids must be a non-empty array' },
                { status: 400 }
            );
        }

        if (!operation) {
            return NextResponse.json(
                { error: 'operation is required' },
                { status: 400 }
            );
        }

        switch (operation) {
            case 'update_status': {
                if (!status) {
                    return NextResponse.json(
                        { error: 'status is required for update_status operation' },
                        { status: 400 }
                    );
                }

                const { data, error } = await supabase
                    .from('cases')
                    .update({
                        status,
                        updated_at: new Date().toISOString()
                    })
                    .in('id', case_ids)
                    .select('id, case_number, status');

                if (error) throw error;

                return NextResponse.json({
                    message: `Updated ${data?.length || 0} cases to status: ${status}`,
                    updated: data?.length || 0,
                    cases: data,
                });
            }

            case 'assign_dca': {
                if (!dca_id) {
                    return NextResponse.json(
                        { error: 'dca_id is required for assign_dca operation' },
                        { status: 400 }
                    );
                }

                // Verify DCA exists and is active
                const { data: dca, error: dcaError } = await supabase
                    .from('dcas')
                    .select('id, name, status')
                    .eq('id', dca_id)
                    .single();

                if (dcaError || !dca) {
                    return NextResponse.json(
                        { error: 'DCA not found' },
                        { status: 404 }
                    );
                }

                if (dca.status !== 'ACTIVE') {
                    return NextResponse.json(
                        { error: 'DCA is not active' },
                        { status: 400 }
                    );
                }

                const { data, error } = await supabase
                    .from('cases')
                    .update({
                        assigned_dca_id: dca_id,
                        assigned_at: new Date().toISOString(),
                        assignment_method: 'BULK_ASSIGNED',
                        status: 'ALLOCATED',
                        updated_at: new Date().toISOString(),
                    })
                    .in('id', case_ids)
                    .select('id, case_number');

                if (error) throw error;

                return NextResponse.json({
                    message: `Assigned ${data?.length || 0} cases to ${dca.name}`,
                    updated: data?.length || 0,
                    dca_name: dca.name,
                    cases: data,
                });
            }

            case 'export': {
                // Fetch full case data for export
                const { data, error } = await supabase
                    .from('cases')
                    .select(`
                        case_number,
                        status,
                        outstanding_amount,
                        customer_name,
                        customer_email,
                        customer_phone,
                        customer_segment,
                        customer_industry,
                        days_past_due,
                        created_at,
                        assigned_dca:dcas(name)
                    `)
                    .in('id', case_ids);

                if (error) throw error;

                // Format for CSV
                const exportData = (data || []).map(c => ({
                    case_number: c.case_number,
                    status: c.status,
                    outstanding_amount: c.outstanding_amount,
                    customer_name: c.customer_name,
                    customer_email: c.customer_email,
                    customer_phone: c.customer_phone,
                    customer_segment: c.customer_segment,
                    customer_industry: c.customer_industry,
                    days_past_due: c.days_past_due,
                    assigned_dca: (c.assigned_dca as { name: string } | null)?.name ?? 'Unassigned',
                    created_at: c.created_at,
                }));

                return NextResponse.json({
                    message: `Exported ${exportData.length} cases`,
                    data: exportData,
                    count: exportData.length,
                });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown operation: ${operation}` },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Bulk operation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
