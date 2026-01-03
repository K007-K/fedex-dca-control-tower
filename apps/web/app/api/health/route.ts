/**
 * System Health Check API
 * 
 * GET /api/health
 * 
 * Comprehensive health check endpoint for production monitoring.
 * Non-destructive, read-only checks.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface HealthStatus {
    status: 'ok' | 'degraded' | 'down';
    timestamp: string;
    version: string;
    response_time_ms: number;
    services: {
        database: 'connected' | 'disconnected';
        ml_service: 'connected' | 'disconnected';
        sla_job: 'running' | 'stopped' | 'unknown';
        allocation_job: 'running' | 'stopped' | 'unknown';
    };
    details: {
        db_latency_ms: number;
        ml_latency_ms: number;
        sla_job_last_run: string | null;
        allocation_job_last_run: string | null;
        table_counts?: {
            cases: number;
            dcas: number;
            users: number;
            regions: number;
        };
    };
}

/**
 * Check database connectivity with simple query
 */
async function checkDatabase(supabase: any): Promise<{ connected: boolean; latency: number; counts?: { cases: number; dcas: number; users: number; regions: number } }> {
    const start = Date.now();

    try {
        const { error } = await supabase
            .from('regions')
            .select('id')
            .limit(1);

        const latency = Date.now() - start;

        if (error) {
            return { connected: false, latency };
        }

        // Get table counts
        const [casesRes, dcasRes, usersRes, regionsRes] = await Promise.all([
            supabase.from('cases').select('id', { count: 'exact', head: true }),
            supabase.from('dcas').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('regions').select('id', { count: 'exact', head: true }),
        ]);

        return {
            connected: true,
            latency,
            counts: {
                cases: casesRes.count ?? 0,
                dcas: dcasRes.count ?? 0,
                users: usersRes.count ?? 0,
                regions: regionsRes.count ?? 0,
            },
        };
    } catch {
        return { connected: false, latency: Date.now() - start };
    }
}

/**
 * Check ML service connectivity
 */
async function checkMLService(): Promise<{ connected: boolean; latency: number }> {
    const start = Date.now();
    const mlUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
        const response = await fetch(`${mlUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });

        const latency = Date.now() - start;
        return { connected: response.ok, latency };
    } catch {
        return { connected: false, latency: Date.now() - start };
    }
}

/**
 * Check SLA job liveness from audit logs
 */
async function checkSLAJob(supabase: any): Promise<{ status: 'running' | 'stopped' | 'unknown'; lastRun: string | null }> {
    try {
        const { data } = await supabase
            .from('audit_logs')
            .select('created_at')
            .in('action', ['SLA_BREACH_CHECK', 'SLA_BREACH_CHECK_START'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!data) {
            return { status: 'unknown', lastRun: null };
        }

        const lastRun = new Date(data.created_at);
        const minutesAgo = (Date.now() - lastRun.getTime()) / (1000 * 60);

        if (minutesAgo < 30) {
            return { status: 'running', lastRun: data.created_at };
        } else {
            return { status: 'stopped', lastRun: data.created_at };
        }
    } catch {
        return { status: 'unknown', lastRun: null };
    }
}

/**
 * Check allocation job liveness from audit logs
 */
async function checkAllocationJob(supabase: any): Promise<{ status: 'running' | 'stopped' | 'unknown'; lastRun: string | null }> {
    try {
        const { data } = await supabase
            .from('audit_logs')
            .select('created_at')
            .eq('action', 'CASE_ASSIGNED')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!data) {
            return { status: 'unknown', lastRun: null };
        }

        const lastRun = new Date(data.created_at);
        const hoursAgo = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);

        if (hoursAgo < 24) {
            return { status: 'running', lastRun: data.created_at };
        } else {
            return { status: 'stopped', lastRun: data.created_at };
        }
    } catch {
        return { status: 'unknown', lastRun: null };
    }
}

/**
 * GET /api/health
 * 
 * Returns comprehensive health status.
 */
export async function GET() {
    const startTime = Date.now();

    // Check environment
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({
            status: 'down',
            timestamp: new Date().toISOString(),
            error: 'Missing required environment variables',
        }, { status: 503 });
    }

    const supabase = createAdminClient();

    // Run all checks in parallel
    const [dbCheck, mlCheck, slaCheck, allocationCheck] = await Promise.all([
        checkDatabase(supabase),
        checkMLService(),
        checkSLAJob(supabase),
        checkAllocationJob(supabase),
    ]);

    // Determine overall status
    let status: 'ok' | 'degraded' | 'down' = 'ok';

    if (!dbCheck.connected) {
        status = 'down';
    } else if (!mlCheck.connected || slaCheck.status === 'stopped') {
        status = 'degraded';
    }

    const responseTime = Date.now() - startTime;

    const healthStatus: HealthStatus = {
        status,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        response_time_ms: responseTime,
        services: {
            database: dbCheck.connected ? 'connected' : 'disconnected',
            ml_service: mlCheck.connected ? 'connected' : 'disconnected',
            sla_job: slaCheck.status,
            allocation_job: allocationCheck.status,
        },
        details: {
            db_latency_ms: dbCheck.latency,
            ml_latency_ms: mlCheck.latency,
            sla_job_last_run: slaCheck.lastRun,
            allocation_job_last_run: allocationCheck.lastRun,
            table_counts: dbCheck.counts,
        },
    };

    return NextResponse.json(healthStatus, {
        status: status === 'down' ? 503 : 200,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
}
