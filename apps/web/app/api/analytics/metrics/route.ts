/**
 * Canonical Metrics API
 * 
 * This API serves ONLY from the canonical metrics library.
 * Dashboards, analytics pages, and exports MUST use this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    getCaseSummaryMetrics,
    getSLAMetrics,
    getAgingBuckets,
    getDCAPerformanceMetrics,
    getMetricsForExport,
    MetricFilters
} from '@/lib/analytics/canonical-metrics';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse filters from query params
        const url = new URL(request.url);
        const regionId = url.searchParams.get('regionId') || undefined;
        const region = url.searchParams.get('region') || undefined;
        const startDateStr = url.searchParams.get('startDate');
        const endDateStr = url.searchParams.get('endDate');
        const metricType = url.searchParams.get('type') || 'all';

        const filters: MetricFilters = {
            regionId,
            region,
            startDate: startDateStr ? new Date(startDateStr) : undefined,
            endDate: endDateStr ? new Date(endDateStr) : undefined,
        };

        // Return specific metric type or all
        switch (metricType) {
            case 'cases':
                return NextResponse.json({
                    source: 'canonical',
                    generatedAt: new Date().toISOString(),
                    data: await getCaseSummaryMetrics(filters),
                });

            case 'sla':
                return NextResponse.json({
                    source: 'canonical',
                    generatedAt: new Date().toISOString(),
                    data: await getSLAMetrics(filters),
                });

            case 'aging':
                return NextResponse.json({
                    source: 'canonical',
                    generatedAt: new Date().toISOString(),
                    data: await getAgingBuckets(filters),
                });

            case 'dca':
                return NextResponse.json({
                    source: 'canonical',
                    generatedAt: new Date().toISOString(),
                    data: await getDCAPerformanceMetrics(filters),
                });

            case 'export':
            case 'all':
            default:
                return NextResponse.json({
                    source: 'canonical',
                    ...(await getMetricsForExport(filters)),
                });
        }

    } catch (error) {
        console.error('Metrics API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metrics' },
            { status: 500 }
        );
    }
}
