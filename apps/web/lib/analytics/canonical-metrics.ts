/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Canonical Metrics Library
 * 
 * SINGLE SOURCE OF TRUTH for all metrics calculations.
 * All dashboards, analytics, reports, and exports MUST use these definitions.
 * 
 * DO NOT duplicate metric logic elsewhere.
 */

import { createAdminClient } from '@/lib/supabase/server';

// ===========================================
// TYPES
// ===========================================

export interface MetricFilters {
    regionId?: string;      // Filter by region_id (UUID)
    startDate?: Date;       // Start of date range (UTC)
    endDate?: Date;         // End of date range (UTC)
    region?: string;        // Legacy: region ENUM filter
}

export interface CaseSummaryMetrics {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    pendingCases: number;
    escalatedCases: number;
    totalOutstanding: number;
    totalRecovered: number;
    recoveryRate: number;  // (recovered / (recovered + outstanding)) * 100
}

export interface SLAMetrics {
    totalSLAs: number;
    metSLAs: number;
    breachedSLAs: number;
    pendingSLAs: number;
    exemptSLAs: number;
    complianceRate: number;  // (met / (met + breached)) * 100
}

export interface DCAPerformanceMetrics {
    dcaId: string;
    dcaName: string;
    regionId: string;
    totalCases: number;
    recoveredCases: number;
    recoveryRate: number;
    slaComplianceRate: number;
    avgResolutionDays: number;
}

export interface AgingBucket {
    bucket: string;  // '0-30', '31-60', '61-90', '90+'
    count: number;
    amount: number;
}

// ===========================================
// CANONICAL CASE METRICS
// ===========================================

/**
 * Get case summary metrics
 * CANONICAL: Use this for dashboards, analytics, and reports
 */
export async function getCaseSummaryMetrics(filters: MetricFilters = {}): Promise<CaseSummaryMetrics> {
    const supabase = createAdminClient();

    // Build query with filters
    let query = supabase
        .from('cases')
        .select('status, outstanding_amount, recovered_amount, region_id');

    if (filters.regionId) {
        query = query.eq('region_id', filters.regionId);
    }
    if (filters.region) {
        query = query.eq('region', filters.region);
    }
    if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data: cases, error } = await query as { data: any[] | null; error: any };

    if (error || !cases) {
        console.error('Failed to fetch case metrics:', error);
        return {
            totalCases: 0,
            activeCases: 0,
            closedCases: 0,
            pendingCases: 0,
            escalatedCases: 0,
            totalOutstanding: 0,
            totalRecovered: 0,
            recoveryRate: 0,
        };
    }

    // CANONICAL CALCULATIONS
    const totalCases = cases.length;
    const activeCases = cases.filter(c => !['CLOSED', 'RECOVERED', 'FULL_RECOVERY'].includes(c.status)).length;
    const closedCases = cases.filter(c => ['CLOSED', 'RECOVERED', 'FULL_RECOVERY'].includes(c.status)).length;
    const pendingCases = cases.filter(c => c.status === 'PENDING' || c.status === 'NEW').length;
    const escalatedCases = cases.filter(c => c.status === 'ESCALATED').length;

    const totalOutstanding = cases.reduce((sum, c) => sum + (c.outstanding_amount || 0), 0);
    const totalRecovered = cases.reduce((sum, c) => sum + (c.recovered_amount || 0), 0);

    // CANONICAL RECOVERY RATE FORMULA
    const totalValue = totalRecovered + totalOutstanding;
    const recoveryRate = totalValue > 0 ? (totalRecovered / totalValue) * 100 : 0;

    return {
        totalCases,
        activeCases,
        closedCases,
        pendingCases,
        escalatedCases,
        totalOutstanding,
        totalRecovered,
        recoveryRate: Math.round(recoveryRate * 100) / 100,
    };
}

// ===========================================
// CANONICAL SLA METRICS
// ===========================================

/**
 * Get SLA metrics
 * CANONICAL: Use this for dashboards, analytics, and reports
 */
export async function getSLAMetrics(filters: MetricFilters = {}): Promise<SLAMetrics> {
    const supabase = createAdminClient();

    // Query SLA logs with case region
    let query = supabase
        .from('sla_logs')
        .select(`
            status,
            cases!inner (
                region_id,
                region
            )
        `);

    if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data: slaLogs, error } = await query as { data: any[] | null; error: any };

    if (error || !slaLogs) {
        console.error('Failed to fetch SLA metrics:', error);
        return {
            totalSLAs: 0,
            metSLAs: 0,
            breachedSLAs: 0,
            pendingSLAs: 0,
            exemptSLAs: 0,
            complianceRate: 0,
        };
    }

    // Filter by region if specified
    let filteredLogs = slaLogs as Array<{ status: string; cases: { region_id: string; region: string } }>;
    if (filters.regionId) {
        filteredLogs = filteredLogs.filter(s => s.cases?.region_id === filters.regionId);
    }
    if (filters.region) {
        filteredLogs = filteredLogs.filter(s => s.cases?.region === filters.region);
    }

    // CANONICAL CALCULATIONS
    const totalSLAs = filteredLogs.length;
    const metSLAs = filteredLogs.filter(s => s.status === 'MET').length;
    const breachedSLAs = filteredLogs.filter(s => s.status === 'BREACHED').length;
    const pendingSLAs = filteredLogs.filter(s => s.status === 'PENDING').length;
    const exemptSLAs = filteredLogs.filter(s => s.status === 'EXEMPT').length;

    // CANONICAL SLA COMPLIANCE RATE FORMULA
    const completed = metSLAs + breachedSLAs;
    const complianceRate = completed > 0 ? (metSLAs / completed) * 100 : 100;

    return {
        totalSLAs,
        metSLAs,
        breachedSLAs,
        pendingSLAs,
        exemptSLAs,
        complianceRate: Math.round(complianceRate * 100) / 100,
    };
}

