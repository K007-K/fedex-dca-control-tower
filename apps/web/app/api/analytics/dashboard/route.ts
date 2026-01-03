/**
 * GET /api/analytics/dashboard
 * Get dashboard metrics and summary statistics
 * SECURITY: Requires authentication and analytics:read permission
 */
import { NextResponse } from 'next/server';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isDCARole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

const handleGetAnalytics: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();

        // Build cases query with DCA data isolation AND region filtering
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let casesQuery = (supabase as any)
            .from('cases')
            .select('status, outstanding_amount, recovered_amount, priority_score, recovery_probability, assigned_dca_id, region')
            .not('status', 'eq', 'CLOSED');

        // DCA users can only see their assigned cases (data isolation)
        if (isDCARole(user.role) && user.dcaId) {
            casesQuery = casesQuery.eq('assigned_dca_id', user.dcaId);
        }

        // FEDEX_ADMIN and other regional roles: filter by accessible regions
        // SUPER_ADMIN bypasses region filter (isGlobalAdmin)
        if (!user.isGlobalAdmin && user.accessibleRegions && user.accessibleRegions.length > 0) {
            casesQuery = casesQuery.in('region', user.accessibleRegions);
        } else if (!user.isGlobalAdmin && (!user.accessibleRegions || user.accessibleRegions.length === 0)) {
            // No accessible regions = no data (fail-closed)
            return NextResponse.json({ data: { totalCases: 0, statusBreakdown: {} } });
        }

        const caseResult = await casesQuery;

        if (caseResult.error) {
            console.error('Dashboard query error:', caseResult.error);
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: caseResult.error.message } },
                { status: 500 }
            );
        }

        const caseCounts = caseResult.data as Array<{
            status: string;
            outstanding_amount: number | null;
            recovered_amount: number | null;
            priority_score: number | null;
            recovery_probability: number | null;
        }> | null;

        // Calculate metrics
        const totalCases = caseCounts?.length ?? 0;
        const statusCounts: Record<string, number> = {};
        let totalOutstanding = 0;
        let totalRecovered = 0;
        let totalPriorityScore = 0;
        let totalRecoveryProb = 0;
        let scoredCases = 0;

        if (caseCounts) {
            for (const c of caseCounts) {
                statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
                totalOutstanding += c.outstanding_amount ?? 0;
                totalRecovered += c.recovered_amount ?? 0;
                if (c.priority_score) {
                    totalPriorityScore += c.priority_score;
                    scoredCases++;
                }
                if (c.recovery_probability) {
                    totalRecoveryProb += c.recovery_probability;
                }
            }
        }

        // Get active DCAs count (respect DCA isolation AND region filtering)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let dcaQuery = (supabase as any)
            .from('dcas')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');

        if (isDCARole(user.role) && user.dcaId) {
            dcaQuery = dcaQuery.eq('id', user.dcaId);
        } else if (!user.isGlobalAdmin && user.accessibleRegions && user.accessibleRegions.length > 0) {
            // FEDEX_ADMIN: Only count DCAs in accessible regions
            dcaQuery = dcaQuery.in('region', user.accessibleRegions);
        }

        const dcaResult = await dcaQuery;
        const activeDcas = dcaResult.count;

        // Get SLA compliance
        const slaResult = await supabase
            .from('sla_logs')
            .select('status')
            .in('status', ['MET', 'BREACHED']);

        const slaData = slaResult.data as Array<{ status: string }> | null;
        const slaMet = slaData?.filter(s => s.status === 'MET').length ?? 0;
        const slaTotal = slaData?.length ?? 0;
        const slaCompliance = slaTotal > 0 ? Math.round((slaMet / slaTotal) * 100) : 100;

        // Calculate recovery rate
        const recoveryRate = totalOutstanding + totalRecovered > 0
            ? Math.round((totalRecovered / (totalOutstanding + totalRecovered)) * 100 * 10) / 10
            : 0;

        const dashboardMetrics = {
            totalCases,
            pendingAllocation: statusCounts['PENDING_ALLOCATION'] ?? 0,
            inProgress: (statusCounts['IN_PROGRESS'] ?? 0) + (statusCounts['CUSTOMER_CONTACTED'] ?? 0) + (statusCounts['PAYMENT_PROMISED'] ?? 0),
            recovered: (statusCounts['FULL_RECOVERY'] ?? 0) + (statusCounts['PARTIAL_RECOVERY'] ?? 0),
            disputed: statusCounts['DISPUTED'] ?? 0,
            escalated: statusCounts['ESCALATED'] ?? 0,
            totalOutstanding,
            totalRecovered,
            recoveryRate,
            avgPriorityScore: scoredCases > 0 ? Math.round(totalPriorityScore / scoredCases) : 0,
            avgRecoveryProbability: scoredCases > 0 ? Math.round((totalRecoveryProb / scoredCases) * 100) : 0,
            slaCompliance,
            activeDcas: activeDcas ?? 0,
            statusBreakdown: statusCounts,
        };

        return NextResponse.json({ data: dashboardMetrics });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard metrics' } },
            { status: 500 }
        );
    }
};

// Export with RBAC protection - requires analytics:read permission
export const GET = withPermission('analytics:read', handleGetAnalytics);
