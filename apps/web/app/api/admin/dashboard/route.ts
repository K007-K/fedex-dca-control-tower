import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * DCA_ADMIN Dashboard API
 * 
 * SCOPE: Only data for the current admin's DCA (dca_id = current_user.dca_id)
 * ACCESS: DCA_ADMIN role only
 */

export async function GET() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DCA_ADMIN can access this endpoint
    if (user.role !== 'DCA_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    try {
        // Get user's DCA info
        const { data: userProfile } = await supabase
            .from('users')
            .select('dca_id, dcas(name)')
            .eq('id', user.id)
            .single();

        if (!userProfile?.dca_id) {
            return NextResponse.json({ error: 'No DCA assigned' }, { status: 400 });
        }

        const dcaId = userProfile.dca_id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dcaName = (userProfile as any).dcas?.name || 'Your DCA';

        // Get cases for this DCA
        const { data: allCases } = await supabase
            .from('cases')
            .select('id, status, sla_due_at, created_at')
            .eq('dca_id', dcaId);

        const cases = allCases || [];
        const totalCases = cases.length;

        // Active cases (not closed)
        const terminalStatuses = ['CLOSED', 'FULL_RECOVERY', 'WRITTEN_OFF'];
        const activeCases = cases.filter(c => !terminalStatuses.includes(c.status)).length;

        // Calculate SLA metrics
        const now = new Date();
        let overdueCases = 0;
        let atRiskCases = 0;

        cases.forEach(c => {
            if (terminalStatuses.includes(c.status)) return;
            if (c.sla_due_at) {
                const dueAt = new Date(c.sla_due_at);
                const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (hoursRemaining < 0) overdueCases++;
                else if (hoursRemaining < 24) atRiskCases++;
            }
        });

        // SLA compliance rate (cases not overdue / total active)
        const slaComplianceRate = activeCases > 0
            ? Math.round(((activeCases - overdueCases) / activeCases) * 100)
            : 100;

        // Get team size
        const { data: teamMembers } = await supabase
            .from('users')
            .select('role')
            .eq('dca_id', dcaId)
            .eq('is_active', true);

        const team = teamMembers || [];
        const managers = team.filter(m => m.role === 'DCA_MANAGER').length;
        const agents = team.filter(m => m.role === 'DCA_AGENT').length;

        // Get escalations (cases escalated to admin)
        const { data: escalatedCases } = await supabase
            .from('cases')
            .select('id, case_number, updated_at')
            .eq('dca_id', dcaId)
            .eq('status', 'ESCALATED')
            .order('updated_at', { ascending: false })
            .limit(5);

        const escalationsReceived = escalatedCases?.length || 0;
        const recentEscalations = (escalatedCases || []).map(c => ({
            id: c.id,
            case_number: c.case_number,
            from_user: 'Manager',
            reason: 'Requires admin attention',
            created_at: c.updated_at,
        }));

        return NextResponse.json({
            totalCases,
            activeCases,
            slaComplianceRate,
            overdueCases,
            atRiskCases,
            teamSize: { managers, agents },
            escalationsReceived,
            recentEscalations,
            dcaName,
        });
    } catch (error) {
        console.error('Admin dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
