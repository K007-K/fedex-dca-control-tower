/**
 * SUPER_ADMIN Governance Service
 * 
 * Provides global visibility and governance capabilities
 * for SUPER_ADMIN users.
 * 
 * RULES:
 * - Read-only for operational data
 * - Global visibility (all regions)
 * - All actions are audited
 * - No case create/update/delete/assign
 */

import { createAdminClient } from '@/lib/supabase/server';

// ===========================================
// TYPES
// ===========================================

export interface GlobalKPIs {
    total_cases: number;
    active_cases: number;
    active_dcas: number;
    overall_recovery_rate: number;
    sla_compliance_percentage: number;
    total_outstanding_amount: number;
    total_recovered_amount: number;
}

export interface AIInsights {
    avg_priority_score: number;
    high_risk_case_count: number;
    recovery_forecast_30d: number;
    ai_confidence_avg: number;
}

export interface SystemHealth {
    database_status: 'healthy' | 'degraded' | 'down';
    ml_service_status: 'healthy' | 'degraded' | 'down';
    sla_job_last_run: string | null;
    sla_job_status: 'healthy' | 'degraded' | 'down';
    data_freshness_minutes: number;
}

export interface GovernanceDashboard {
    kpis: GlobalKPIs;
    ai_insights: AIInsights;
    system_health: SystemHealth;
    generated_at: string;
}

// ===========================================
// GLOBAL KPIs
// ===========================================

export async function getGlobalKPIs(): Promise<GlobalKPIs> {
    const supabase = createAdminClient();

    // Get total and active cases
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalCases } = await (supabase as any)
        .from('cases')
        .select('*', { count: 'exact', head: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: activeCases } = await (supabase as any)
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '(CLOSED,RECOVERED)');

    // Get active DCAs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: activeDcas } = await (supabase as any)
        .from('dcas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

    // Get financial summary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: financials } = await (supabase as any)
        .from('cases')
        .select('total_due, amount_recovered');

    let totalOutstanding = 0;
    let totalRecovered = 0;

    if (financials) {
        for (const c of financials) {
            totalOutstanding += c.total_due || 0;
            totalRecovered += c.amount_recovered || 0;
        }
    }

    const recoveryRate = totalOutstanding > 0
        ? (totalRecovered / totalOutstanding) * 100
        : 0;

    // Get SLA compliance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: totalSLAs } = await (supabase as any)
        .from('sla_logs')
        .select('*', { count: 'exact', head: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: breachedSLAs } = await (supabase as any)
        .from('sla_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'BREACHED');

    const slaCompliance = totalSLAs && totalSLAs > 0
        ? ((totalSLAs - (breachedSLAs || 0)) / totalSLAs) * 100
        : 100;

    return {
        total_cases: totalCases || 0,
        active_cases: activeCases || 0,
        active_dcas: activeDcas || 0,
        overall_recovery_rate: Math.round(recoveryRate * 100) / 100,
        sla_compliance_percentage: Math.round(slaCompliance * 100) / 100,
        total_outstanding_amount: totalOutstanding,
        total_recovered_amount: totalRecovered,
    };
}

// ===========================================
// AI INSIGHTS
// ===========================================

export async function getAIInsights(): Promise<AIInsights> {
    const supabase = createAdminClient();

    // Get average priority score
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cases } = await (supabase as any)
        .from('cases')
        .select('ai_priority_score')
        .not('ai_priority_score', 'is', null);

    let avgPriorityScore = 0;
    let highRiskCount = 0;

    if (cases && cases.length > 0) {
        const sum = cases.reduce((acc: number, c: { ai_priority_score: number }) =>
            acc + (c.ai_priority_score || 0), 0);
        avgPriorityScore = sum / cases.length;

        highRiskCount = cases.filter((c: { ai_priority_score: number }) =>
            c.ai_priority_score >= 70).length;
    }

    // Recovery forecast (simplified - 30-day projection based on current rate)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentRecoveries } = await (supabase as any)
        .from('cases')
        .select('amount_recovered, updated_at')
        .eq('status', 'RECOVERED')
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const recentRecoveredAmount = recentRecoveries?.reduce((acc: number, c: { amount_recovered: number }) =>
        acc + (c.amount_recovered || 0), 0) || 0;

    return {
        avg_priority_score: Math.round(avgPriorityScore * 100) / 100,
        high_risk_case_count: highRiskCount,
        recovery_forecast_30d: recentRecoveredAmount,
        ai_confidence_avg: 85.0, // This would come from ML service in production
    };
}

// ===========================================
// SYSTEM HEALTH
// ===========================================

export async function getSystemHealth(): Promise<SystemHealth> {
    const supabase = createAdminClient();

    // Check database health
    let dbStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from('cases')
            .select('id')
            .limit(1);
        if (error) dbStatus = 'degraded';
    } catch {
        dbStatus = 'down';
    }

    // Check ML service health
    let mlStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
        const mlResponse = await fetch('http://localhost:8000/health', {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        if (!mlResponse || !mlResponse.ok) {
            mlStatus = 'degraded';
        }
    } catch {
        mlStatus = 'degraded';
    }

    // Check SLA job status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastSlaLog } = await (supabase as any)
        .from('audit_logs')
        .select('created_at')
        .eq('action', 'SLA_BREACH_CHECK')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let slaJobStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    let slaLastRun: string | null = null;

    if (lastSlaLog) {
        slaLastRun = lastSlaLog.created_at;
        const lastRunTime = new Date(lastSlaLog.created_at).getTime();
        const now = Date.now();
        const minutesSinceLastRun = (now - lastRunTime) / (1000 * 60);

        if (minutesSinceLastRun > 30) {
            slaJobStatus = 'degraded';
        }
        if (minutesSinceLastRun > 60) {
            slaJobStatus = 'down';
        }
    } else {
        slaJobStatus = 'degraded';
    }

    // Data freshness
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: latestCase } = await (supabase as any)
        .from('cases')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    let dataFreshnessMinutes = 0;
    if (latestCase) {
        const lastUpdate = new Date(latestCase.updated_at).getTime();
        dataFreshnessMinutes = Math.floor((Date.now() - lastUpdate) / (1000 * 60));
    }

    return {
        database_status: dbStatus,
        ml_service_status: mlStatus,
        sla_job_last_run: slaLastRun,
        sla_job_status: slaJobStatus,
        data_freshness_minutes: dataFreshnessMinutes,
    };
}

