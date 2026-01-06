import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Manager Dashboard API
 * 
 * SCOPE: All cases assigned to agents within manager's DCA
 * ACCESS: DCA_MANAGER role only
 * METRICS: Operational only - no ranking or incentives
 */

export async function GET() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DCA_MANAGER can access this endpoint
    if (user.role !== 'DCA_MANAGER') {
        return NextResponse.json({ error: 'Forbidden - DCA_MANAGER only' }, { status: 403 });
    }

    const supabase = createAdminClient();

    try {
        // Get manager's DCA
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: managerProfile } = await (supabase as any)
            .from('users')
            .select('dca_id')
            .eq('id', user.id)
            .single();

        if (!managerProfile?.dca_id) {
            return NextResponse.json({ error: 'Manager not assigned to a DCA' }, { status: 400 });
        }

        const dcaId = managerProfile.dca_id;

        // Get all agents in this DCA
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: agents } = await (supabase as any)
            .from('users')
            .select('id, full_name, email')
            .eq('dca_id', dcaId)
            .eq('role', 'DCA_AGENT');

        const agentIds = agents?.map((a: { id: string }) => a.id) || [];

        // Get team cases (excluding closed/recovered)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: teamCases } = await (supabase as any)
            .from('cases')
            .select('id, status, outstanding_amount, currency, assigned_agent_id')
            .in('assigned_agent_id', agentIds.length > 0 ? agentIds : ['null'])
            .not('status', 'in', '(CLOSED,FULL_RECOVERY)');

        const totalCases = teamCases?.length ?? 0;

        // Calculate workload distribution per agent (operational, not ranking)
        const agentWorkload: Record<string, { name: string; caseCount: number; activeAmount: number }> = {};
        agents?.forEach((agent: { id: string; full_name: string }) => {
            agentWorkload[agent.id] = {
                name: agent.full_name || 'Unknown',
                caseCount: 0,
                activeAmount: 0,
            };
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teamCases?.forEach((c: any) => {
            if (c.assigned_agent_id && agentWorkload[c.assigned_agent_id]) {
                agentWorkload[c.assigned_agent_id].caseCount++;
                agentWorkload[c.assigned_agent_id].activeAmount += c.outstanding_amount || 0;
            }
        });

        // Get SLA data for team cases
        const caseIds = teamCases?.map((c: { id: string }) => c.id) || [];

        let slaDueSoon = 0;
        let slaBreached = 0;
        let atRiskCases: Array<{
            id: string;
            case_number: string;
            customer_name: string;
            agent_name: string;
            hours_remaining: number;
            is_breached: boolean;
        }> = [];

        if (caseIds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: slaLogs } = await (supabase as any)
                .from('sla_logs')
                .select(`
                    id,
                    case_id,
                    status,
                    due_at,
                    cases!inner(id, case_number, customer_name, assigned_agent_id)
                `)
                .in('case_id', caseIds)
                .in('status', ['PENDING', 'BREACHED']);

            const now = new Date();
            const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            slaLogs?.forEach((log: any) => {
                const dueAt = new Date(log.due_at);
                const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
                const agentName = agentWorkload[log.cases.assigned_agent_id]?.name || 'Unassigned';

                if (log.status === 'BREACHED' || hoursRemaining < 0) {
                    slaBreached++;
                    atRiskCases.push({
                        id: log.cases.id,
                        case_number: log.cases.case_number,
                        customer_name: log.cases.customer_name,
                        agent_name: agentName,
                        hours_remaining: hoursRemaining,
                        is_breached: true,
                    });
                } else if (dueAt <= in24Hours) {
                    slaDueSoon++;
                    atRiskCases.push({
                        id: log.cases.id,
                        case_number: log.cases.case_number,
                        customer_name: log.cases.customer_name,
                        agent_name: agentName,
                        hours_remaining: hoursRemaining,
                        is_breached: false,
                    });
                }
            });

            // Sort by urgency (breached first, then by hours remaining)
            atRiskCases.sort((a, b) => {
                if (a.is_breached !== b.is_breached) return a.is_breached ? -1 : 1;
                return a.hours_remaining - b.hours_remaining;
            });
        }

        // Get stuck cases (no activity in 48 hours)
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: stuckCases } = await (supabase as any)
            .from('cases')
            .select('id, case_number, customer_name, status, updated_at, assigned_agent_id')
            .in('assigned_agent_id', agentIds.length > 0 ? agentIds : ['null'])
            .not('status', 'in', '(CLOSED,FULL_RECOVERY)')
            .lt('updated_at', twoDaysAgo)
            .limit(10);

        const stuckCasesWithAgent = (stuckCases || []).map((c: any) => ({
            ...c,
            agent_name: agentWorkload[c.assigned_agent_id]?.name || 'Unassigned',
        }));

        // Get DCA name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dcaInfo } = await (supabase as any)
            .from('dcas')
            .select('name')
            .eq('id', dcaId)
            .single();

        return NextResponse.json({
            dcaName: dcaInfo?.name || 'Your DCA',
            teamKPIs: {
                totalAgents: agents?.length ?? 0,
                totalCases,
                slaDueSoon,
                slaBreached,
            },
            agentWorkload: Object.values(agentWorkload),
            atRiskCases: atRiskCases.slice(0, 10),
            stuckCases: stuckCasesWithAgent,
        });

    } catch (error) {
        console.error('Manager dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
