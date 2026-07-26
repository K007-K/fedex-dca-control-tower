import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { CASE_STATUS_TRANSITIONS } from '@/lib/case/CaseStateMachine';
import { createAdminClient } from '@/lib/supabase/server';
import type { CaseStatus } from '@/lib/types/case';

/**
 * Agent Case Payment API
 * 
 * POST: Record a payment for a case
 * Uses admin client to bypass RLS (user auth is handled separately)
 */

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
    const { amount, method, reference } = body;

    if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        // Verify case is assigned to this agent
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('id, outstanding_amount, original_amount, recovered_amount, currency, case_number, status')
            .eq('id', id)
            .eq('assigned_agent_id', user.id)
            .single();

        if (caseError || !caseData) {
            console.error('Case lookup error:', caseError);
            return NextResponse.json({ error: 'Case not found or not assigned to you' }, { status: 404 });
        }

        const currencySymbol = caseData.currency === 'USD' ? '$' : '₹';

        // A payment cannot exceed what is owed. Previously the arithmetic below
        // clamped with Math.max(0, ...), so a payment of any size was accepted and
        // reported as success while silently writing off the excess.
        const outstanding = caseData.outstanding_amount || 0;
        if (amount > outstanding) {
            return NextResponse.json({
                error: 'Payment exceeds the outstanding balance',
                outstanding,
                attempted: amount,
            }, { status: 400 });
        }

        // Log payment activity
        const { error: activityError } = await supabase
            .from('case_activities')
            .insert({
                case_id: id,
                activity_type: 'PAYMENT',
                description: `Payment received: ${currencySymbol}${amount.toLocaleString()} via ${method || 'Unknown'}${reference ? ` (Ref: ${reference})` : ''}`,
                created_by: user.id,
                metadata: {
                    amount,
                    method: method || 'Unknown',
                    reference: reference || null,
                    currency: caseData.currency
                }
            });

        if (activityError) {
            console.error('Payment activity error:', activityError);
        }

        // Update outstanding amount
        const newOutstanding = outstanding - amount;
        const currentStatus = (caseData.status || 'ALLOCATED') as CaseStatus;

        const derivedStatus = newOutstanding === 0 ? 'FULL_RECOVERY' :
            newOutstanding < caseData.original_amount * 0.5 ? 'PARTIAL_RECOVERY' :
                currentStatus;

        // Only move status if the state machine permits it from where we are. This
        // endpoint used to write FULL_RECOVERY/PARTIAL_RECOVERY unconditionally,
        // which let a payment jump a case straight from ALLOCATED to FULL_RECOVERY —
        // a transition CASE_STATUS_TRANSITIONS forbids.
        const allowed = CASE_STATUS_TRANSITIONS[currentStatus] ?? [];
        const newStatus = derivedStatus === currentStatus || allowed.includes(derivedStatus as CaseStatus)
            ? derivedStatus
            : currentStatus;

        // recovered_amount was never maintained here, so every recovery report and
        // analytics figure derived from it read zero no matter how much was collected.
        const newRecovered = (caseData.recovered_amount || 0) + amount;

        const { error: updateError } = await supabase
            .from('cases')
            .update({
                outstanding_amount: newOutstanding,
                recovered_amount: newRecovered,
                last_payment_date: new Date().toISOString(),
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Payment update error:', updateError);
            return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
        }

        console.log(`Payment recorded for case ${caseData.case_number}: ${currencySymbol}${amount} by ${user.email}`);

        return NextResponse.json({
            success: true,
            new_outstanding: newOutstanding,
            new_status: newStatus
        });

    } catch (error) {
        console.error('Payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
