import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Manager Cases API
 * 
 * SCOPE: All cases assigned to agents within manager's DCA
 * ACCESS: DCA_MANAGER role only
 * SUPPORTS: Filtering by agent, status, SLA risk
 */

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_MANAGER') {
        return NextResponse.json({ error: 'Forbidden - DCA_MANAGER only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const agentFilter = searchParams.get('agent_id');
    const statusFilter = searchParams.get('status');
    const slaRisk = searchParams.get('sla_risk'); // 'at_risk', 'breached', 'normal'
    const history = searchParams.get('history') === 'true';

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

        const agentMap: Record<string, { name: string; email: string }> = {};
        agents?.forEach((a: { id: string; full_name: string; email: string }) => {
            agentMap[a.id] = { name: a.full_name || 'Unknown', email: a.email };
        });

        let agentIds = Object.keys(agentMap);

        // Apply agent filter
        if (agentFilter && agentIds.includes(agentFilter)) {
            agentIds = [agentFilter];
        }

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('cases')
            .select(`
                id,
                case_number,
                customer_name,
                status,
                outstanding_amount,
                currency,
                assigned_agent_id,
                created_at,
                updated_at
            `)
            .in('assigned_agent_id', agentIds.length > 0 ? agentIds : ['null'])
            .order('updated_at', { ascending: false });

        // Status filter
        if (history) {
            query = query.in('status', ['FULL_RECOVERY', 'PARTIAL_RECOVERY', 'CLOSED', 'WRITTEN_OFF']);
        } else if (statusFilter) {
            query = query.eq('status', statusFilter);
        } else {
            query = query.not('status', 'in', '(CLOSED,FULL_RECOVERY,WRITTEN_OFF)');
        }

        const { data: cases, error } = await query.limit(100);

        if (error) {
            console.error('Cases fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Add agent info to cases
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let enrichedCases = (cases || []).map((c: any) => ({
            ...c,
            agent_name: agentMap[c.assigned_agent_id]?.name || 'Unassigned',
            agent_email: agentMap[c.assigned_agent_id]?.email || null,
        }));

        // Get SLA data for these cases
        const caseIds = cases?.map((c: { id: string }) => c.id) || [];
        const slaMap: Record<string, { due_at: string; status: string; hours_remaining: number }> = {};

        if (caseIds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: slaLogs } = await (supabase as any)
                .from('sla_logs')
                .select('case_id, due_at, status')
                .in('case_id', caseIds)
                .in('status', ['PENDING', 'BREACHED']);

            const now = new Date();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            slaLogs?.forEach((log: any) => {
                const dueAt = new Date(log.due_at);
                const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
                slaMap[log.case_id] = {
                    due_at: log.due_at,
                    status: log.status,
                    hours_remaining: hoursRemaining,
                };
            });
        }

        // Add SLA info and apply SLA filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        enrichedCases = enrichedCases.map((c: any) => ({
            ...c,
            sla: slaMap[c.id] || null,
        }));

        // SLA risk filter
        if (slaRisk === 'breached') {
            enrichedCases = enrichedCases.filter((c: any) => c.sla?.status === 'BREACHED' || c.sla?.hours_remaining < 0);
        } else if (slaRisk === 'at_risk') {
            enrichedCases = enrichedCases.filter((c: any) => c.sla && c.sla.hours_remaining > 0 && c.sla.hours_remaining < 24);
        }

        return NextResponse.json({
            cases: enrichedCases,
            agents: Object.entries(agentMap).map(([id, info]) => ({ id, ...info })),
            count: enrichedCases.length,
        });

    } catch (error) {
        console.error('Manager cases API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
