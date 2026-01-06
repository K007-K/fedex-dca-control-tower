import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * DCA_ADMIN Team API
 * 
 * SCOPE: Only users where dca_id = current_user.dca_id
 * ACCESS: DCA_ADMIN role only
 */

export async function GET() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    try {
        // Get user's DCA
        const { data: userProfile } = await supabase
            .from('users')
            .select('dca_id')
            .eq('id', user.id)
            .single();

        if (!userProfile?.dca_id) {
            return NextResponse.json({ error: 'No DCA assigned' }, { status: 400 });
        }

        const dcaId = userProfile.dca_id;

        // Get team members
        const { data: teamMembers, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, is_active, created_at')
            .eq('dca_id', dcaId)
            .in('role', ['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'])
            .order('role', { ascending: true })
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Admin team fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
        }

        // Get case counts per agent
        const agentIds = (teamMembers || [])
            .filter(m => m.role === 'DCA_AGENT')
            .map(m => m.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let caseCounts: Record<string, number> = {};

        if (agentIds.length > 0) {
            const { data: agentCases } = await supabase
                .from('cases')
                .select('assigned_agent_id')
                .in('assigned_agent_id', agentIds)
                .not('status', 'in', '(CLOSED,FULL_RECOVERY,WRITTEN_OFF)');

            // Count cases per agent
            (agentCases || []).forEach((c: { assigned_agent_id: string }) => {
                if (c.assigned_agent_id) {
                    caseCounts[c.assigned_agent_id] = (caseCounts[c.assigned_agent_id] || 0) + 1;
                }
            });
        }

        // Enrich with case counts
        const enrichedMembers = (teamMembers || []).map(m => ({
            ...m,
            cases_assigned: caseCounts[m.id] || 0,
        }));

        return NextResponse.json({
            members: enrichedMembers,
            total: enrichedMembers.length,
        });
    } catch (error) {
        console.error('Admin team API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
