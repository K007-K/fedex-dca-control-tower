import { NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';

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
                // Use admin client for export (read-only, safe to bypass RLS)
                const adminClient = createAdminClient();

                // Fetch all case data using SELECT *
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: casesData, error: casesError } = await (adminClient as any)
                    .from('cases')
                    .select('*')
                    .in('id', case_ids);

                if (casesError) throw casesError;

                // Get unique DCA IDs and fetch names
                const dcaIds = [...new Set((casesData || [])
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((c: any) => c.assigned_dca_id)
                    .filter(Boolean))] as string[];

                let dcaMap: Record<string, string> = {};
                if (dcaIds.length > 0) {
                    const { data: dcasData } = await adminClient
                        .from('dcas')
                        .select('id, name')
                        .in('id', dcaIds);

                    dcaMap = (dcasData || []).reduce((acc, dca) => {
                        acc[dca.id] = dca.name;
                        return acc;
                    }, {} as Record<string, string>);
                }

                // Format for CSV - use optional chaining for safe access
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const exportData = (casesData || []).map((c: any) => ({
                    case_number: c.case_number || '',
                    status: c.status || '',
                    priority: c.priority || '',
                    outstanding_amount: c.outstanding_amount || 0,
                    recovered_amount: c.recovered_amount || 0,
                    customer_name: c.customer_name || '',
                    customer_segment: c.customer_segment || '',
                    customer_industry: c.customer_industry || '',
                    assigned_dca: c.assigned_dca_id ? (dcaMap[c.assigned_dca_id] ?? 'Unknown') : 'Unassigned',
                    created_at: c.created_at || '',
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
