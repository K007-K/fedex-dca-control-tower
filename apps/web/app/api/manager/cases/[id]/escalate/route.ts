import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { logHumanAction, deriveRegionFromCase } from '@/lib/audit';

/**
 * Manager Case Escalate API
 * 
 * SCOPE: Escalate case to DCA_ADMIN
 * ACCESS: DCA_MANAGER role only
 * 
 * GOVERNANCE RULES:
 * - Allowed from: IN_PROGRESS, CONTACTED, DISPUTE, PAYMENT_PLAN
 * - Creates audit log: CASE_ESCALATED_BY_MANAGER
 * - Locks agent write actions on case (sets escalated_by_manager flag)
 * - Notifies DCA_ADMIN only (not FedEx)
 * - NOT reversible by manager
 */

// States from which escalation is allowed
const ESCALATION_ALLOWED_STATES = [
    'IN_PROGRESS',
    'CUSTOMER_CONTACTED',
    'DISPUTED',
    'PAYMENT_PROMISED',
    'PARTIAL_PAYMENT',
    'ALLOCATED',
];

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_MANAGER') {
        return NextResponse.json({ error: 'Forbidden - DCA_MANAGER only' }, { status: 403 });
    }

    const { id: caseId } = await params;
    const body = await request.json();
    const { reason, priority = 'HIGH' } = body;

    if (!reason || reason.trim().length < 10) {
        return NextResponse.json({ error: 'Escalation reason is required (min 10 characters)' }, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        // Get manager's DCA
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: managerProfile } = await (supabase as any)
            .from('users')
            .select('dca_id, full_name')
            .eq('id', user.id)
            .single();

        if (!managerProfile?.dca_id) {
            return NextResponse.json({ error: 'Manager not assigned to a DCA' }, { status: 400 });
        }

        const dcaId = managerProfile.dca_id;

        // Get case and verify it's within manager's DCA
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: caseData } = await (supabase as any)
            .from('cases')
            .select('id, case_number, status, assigned_agent_id, escalated_by_manager')
            .eq('id', caseId)
            .single();

        if (!caseData) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }

        // Check if already escalated
        if (caseData.escalated_by_manager) {
            return NextResponse.json({ error: 'Case is already escalated' }, { status: 400 });
        }

        // Verify case is in allowed state for escalation
        if (!ESCALATION_ALLOWED_STATES.includes(caseData.status)) {
            return NextResponse.json({
                error: `Cannot escalate case in ${caseData.status} status`,
                allowed_states: ESCALATION_ALLOWED_STATES,
            }, { status: 400 });
        }

        // Verify assigned agent is in manager's DCA
        if (caseData.assigned_agent_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: agent } = await (supabase as any)
                .from('users')
                .select('dca_id')
                .eq('id', caseData.assigned_agent_id)
                .single();

            if (agent?.dca_id !== dcaId) {
                return NextResponse.json({ error: 'Case is not assigned to your DCA' }, { status: 403 });
            }
        }

        // Find DCA_ADMIN to notify
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dcaAdmins } = await (supabase as any)
            .from('users')
            .select('id, email, full_name')
            .eq('dca_id', dcaId)
            .eq('role', 'DCA_ADMIN')
            .eq('status', 'ACTIVE')
            .limit(5);

        // Mark case as escalated (locks agent actions)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
            .from('cases')
            .update({
                escalated_by_manager: true,
                escalated_at: new Date().toISOString(),
                escalated_reason: reason,
                escalation_priority: priority,
                updated_at: new Date().toISOString(),
            })
            .eq('id', caseId);

        if (updateError) {
            console.error('Case escalation error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Log case activity
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('case_activities').insert({
            case_id: caseId,
            activity_type: 'ESCALATED',
            description: `Case escalated to DCA Admin by ${managerProfile.full_name || 'Manager'}: ${reason}`,
            created_by: user.id,
            metadata: { priority, escalated_to_role: 'DCA_ADMIN' },
        });

        // Create notification for DCA_ADMIN(s)
        for (const admin of (dcaAdmins || [])) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from('notifications').insert({
                recipient_id: admin.id,
                notification_type: 'ESCALATION_CREATED',
                title: `Case Escalated: ${caseData.case_number}`,
                message: `Manager ${managerProfile.full_name || 'Unknown'} escalated case ${caseData.case_number}. Reason: ${reason}`,
                related_case_id: caseId,
                priority: priority,
                channels: ['IN_APP', 'EMAIL'],
            });
        }

        // Audit log
        const regionId = await deriveRegionFromCase(caseId) || 'DEFAULT_REGION';
        await logHumanAction(
            { id: user.id, email: user.email || '', role: user.role },
            'CASE_ESCALATED',
            'case',
            caseId,
            regionId,
            {
                action: 'CASE_ESCALATED_BY_MANAGER',
                case_number: caseData.case_number,
                reason,
                priority,
                escalated_to: 'DCA_ADMIN',
                notified_admins: dcaAdmins?.map((a: any) => a.email) || [],
                agent_actions_locked: true,
            },
            request
        );

        return NextResponse.json({
            success: true,
            message: `Case ${caseData.case_number} escalated to DCA Admin`,
            notified_admins: dcaAdmins?.length || 0,
            agent_actions_locked: true,
        });

    } catch (error) {
        console.error('Manager escalate API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
