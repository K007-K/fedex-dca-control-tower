import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Agent Stats API
 * 
 * Returns performance metrics for the current agent:
 * - Total cases handled
 * - Full/partial recovery counts
 * - Total amount recovered
 * - Recovery rate
 * - Average resolution time
 */

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'DCA_AGENT') {
            return NextResponse.json({ error: 'Access denied. DCA_AGENT role required.' }, { status: 403 });
        }

        const adminClient = createAdminClient();

        // Get all cases ever assigned to this agent (including historical)
        const { data: allCases, error: casesError } = await adminClient
            .from('cases')
            .select('id, status, outstanding_amount, original_amount, recovered_amount, created_at, updated_at, currency')
            .eq('assigned_agent_id', user.id);

        if (casesError) {
            console.error('Stats cases error:', casesError);
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
        }

        const cases = allCases || [];

        // Calculate stats
        const totalCasesHandled = cases.length;
        const activeCases = cases.filter(c => !['CLOSED', 'FULL_RECOVERY', 'WRITTEN_OFF'].includes(c.status)).length;
        const fullRecoveryCount = cases.filter(c => c.status === 'FULL_RECOVERY').length;
        const partialRecoveryCount = cases.filter(c => c.status === 'PARTIAL_RECOVERY').length;

        // Total amount recovered
        const totalAmountRecovered = cases.reduce((sum, c) => sum + (c.recovered_amount || 0), 0);
        const totalAmountAssigned = cases.reduce((sum, c) => sum + (c.original_amount || 0), 0);

        // Recovery rate (based on completed cases only)
        const closedCases = cases.filter(c => ['CLOSED', 'FULL_RECOVERY', 'PARTIAL_RECOVERY', 'WRITTEN_OFF'].includes(c.status));
        const successfulCases = fullRecoveryCount + partialRecoveryCount;
        const recoveryRate = closedCases.length > 0 ? (successfulCases / closedCases.length) * 100 : 0;

        // Average resolution time (for closed cases)
        let avgResolutionDays = 0;
        if (closedCases.length > 0) {
            const totalDays = closedCases.reduce((sum, c) => {
                const created = new Date(c.created_at);
                const updated = new Date(c.updated_at);
                const diffMs = updated.getTime() - created.getTime();
                return sum + (diffMs / (1000 * 60 * 60 * 24));
            }, 0);
            avgResolutionDays = totalDays / closedCases.length;
        }

        // Currency (use first case's currency or default to INR)
        const currency = cases[0]?.currency || 'INR';

        // Current streak (consecutive successful recoveries - simplified)
        let currentStreak = 0;
        const sortedByDate = [...closedCases].sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        for (const c of sortedByDate) {
            if (['FULL_RECOVERY', 'PARTIAL_RECOVERY'].includes(c.status)) {
                currentStreak++;
            } else {
                break;
            }
        }

        return NextResponse.json({
            totalCasesHandled,
            activeCases,
            fullRecoveryCount,
            partialRecoveryCount,
            totalAmountRecovered,
            totalAmountAssigned,
            recoveryRate,
            avgResolutionDays,
            currency,
            currentStreak,
            bestMonth: null, // Could be computed with more complex query
        });

    } catch (error) {
        console.error('Agent stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
