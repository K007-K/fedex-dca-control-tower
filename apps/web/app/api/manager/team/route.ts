import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Manager Team API
 * 
 * SCOPE: All agents within manager's DCA
 * ACCESS: DCA_MANAGER role only
 * METRICS: Operational only - cases assigned, resolved, SLA adherence
 * 
 * ❌ NO cross-agent ranking
 * ❌ NO incentive/commission display
 * ✅ Informational, not evaluative
 */

export async function GET() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        const { data: agents, error: agentsError } = await (supabase as any)
            .from('users')
            .select('id, full_name, email, phone, created_at')
            .eq('dca_id', dcaId)
            .eq('role', 'DCA_AGENT')
            .order('full_name');

        if (agentsError) {
            console.error('Agents fetch error:', agentsError);
            return NextResponse.json({ error: agentsError.message }, { status: 500 });
        }

        // Get case counts per agent
        const agentIds = agents?.map((a: { id: string }) => a.id) || [];

        // Active cases (excluding closed/recovered)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: activeCases } = await (supabase as any)
            .from('cases')
            .select('id, assigned_agent_id')
            .in('assigned_agent_id', agentIds.length > 0 ? agentIds : ['null'])
            .not('status', 'in', '(CLOSED,FULL_RECOVERY,WRITTEN_OFF)');

        // Resolved cases (full or partial recovery)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: resolvedCases } = await (supabase as any)
            .from('cases')
            .select('id, assigned_agent_id, status')
            .in('assigned_agent_id', agentIds.length > 0 ? agentIds : ['null'])
            .in('status', ['FULL_RECOVERY', 'PARTIAL_RECOVERY']);

        // Calculate metrics per agent (operational, not ranking)
        const agentMetrics: Record<string, { activeCases: number; resolvedCases: number }> = {};
        agentIds.forEach((id: string) => {
            agentMetrics[id] = { activeCases: 0, resolvedCases: 0 };
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeCases?.forEach((c: any) => {
            if (agentMetrics[c.assigned_agent_id]) {
                agentMetrics[c.assigned_agent_id].activeCases++;
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolvedCases?.forEach((c: any) => {
            if (agentMetrics[c.assigned_agent_id]) {
                agentMetrics[c.assigned_agent_id].resolvedCases++;
            }
        });

        // Get SLA breaches per agent (past 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: slaBreaches } = await (supabase as any)
            .from('sla_logs')
            .select(`
                id,
                case_id,
                status,
                cases!inner(assigned_agent_id)
            `)
            .eq('status', 'BREACHED')
            .gte('created_at', thirtyDaysAgo);

        const breachCount: Record<string, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slaBreaches?.forEach((log: any) => {
            const agentId = log.cases?.assigned_agent_id;
            if (agentId && agentMetrics[agentId]) {
                breachCount[agentId] = (breachCount[agentId] || 0) + 1;
            }
        });

        // Build team list (OPERATIONAL metrics, no ranking)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const team = agents?.map((agent: any) => ({
            id: agent.id,
            name: agent.full_name || 'Unknown',
            email: agent.email,
            phone: agent.phone,
            joinedAt: agent.created_at,
            // Operational metrics (informational, not evaluative)
            metrics: {
                activeCases: agentMetrics[agent.id]?.activeCases ?? 0,
                resolvedCases: agentMetrics[agent.id]?.resolvedCases ?? 0,
                slaBreaches30d: breachCount[agent.id] ?? 0,
            },
        })) || [];

        // Get DCA name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dcaInfo } = await (supabase as any)
            .from('dcas')
            .select('name')
            .eq('id', dcaId)
            .single();

        return NextResponse.json({
            dcaName: dcaInfo?.name || 'Your DCA',
            team,
            summary: {
                totalAgents: team.length,
                activeAgents: team.length, // All agents returned are active
                totalActiveCases: activeCases?.length ?? 0,
                totalResolved: resolvedCases?.length ?? 0,
            },
        });

    } catch (error) {
        console.error('Manager team API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
