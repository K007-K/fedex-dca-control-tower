/**
 * SUPER_ADMIN Global Dashboard API
 * 
 * GET /api/v1/governance/dashboard
 * 
 * Provides global KPIs, AI insights, and system health.
 * SUPER_ADMIN only.
 */

import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth/api-wrapper';
import { getGovernanceDashboard } from '@/lib/governance';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/governance/dashboard
 * 
 * Returns global governance dashboard data.
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
                        message: 'Governance dashboard is only accessible to SUPER_ADMIN',
                    },
                },
                { status: 403 }
            );
        }

        const dashboard = await getGovernanceDashboard();

        return NextResponse.json({
            success: true,
            data: dashboard,
        });

    } catch (error) {
        console.error('Governance dashboard error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to load governance dashboard',
                },
            },
            { status: 500 }
        );
    }
});