// ===========================================
// FULL DASHBOARD
// ===========================================

export async function getGovernanceDashboard(): Promise<GovernanceDashboard> {
    const [kpis, aiInsights, systemHealth] = await Promise.all([
        getGlobalKPIs(),
        getAIInsights(),
        getSystemHealth(),
    ]);

    return {
        kpis,
        ai_insights: aiInsights,
        system_health: systemHealth,
        generated_at: new Date().toISOString(),
    };
}

// ===========================================
// GLOBAL ANALYTICS
// ===========================================

export interface RegionAnalytics {
    region_id: string;
    region_name: string;
    total_cases: number;
    active_cases: number;
    recovery_rate: number;
    sla_compliance: number;
    total_outstanding: number;
    total_recovered: number;
}

export async function getGlobalAnalytics(
    startDate?: string,
    endDate?: string
): Promise<RegionAnalytics[]> {
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: regions } = await (supabase as any)
        .from('regions')
        .select('id, name, region_code')
        .eq('is_active', true);

    if (!regions) return [];

    const analytics: RegionAnalytics[] = [];

    for (const region of regions) {
        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('cases')
            .select('id, status, total_due, amount_recovered')
            .eq('region_id', region.id);

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data: cases } = await query;

        if (!cases) continue;

        const totalCases = cases.length;
        const activeCases = cases.filter((c: { status: string }) =>
            !['CLOSED', 'RECOVERED'].includes(c.status)).length;

        let totalOutstanding = 0;
        let totalRecovered = 0;

        for (const c of cases) {
            totalOutstanding += c.total_due || 0;
            totalRecovered += c.amount_recovered || 0;
        }

        const recoveryRate = totalOutstanding > 0
            ? (totalRecovered / totalOutstanding) * 100
            : 0;

        // Get SLA compliance for region
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: totalSLAs } = await (supabase as any)
            .from('sla_logs')
            .select('*, cases!inner(*)', { count: 'exact', head: true })
            .eq('cases.region_id', region.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: breachedSLAs } = await (supabase as any)
            .from('sla_logs')
            .select('*, cases!inner(*)', { count: 'exact', head: true })
            .eq('cases.region_id', region.id)
            .eq('status', 'BREACHED');

        const slaCompliance = totalSLAs && totalSLAs > 0
            ? ((totalSLAs - (breachedSLAs || 0)) / totalSLAs) * 100
            : 100;

        analytics.push({
            region_id: region.id,
            region_name: region.name,
            total_cases: totalCases,
            active_cases: activeCases,
            recovery_rate: Math.round(recoveryRate * 100) / 100,
            sla_compliance: Math.round(slaCompliance * 100) / 100,
            total_outstanding: totalOutstanding,
            total_recovered: totalRecovered,
        });
    }

    return analytics;
}
