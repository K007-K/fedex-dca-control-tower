import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Manager Case Detail API
 * 
 * Returns detailed case info including:
 * - Case data
 * - Activity timeline
 * - SLA information
 * - Assigned agent details
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    const caseId = resolvedParams.id;

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

        // Get case data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: caseData, error: caseError } = await (supabase as any)
            .from('cases')
            .select('*')
            .eq('id', caseId)
            .single();

        if (caseError || !caseData) {
            console.error('Case fetch error:', caseError);
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }


        // Get all agents in this DCA for reassignment options AND access verification
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: agents } = await (supabase as any)
            .from('users')
            .select('id, full_name, email')
            .eq('dca_id', dcaId)
            .eq('role', 'DCA_AGENT');

        const agentIds = (agents || []).map((a: { id: string }) => a.id);

        // Verify case is in manager's DCA by checking if assigned agent is in DCA
        if (caseData.assigned_agent_id && !agentIds.includes(caseData.assigned_agent_id)) {
            // Also check assigned_dca_id as fallback
            if (caseData.assigned_dca_id !== dcaId) {
                return NextResponse.json({ error: 'Case not in your DCA' }, { status: 403 });
            }
        }

        // Get agent profile if assigned
        let agentProfile = null;
        if (caseData.assigned_agent_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: agent } = await (supabase as any)
                .from('users')
                .select('id, full_name, email, phone, dca_id')
                .eq('id', caseData.assigned_agent_id)
                .single();
            agentProfile = agent;
        }

        // Get case activities
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: activities } = await (supabase as any)
            .from('case_activities')
            .select(`
                id,
                activity_type,
                description,
                metadata,
                created_at,
                created_by
            `)
            .eq('case_id', caseId)
            .order('created_at', { ascending: false })
            .limit(50);

        // Get activity user names
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activityUserIds = [...new Set((activities || []).map((a: any) => a.created_by).filter(Boolean))];
        const userNameMap: Record<string, string> = {};

        if (activityUserIds.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: activityUsers } = await (supabase as any)
                .from('users')
                .select('id, full_name')
                .in('id', activityUserIds);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            activityUsers?.forEach((u: any) => {
                userNameMap[u.id] = u.full_name || 'Unknown';
            });
        }

        // Enrich activities with user names
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedActivities = (activities || []).map((a: any) => ({
            ...a,
            created_by_name: userNameMap[a.created_by] || 'System',
        }));

        // Get SLA info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: slaLog } = await (supabase as any)
            .from('sla_logs')
            .select('id, sla_type, status, due_at, started_at, completed_at')
            .eq('case_id', caseId)
            .in('status', ['PENDING', 'BREACHED'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        let slaInfo = null;
        if (slaLog) {
            const now = new Date();
            const dueAt = new Date(slaLog.due_at);
            const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            slaInfo = {
                ...slaLog,
                hours_remaining: hoursRemaining,
                is_breached: slaLog.status === 'BREACHED' || hoursRemaining < 0,
                is_at_risk: hoursRemaining > 0 && hoursRemaining < 24,
            };
        }

        return NextResponse.json({
            case: {
                ...caseData,
                agent: agentProfile ? {
                    id: agentProfile.id,
                    name: agentProfile.full_name,
                    email: agentProfile.email,
                    phone: agentProfile.phone,
                } : null,
            },
            activities: enrichedActivities,
            sla: slaInfo,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            agents: (agents || []).map((a: any) => ({
                id: a.id,
                name: a.full_name || 'Unknown',
                email: a.email,
            })),
        });

    } catch (error) {
        console.error('Manager case detail API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
