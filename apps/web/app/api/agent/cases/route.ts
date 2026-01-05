import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Agent Cases API
 * 
 * SCOPE: Only cases where assigned_agent_id = current user
 * ACCESS: DCA_AGENT role only
 * Uses admin client to bypass RLS (user auth is handled separately)
 */

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DCA_AGENT can access this endpoint
    if (user.role !== 'DCA_AGENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const agentId = user.id;

    // Get query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const isHistory = searchParams.get('history') === 'true';

    try {
        // Build query - strictly scoped to agent's assigned cases
        let query = supabase
            .from('cases')
            .select('id, case_number, customer_name, outstanding_amount, original_amount, recovered_amount, status, currency, updated_at, created_at, priority')
            .eq('assigned_agent_id', agentId);

        // For history view, only show closed/recovered cases
        // For regular view, exclude closed/recovered cases (unless status filter is applied)
        if (isHistory) {
            // History mode: only show completed cases
            if (statusFilter) {
                query = query.eq('status', statusFilter);
            } else {
                query = query.in('status', ['FULL_RECOVERY', 'PARTIAL_RECOVERY', 'CLOSED']);
            }
        } else {
            // Regular mode: exclude closed cases unless specifically filtered
            if (statusFilter) {
                query = query.eq('status', statusFilter);
            } else {
                query = query.not('status', 'in', '(CLOSED,FULL_RECOVERY)');
            }
        }

        // Order by updated_at descending
        query = query.order('updated_at', { ascending: false });

        const { data: cases, error: casesError } = await query;

        if (casesError) {
            console.error('Agent cases fetch error:', casesError);
            return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
        }

        // Try to get SLA data from sla_logs - but don't fail if table doesn't exist
        const caseIds = cases?.map((c: { id: string }) => c.id) || [];
        let slaMap: Record<string, { due_at: string; hours_remaining: number; status: string }> = {};

        if (caseIds.length > 0) {
            const { data: slaLogs, error: slaError } = await supabase
                .from('sla_logs')
                .select('case_id, due_at, status')
                .in('case_id', caseIds)
                .in('status', ['PENDING', 'BREACHED']);

            const now = new Date();

            if (!slaError && slaLogs) {
                slaLogs.forEach((log) => {
                    const dueAt = new Date(log.due_at);
                    const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

                    // Only keep the most urgent SLA per case
                    if (!slaMap[log.case_id] || hoursRemaining < slaMap[log.case_id].hours_remaining) {
                        slaMap[log.case_id] = {
                            due_at: log.due_at,
                            hours_remaining: hoursRemaining,
                            status: log.status
                        };
                    }
                });
            }
        }

        // Enrich cases with SLA data (use fallback calculation if no sla_logs)
        const now = new Date();
        const enrichedCases = cases?.map((c) => {
            // If we have real SLA data, use it
            if (slaMap[c.id]) {
                return {
                    ...c,
                    sla_due_at: slaMap[c.id].due_at,
                    hours_remaining: slaMap[c.id].hours_remaining,
                    sla_status: slaMap[c.id].status
                };
            }

            // Fallback: calculate SLA based on case creation date (5 days default)
            const createdAt = new Date(c.created_at);
            const defaultSlaDays = 5;
            const dueAt = new Date(createdAt.getTime() + defaultSlaDays * 24 * 60 * 60 * 1000);
            const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

            return {
                ...c,
                sla_due_at: dueAt.toISOString(),
                hours_remaining: hoursRemaining,
                sla_status: hoursRemaining < 0 ? 'BREACHED' : 'PENDING'
            };
        }) || [];

        return NextResponse.json({
            cases: enrichedCases,
            total: enrichedCases.length,
        });

    } catch (error) {
        console.error('Agent cases API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
