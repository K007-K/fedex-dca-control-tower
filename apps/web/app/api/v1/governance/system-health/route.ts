/**
 * SUPER_ADMIN System Health API
 * 
 * GET /api/v1/governance/system-health
 * 
 * View health status of all system components.
 * SUPER_ADMIN only.
 */

import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth/api-wrapper';
import { getSystemHealth } from '@/lib/governance';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/governance/system-health
 * 
 * Returns health status of system components.
 * Requires: admin:settings permission (SUPER_ADMIN)
 */
export const GET = withPermission('admin:settings', async (request, { user }) => {
    try {
        // Verify SUPER_ADMIN role
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SUPER_ADMIN_ONLY',
                        message: 'System health is only accessible to SUPER_ADMIN',
                    },
                },
                { status: 403 }
            );
        }

        const health = await getSystemHealth();

        // Calculate overall status
        const statuses = [
            health.database_status,
            health.ml_service_status,
            health.sla_job_status,
        ];

        let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
        if (statuses.includes('down')) {
            overallStatus = 'down';
        } else if (statuses.includes('degraded')) {
            overallStatus = 'degraded';
        }

        return NextResponse.json({
            success: true,
            data: {
                overall_status: overallStatus,
                components: {
                    database: health.database_status,
                    ml_service: health.ml_service_status,
                    sla_job: health.sla_job_status,
                },
                details: {
                    sla_job_last_run: health.sla_job_last_run,
                    data_freshness_minutes: health.data_freshness_minutes,
                },
                checked_at: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('System health error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to check system health',
                },
            },
            { status: 500 }
        );
    }
});
