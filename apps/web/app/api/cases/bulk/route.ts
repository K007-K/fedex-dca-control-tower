import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

interface BulkRequest {
    case_ids: string[];
    operation: 'update_status' | 'assign_dca' | 'export';
    status?: string;
    dca_id?: string;
}

/**
 * POST /api/cases/bulk - Perform bulk operations on cases
 * Permission: cases:bulk (FEDEX_ADMIN, FEDEX_MANAGER only)
 */
const handleBulkOperation: ApiHandler = async (request: NextRequest, { user }) => {
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
                // ============================================================
                // SECURITY: BLOCK MANUAL DCA ASSIGNMENT
                // ============================================================
                // DCA assignment is a SYSTEM-ONLY operation.
                // Humans CANNOT assign DCAs through any endpoint.
                // Assignment is performed ONLY by the SYSTEM allocation service:
                //   POST /api/cases/allocate (SYSTEM-auth required)
                // ============================================================

                const { logSecurityEvent } = await import('@/lib/audit');
                await logSecurityEvent(
                    'PERMISSION_DENIED',
                    user.id,
                    {
                        action: 'BULK_ASSIGNMENT_BLOCKED',
                        reason: 'Human attempted bulk DCA assignment - SYSTEM-only operation',
                        user_role: user.role,
                        user_email: user.email,
                        case_ids: case_ids,
                        attempted_dca_id: dca_id,
                        endpoint: '/api/cases/bulk',
                    },
                    request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
                );

                return NextResponse.json(
                    {
                        error: {
                            code: 'SYSTEM_ONLY_OPERATION',
                            message: 'DCA assignment is controlled exclusively by SYSTEM. Bulk manual assignment is not permitted.',
                            hint: 'Cases are automatically assigned to DCAs by the SYSTEM allocation engine based on capacity and performance metrics.',
                        },
                    },
                    { status: 403 }
                );
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
};

// Protected with cases:bulk permission
export const POST = withPermission('cases:bulk', handleBulkOperation);
