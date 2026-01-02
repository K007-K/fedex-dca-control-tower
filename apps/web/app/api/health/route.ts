/* eslint-disable @typescript-eslint/no-explicit-any */

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/health
 * Health check endpoint - verifies database connectivity
 */
export async function GET() {
    const startTime = Date.now();

    try {
        const supabase = createAdminClient();

        // Check database connection by trying to access a table
        const result = await (supabase as any)
            .from('organizations')
            .select('id')
            .limit(1);

        const dbConnected = !result.error || result.error.code === 'PGRST116';
        const responseTime = Date.now() - startTime;

        // Get table counts if connected (tables might not exist yet)
        let stats = null;
        if (dbConnected && !result.error) {
            try {
                const [orgsCount, dcasCount, usersCount, casesCount] = await Promise.all([
                    (supabase as any).from('organizations').select('id', { count: 'exact', head: true }),
                    (supabase as any).from('dcas').select('id', { count: 'exact', head: true }),
                    (supabase as any).from('users').select('id', { count: 'exact', head: true }),
                    (supabase as any).from('cases').select('id', { count: 'exact', head: true }),
                ]);

                stats = {
                    organizations: orgsCount.count ?? 0,
                    dcas: dcasCount.count ?? 0,
                    users: usersCount.count ?? 0,
                    cases: casesCount.count ?? 0,
                };
            } catch {
                // Tables don't exist yet
                stats = { note: 'Run database migrations first' };
            }
        }

        return NextResponse.json({
            status: dbConnected ? 'healthy' : 'degraded',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            services: {
                database: {
                    connected: dbConnected,
                    tablesExist: !result.error,
                    error: result.error?.message ?? null,
                },
                supabase: {
                    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
                },
            },
            stats,
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