// ===========================================
// CANONICAL AGING BUCKETS
// ===========================================

/**
 * Get case aging buckets
 * CANONICAL: Use this for dashboards, analytics, and reports
 */
export async function getAgingBuckets(filters: MetricFilters = {}): Promise<AgingBucket[]> {
    const supabase = createAdminClient();

    let query = supabase
        .from('cases')
        .select('due_date, outstanding_amount, region_id, region')
        .not('status', 'in', '(CLOSED,RECOVERED,FULL_RECOVERY)');

    if (filters.regionId) {
        query = query.eq('region_id', filters.regionId);
    }
    if (filters.region) {
        query = query.eq('region', filters.region);
    }

    const { data: cases, error } = await query as { data: any[] | null; error: any };

    if (error || !cases) {
        return [
            { bucket: '0-30', count: 0, amount: 0 },
            { bucket: '31-60', count: 0, amount: 0 },
            { bucket: '61-90', count: 0, amount: 0 },
            { bucket: '90+', count: 0, amount: 0 },
        ];
    }

    const now = new Date();
    const buckets: Record<string, { count: number; amount: number }> = {
        '0-30': { count: 0, amount: 0 },
        '31-60': { count: 0, amount: 0 },
        '61-90': { count: 0, amount: 0 },
        '90+': { count: 0, amount: 0 },
    };

    // CANONICAL AGING CALCULATION
    cases.forEach(c => {
        if (!c.due_date) return;

        const dueDate = new Date(c.due_date);
        const agingDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = c.outstanding_amount || 0;

        if (agingDays <= 30) {
            buckets['0-30'].count++;
            buckets['0-30'].amount += amount;
        } else if (agingDays <= 60) {
            buckets['31-60'].count++;
            buckets['31-60'].amount += amount;
        } else if (agingDays <= 90) {
            buckets['61-90'].count++;
            buckets['61-90'].amount += amount;
        } else {
            buckets['90+'].count++;
            buckets['90+'].amount += amount;
        }
    });

    return Object.entries(buckets).map(([bucket, data]) => ({
        bucket,
        count: data.count,
        amount: Math.round(data.amount * 100) / 100,
    }));
}

// ===========================================
// CANONICAL DCA PERFORMANCE
// ===========================================

/**
 * Get DCA performance metrics
 * CANONICAL: Use this for dashboards, analytics, and reports
 * Prefers materialized view for performance
 */
export async function getDCAPerformanceMetrics(filters: MetricFilters = {}): Promise<DCAPerformanceMetrics[]> {
    const supabase = createAdminClient();

    // Try materialized view first
    let query = supabase
        .from('dca_performance_metrics')
        .select('dca_id, dca_name, region_id, total_cases, recovered_cases, total_recovered, total_outstanding, avg_resolution_days, sla_compliance_rate');

    if (filters.regionId) {
        query = query.eq('region_id', filters.regionId);
    }

    const { data: metrics, error } = await query as { data: any[] | null; error: any };

    if (error) {
        console.error('Failed to fetch DCA metrics from view, falling back to raw query:', error);
        // Fallback to raw query if view doesn't exist
        return [];
    }

    return (metrics || []).map(m => ({
        dcaId: m.dca_id,
        dcaName: m.dca_name,
        regionId: m.region_id,
        totalCases: m.total_cases || 0,
        recoveredCases: m.recovered_cases || 0,
        recoveryRate: m.total_cases > 0
            ? Math.round(((m.recovered_cases || 0) / m.total_cases) * 10000) / 100
            : 0,
        slaComplianceRate: m.sla_compliance_rate || 0,
        avgResolutionDays: m.avg_resolution_days || 0,
    }));
}

// ===========================================
// EXPORT HELPERS
// ===========================================

/**
 * Get all metrics for export
 * Includes metadata for audit trail
 */
export async function getMetricsForExport(filters: MetricFilters = {}): Promise<{
    generatedAt: string;
    filters: MetricFilters;
    caseSummary: CaseSummaryMetrics;
    slaMetrics: SLAMetrics;
    agingBuckets: AgingBucket[];
    dcaPerformance: DCAPerformanceMetrics[];
}> {
    const [caseSummary, slaMetrics, agingBuckets, dcaPerformance] = await Promise.all([
        getCaseSummaryMetrics(filters),
        getSLAMetrics(filters),
        getAgingBuckets(filters),
        getDCAPerformanceMetrics(filters),
    ]);

    return {
        generatedAt: new Date().toISOString(),
        filters,
        caseSummary,
        slaMetrics,
        agingBuckets,
        dcaPerformance,
    };
}
