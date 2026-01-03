/**
 * SUPER_ADMIN Global Analytics API
 * 
 * GET /api/v1/governance/analytics
 * 
 * Provides cross-region trends and analytics.
 * SUPER_ADMIN only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth/api-wrapper';
import { getGlobalAnalytics } from '@/lib/governance';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/governance/analytics
 * 
 * Returns global analytics by region.
 * Query params: start_date, end_date
 * Requires: analytics:custom permission (SUPER_ADMIN)
 */
export const GET = withPermission('analytics:custom', async (request: NextRequest, { user }) => {
    try {
        // Verify SUPER_ADMIN role
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SUPER_ADMIN_ONLY',
                        message: 'Global analytics is only accessible to SUPER_ADMIN',
                    },
                },
                { status: 403 }
            );
        }

        const url = new URL(request.url);
        const startDate = url.searchParams.get('start_date') || undefined;
        const endDate = url.searchParams.get('end_date') || undefined;

        const analytics = await getGlobalAnalytics(startDate, endDate);

        return NextResponse.json({
            success: true,
            data: {
                regions: analytics,
                total_regions: analytics.length,
                filters: {
                    start_date: startDate,
                    end_date: endDate,
                },
                generated_at: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Global analytics error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to load global analytics',
                },
            },
            { status: 500 }
        );
    }
});
