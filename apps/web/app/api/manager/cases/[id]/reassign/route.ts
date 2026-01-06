import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { logHumanAction, deriveRegionFromCase } from '@/lib/audit';

/**
 * Manager Case Reassign API
 * 
 * SCOPE: Reassign case to different agent within same DCA
 * ACCESS: DCA_MANAGER role only
 * AUDIT: CASE_REASSIGNED_BY_MANAGER event logged
 * 
 * Transaction Safety:
 * - Single case reassignment (for batch, use bulk endpoint)
 * - Validates both source and target agent are in manager's DCA
 */

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
    const { target_agent_id, reason } = body;

    if (!target_agent_id) {
        return NextResponse.json({ error: 'target_agent_id is required' }, { status: 400 });
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

        // Verify target agent is in manager's DCA
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: targetAgent } = await (supabase as any)
            .from('users')
            .select('id, full_name, dca_id, role, status')
            .eq('id', target_agent_id)
            .single();

        if (!targetAgent) {
            return NextResponse.json({ error: 'Target agent not found' }, { status: 404 });
        }

        if (targetAgent.dca_id !== dcaId) {
            return NextResponse.json({ error: 'Cannot reassign to agent outside your DCA' }, { status: 403 });
        }

        if (targetAgent.role !== 'DCA_AGENT') {
            return NextResponse.json({ error: 'Can only reassign to DCA_AGENT role' }, { status: 400 });
        }

        if (targetAgent.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Target agent is not active' }, { status: 400 });
        }

        // Get case and verify it's within manager's DCA
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: caseData } = await (supabase as any)
            .from('cases')
            .select('id, case_number, assigned_agent_id, status')
            .eq('id', caseId)
            .single();

        if (!caseData) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }

        // Verify current agent is in manager's DCA
        if (caseData.assigned_agent_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: currentAgent } = await (supabase as any)
                .from('users')
                .select('dca_id')
                .eq('id', caseData.assigned_agent_id)
                .single();

            if (currentAgent?.dca_id !== dcaId) {
                return NextResponse.json({ error: 'Case is not assigned to your DCA' }, { status: 403 });
            }
        }

        // Cannot reassign closed/recovered cases
        if (['CLOSED', 'FULL_RECOVERY', 'WRITTEN_OFF'].includes(caseData.status)) {
            return NextResponse.json({ error: 'Cannot reassign completed cases' }, { status: 400 });
        }

        const previousAgentId = caseData.assigned_agent_id;

        // Perform reassignment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
            .from('cases')
            .update({
                assigned_agent_id: target_agent_id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', caseId);

        if (updateError) {
            console.error('Case reassignment error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Log case activity
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('case_activities').insert({
            case_id: caseId,
            activity_type: 'REASSIGNED',
            description: `Case reassigned by manager to ${targetAgent.full_name}${reason ? `: ${reason}` : ''}`,
            created_by: user.id,
        });

        // Audit log
        const regionId = await deriveRegionFromCase(caseId) || 'DEFAULT_REGION';
        await logHumanAction(
            { id: user.id, email: user.email || '', role: user.role },
            'CASE_ASSIGNED',
            'case',
            caseId,
            regionId,
            {
                action: 'CASE_REASSIGNED_BY_MANAGER',
                case_number: caseData.case_number,
                from_agent_id: previousAgentId,
                to_agent_id: target_agent_id,
                to_agent_name: targetAgent.full_name,
                reason: reason || null,
            },
            request
        );

        return NextResponse.json({
            success: true,
            message: `Case ${caseData.case_number} reassigned to ${targetAgent.full_name}`,
        });

    } catch (error) {
        console.error('Manager reassign API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
