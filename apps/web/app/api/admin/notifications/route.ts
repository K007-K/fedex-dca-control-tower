import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * DCA_ADMIN Notifications API
 * 
 * SCOPE: Notifications relevant to DCA_ADMIN
 * - Escalations from managers
 * - SLA breach alerts
 * - DCA-level warnings
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

        // Generate notifications based on DCA state
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notifications: any[] = [];

        // Get escalated cases
        const { data: escalatedCases } = await supabase
            .from('cases')
            .select('id, case_number, customer_name, updated_at')
            .eq('dca_id', dcaId)
            .eq('status', 'ESCALATED')
            .order('updated_at', { ascending: false })
            .limit(10);

        (escalatedCases || []).forEach(c => {
            notifications.push({
                id: `esc-${c.id}`,
                type: 'escalation',
                title: `Case ${c.case_number} Escalated`,
                message: `${c.customer_name} - requires admin attention`,
                case_id: c.id,
                case_number: c.case_number,
                created_at: c.updated_at,
                is_read: false,
            });
        });

        // Get SLA breaches
        const now = new Date();
        const { data: slaCases } = await supabase
            .from('cases')
            .select('id, case_number, customer_name, sla_due_at, updated_at')
            .eq('dca_id', dcaId)
            .not('status', 'in', '(CLOSED,FULL_RECOVERY,WRITTEN_OFF)')
            .order('sla_due_at', { ascending: true })
            .limit(20);

        (slaCases || []).forEach(c => {
            if (!c.sla_due_at) return;
            const dueAt = new Date(c.sla_due_at);
            const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (hoursRemaining < 0) {
                notifications.push({
                    id: `breach-${c.id}`,
                    type: 'sla_breach',
                    title: `SLA Breached: ${c.case_number}`,
                    message: `${c.customer_name} - SLA breached ${Math.abs(Math.round(hoursRemaining))}h ago`,
                    case_id: c.id,
                    case_number: c.case_number,
                    created_at: c.updated_at,
                    is_read: false,
                });
            } else if (hoursRemaining < 24) {
                notifications.push({
                    id: `warn-${c.id}`,
                    type: 'sla_warning',
                    title: `SLA Warning: ${c.case_number}`,
                    message: `${c.customer_name} - SLA due in ${Math.round(hoursRemaining)}h`,
                    case_id: c.id,
                    case_number: c.case_number,
                    created_at: c.updated_at,
                    is_read: false,
                });
            }
        });

        // Sort by created_at descending
        notifications.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return NextResponse.json({
            notifications: notifications.slice(0, 50),
            total: notifications.length,
        });
    } catch (error) {
        console.error('Admin notifications API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
