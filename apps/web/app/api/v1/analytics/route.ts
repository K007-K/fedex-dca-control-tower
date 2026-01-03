import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { validateApiKey } from '@/lib/auth/api-key-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/lib/audit';

/**
 * GET /api/v1/analytics - Get analytics data via API key authentication
 * 
 * This is an EXTERNAL API endpoint using API key auth (not session-based RBAC).
 * API keys have their own permission scopes validated via validateApiKey().
 * 
 * Headers:
 *   Authorization: Bearer fedex_prod_xxxxx
 * 
 * Returns:
 *   Case counts by status, priority, and recent activity
 */
export async function GET(request: NextRequest) {
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

    // Validate API key - this is the RBAC check for external API
    const validation = await validateApiKey(request);

    if (!validation.valid) {
        // Log the failed authentication attempt
        await logSecurityEvent('API_KEY_INVALID', undefined, {
            error: validation.error,
            endpoint: '/api/v1/analytics',
            method: 'GET',
        }, ipAddress);

        return NextResponse.json(
            {
                error: 'Unauthorized',
                message: validation.error,
                hint: 'Include header: Authorization: Bearer <your_api_key>'
            },
            { status: 401 }
        );
    }

    // API key validation includes scope check - only keys with 'analytics:read' scope can access
    // This is enforced in validateApiKey()

    try {
        const supabase = createAdminClient();

        // Get total counts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: totalCases } = await (supabase as any)
            .from('cases')
            .select('*', { count: 'exact', head: true });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: openCases } = await (supabase as any)
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: escalatedCases } = await (supabase as any)
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'escalated');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: resolvedCases } = await (supabase as any)
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'resolved');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: criticalCases } = await (supabase as any)
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('priority', 'critical');

        // Get recent cases
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: recentCases } = await (supabase as any)
            .from('cases')
            .select('id, case_number, title, status, priority, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    total_cases: totalCases || 0,
                    open_cases: openCases || 0,
                    escalated_cases: escalatedCases || 0,
                    resolved_cases: resolvedCases || 0,
                    critical_cases: criticalCases || 0,
                    resolution_rate: totalCases
                        ? Math.round(((resolvedCases || 0) / totalCases) * 100)
                        : 0,
                },
                recent_cases: recentCases || [],
            },
            generated_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('API v1 analytics error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
