/**
 * SLA Breach Check API
 * 
 * POST /api/v1/sla/breach-check
 * 
 * SYSTEM-ONLY endpoint for automated SLA breach detection.
 * Should be called by a cron job every 5-15 minutes.
 * 
 * Human actors cannot trigger this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent, logSystemAction } from '@/lib/audit';
import { getCurrentUser } from '@/lib/auth/permissions';
import { isSystemRequest, authenticateSystemRequest } from '@/lib/auth/system-auth';
import { runBreachDetection } from '@/lib/sla';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/sla/breach-check
 * 
 * SYSTEM-ONLY: Run SLA breach detection job.
 * 
 * Authorization: Requires SYSTEM authentication.
 * Human actors receive 403 Forbidden.
 */
export async function POST(request: NextRequest) {
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

    // ------------------------------------------
    // SECURITY CHECK 1: Block ALL human actors
    // ------------------------------------------

    if (!isSystemRequest(request)) {
        const user = await getCurrentUser();

        await logSecurityEvent(
            'PERMISSION_DENIED',
            user?.id || 'anonymous',
            {
                action: 'SLA_BREACH_CHECK_BLOCKED',
                reason: 'SLA breach detection is SYSTEM-only. Human actors cannot trigger it.',
                user_role: user?.role || 'anonymous',
                user_email: user?.email || 'anonymous',
                endpoint: '/api/v1/sla/breach-check',
            },
            ipAddress
        );

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'SYSTEM_ONLY_ENDPOINT',
                    message: 'SLA breach detection is performed automatically by SYSTEM. Human actors cannot trigger it.',
                },
            },
            { status: 403 }
        );
    }

    // ------------------------------------------
    // SECURITY CHECK 2: Authenticate SYSTEM actor
    // ------------------------------------------

    const systemAuth = await authenticateSystemRequest(request);

    if (!systemAuth.authenticated) {
        await logSecurityEvent(
            'PERMISSION_DENIED',
            'SYSTEM',
            {
                action: 'SLA_BREACH_CHECK_BLOCKED',
                reason: 'SYSTEM authentication failed',
                error: systemAuth.error,
            },
            ipAddress
        );

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'SYSTEM_AUTH_FAILED',
                    message: systemAuth.error || 'System authentication failed',
                },
            },
            { status: 403 }
        );
    }

    // ------------------------------------------
    // MAIN LOGIC: Run breach detection
    // ------------------------------------------

    try {
        const startTime = Date.now();

        await logSystemAction(
            'SLA_BREACH_CHECK_START',
            systemAuth.actor!.service_name,
            'system',
            'N/A',
            {
                triggered_by: systemAuth.actor!.service_name,
                start_time: new Date().toISOString(),
            }
        );

        const result = await runBreachDetection();

        const durationMs = Date.now() - startTime;

        return NextResponse.json({
            success: result.success,
            data: {
                breaches_detected: result.breaches_detected,
                breaches_processed: result.breaches_processed,
                escalations_triggered: result.escalations_triggered,
                errors: result.errors.length > 0 ? result.errors : undefined,
                duration_ms: durationMs,
            },
        });

    } catch (error) {
        console.error('SLA breach check API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An unexpected error occurred',
                },
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/v1/sla/breach-check
 * 
 * Health check for the SLA breach detection system.
 * Returns 200 if the system is operational.
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        data: {
            status: 'operational',
            description: 'SLA breach detection endpoint. POST to trigger detection (SYSTEM-only).',
        },
    });
}
