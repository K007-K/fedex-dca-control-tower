import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Agent Case Status Update API
 * 
 * POST: Update case status (only valid transitions)
 * Uses admin client to bypass RLS (user auth is handled separately)
 */

const VALID_TRANSITIONS: Record<string, string[]> = {
    'ALLOCATED': ['IN_PROGRESS', 'CUSTOMER_CONTACTED'],
    'IN_PROGRESS': ['CUSTOMER_CONTACTED', 'DISPUTED'],
    'CUSTOMER_CONTACTED': ['PAYMENT_PROMISED', 'DISPUTED', 'IN_PROGRESS'],
    'PAYMENT_PROMISED': ['PARTIAL_RECOVERY', 'FULL_RECOVERY', 'DISPUTED'],
    'PARTIAL_RECOVERY': ['FULL_RECOVERY', 'PAYMENT_PROMISED'],
    'DISPUTED': ['IN_PROGRESS', 'CUSTOMER_CONTACTED'],
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_AGENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        // Get current case
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('id, status, case_number')
            .eq('id', id)
            .eq('assigned_agent_id', user.id)
            .single();

        if (caseError || !caseData) {
            console.error('Case lookup error:', caseError);
            return NextResponse.json({ error: 'Case not found or not assigned to you' }, { status: 404 });
        }

        // Validate transition
        const validTransitions = VALID_TRANSITIONS[caseData.status] || [];
        if (!validTransitions.includes(newStatus)) {
            return NextResponse.json({
                error: `Invalid status transition from ${caseData.status} to ${newStatus}`
            }, { status: 400 });
        }

        // Update case status
        const { error: updateError } = await supabase
            .from('cases')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) {
            console.error('Status update error:', updateError);
            return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
        }

        // Log activity
        const { error: activityError } = await supabase
            .from('case_activities')
            .insert({
                case_id: id,
                activity_type: 'STATUS_CHANGE',
                description: `Status changed from ${caseData.status.replace(/_/g, ' ')} to ${newStatus.replace(/_/g, ' ')}`,
                created_by: user.id,
                metadata: {
                    previous_status: caseData.status,
                    new_status: newStatus
                }
            });

        if (activityError) {
            console.error('Activity log error:', activityError);
            // Don't fail the whole request if activity logging fails
        }

        console.log(`Status updated on case ${caseData.case_number}: ${caseData.status} -> ${newStatus} by ${user.email}`);

        return NextResponse.json({
            success: true,
            new_status: newStatus
        });

    } catch (error) {
        console.error('Status update API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
