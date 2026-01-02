/**

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
 * Dashboard API - Fetches dashboard data with region filtering
 * SECURITY: Requires authentication and analytics:read permission
 * Region filtering is SERVER-ENFORCED via SecureQueryBuilder
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { isDCARole } from '@/lib/auth';
import { getCurrencyForRegion } from '@/lib/config/config';
import { secureQuery } from '@/lib/auth/secure-query';

interface Case {
    id: string;
    case_number: string;
    customer_name: string;
    outstanding_amount: number;
    recovered_amount: number;
    original_amount: number;
    status: string;
    priority: string;
    created_at: string;
    currency?: string;
    region?: string;
    assigned_dca_id?: string;
}

interface DCA {
    id: string;
    name: string;
    status: string;
}

const handleGetDashboard: ApiHandler = async (request, { user }) => {
    try {
        const { searchParams } = new URL(request.url);
        const clientRegion = searchParams.get('region');

        // Secure cases query - region enforced by user.accessibleRegions
        const casesBuilder = secureQuery(user)
            .from('cases')
            .select('*')
            .withOptions({ regionColumn: 'region' })
            .order('created_at', { ascending: false });

        // Apply client region filter only if valid (for subsetting)
        if (clientRegion && clientRegion !== 'ALL') {
            if (user.isGlobalAdmin || user.accessibleRegions.includes(clientRegion)) {
                casesBuilder.eq('region', clientRegion);
            }
        }

        const { data: casesData, error: casesError } = await casesBuilder.execute();

        // Secure DCAs query
        const dcasBuilder = secureQuery(user)
            .from('dcas')
            .select('*')
            .withOptions({ regionColumn: 'region', dcaColumn: 'id' })
            .eq('status', 'ACTIVE');

        if (clientRegion && clientRegion !== 'ALL' && user.isGlobalAdmin) {
            dcasBuilder.eq('region', clientRegion);
        }

        const { data: dcasData, error: dcasError } = await dcasBuilder.execute();

        if (casesError || dcasError) {
            console.error('Dashboard data error:', casesError || dcasError);
            return NextResponse.json(
                { error: 'Failed to fetch dashboard data' },
                { status: 500 }
            );
        }

        const allCases = (casesData || []) as Case[];
        const activeDCAs = (dcasData || []) as DCA[];

        // Determine currency based on region (config-driven)
        const currency = getCurrencyForRegion(clientRegion);

        // Calculate metrics
        const totalRecovered = allCases.reduce((sum, c) => sum + (c.recovered_amount ?? 0), 0);
        const totalOutstanding = allCases.reduce((sum, c) => sum + (c.outstanding_amount ?? 0), 0);
        const totalOriginal = allCases.reduce((sum, c) => sum + (c.original_amount ?? 0), 0);
        const recoveryRate = totalOriginal > 0 ? (totalRecovered / totalOriginal) * 100 : 0;

        const pendingCases = allCases.filter(c =>
            ['PENDING_ALLOCATION', 'ALLOCATED', 'IN_PROGRESS'].includes(c.status)
        ).length;

        const resolvedCases = allCases.filter(c =>
            ['FULL_RECOVERY', 'PARTIAL_RECOVERY', 'CLOSED'].includes(c.status)
        );
        const slaCompliance = allCases.length > 0
            ? (resolvedCases.length / allCases.length) * 100
            : 0;

        // Calculate trends
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisMonthCases = allCases.filter(c => new Date(c.created_at) >= thisMonthStart);
        const lastMonthCases = allCases.filter(c => {
            const d = new Date(c.created_at);
            return d >= lastMonthStart && d <= lastMonthEnd;
        });

        const casesTrend = lastMonthCases.length > 0
            ? ((thisMonthCases.length - lastMonthCases.length) / lastMonthCases.length) * 100
            : 0;

        const thisMonthRecovered = thisMonthCases.reduce((sum, c) => sum + (c.recovered_amount ?? 0), 0);
        const thisMonthOriginal = thisMonthCases.reduce((sum, c) => sum + (c.original_amount ?? 0), 0);
        const lastMonthRecovered = lastMonthCases.reduce((sum, c) => sum + (c.recovered_amount ?? 0), 0);
        const lastMonthOriginal = lastMonthCases.reduce((sum, c) => sum + (c.original_amount ?? 0), 0);

        const thisMonthRate = thisMonthOriginal > 0 ? (thisMonthRecovered / thisMonthOriginal) * 100 : 0;
        const lastMonthRate = lastMonthOriginal > 0 ? (lastMonthRecovered / lastMonthOriginal) * 100 : 0;
        const recoveryTrend = thisMonthRate - lastMonthRate;

        const slaTrend = slaCompliance >= 90 ? 0 : slaCompliance - 90;

        return NextResponse.json({
            metrics: {
                totalCases: allCases.length,
                activeDCAs: activeDCAs.length,
                recoveryRate,
                slaCompliance: Math.min(slaCompliance, 100),
                pendingCases,
                totalRecovered,
                totalOutstanding,
                trends: {
                    casesTrend: Math.round(casesTrend * 10) / 10,
                    dcasTrend: 0,
                    recoveryTrend: Math.round(recoveryTrend * 10) / 10,
                    slaTrend: Math.round(slaTrend * 10) / 10,
                },
            },
            recentCases: allCases.slice(0, 5).map(c => ({
                id: c.id,
                case_number: c.case_number,
                customer_name: c.customer_name,
                outstanding_amount: c.outstanding_amount,
                status: c.status,
                priority: c.priority,
                created_at: c.created_at,
                currency: c.currency,
            })),
            currency,
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

// Export with RBAC protection - requires analytics:read permission
export const GET = withPermission('analytics:read', handleGetDashboard);
