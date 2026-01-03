import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { logUserAction } from '@/lib/audit';

export interface IntegrationStatus {
    name: string;
    status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
    last_checked_at: string;
    last_success_at: string | null;
    error_message: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * GET /api/integrations/status
 * Returns real-time status of all integrations
 * Role-aware: DCA users get limited info, FedEx users get full info
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

    const userRole = (profile?.role as string) || 'FEDEX_VIEWER';

    // DCA roles cannot access integrations
    if (['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'].includes(userRole)) {
        return NextResponse.json(
            { error: 'Integrations page is not available for DCA users' },
            { status: 403 }
        );
    }

    const now = new Date().toISOString();
    const integrations: IntegrationStatus[] = [];

    // ============================================================
    // 1. SUPABASE (Auth + Database)
    // ============================================================
    try {
        const startTime = Date.now();
        const { error: pingError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        const latency = Date.now() - startTime;

        integrations.push({
            name: 'Supabase',
            status: pingError ? 'DEGRADED' : 'CONNECTED',
            last_checked_at: now,
            last_success_at: pingError ? null : now,
            error_message: pingError?.message || null,
            metadata: {
                latency_ms: latency,
                url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/https?:\/\//, '').split('.')[0] + '...',
            },
        });
    } catch (error) {
        integrations.push({
            name: 'Supabase',
            status: 'DISCONNECTED',
            last_checked_at: now,
            last_success_at: null,
            error_message: error instanceof Error ? error.message : 'Connection failed',
        });
    }

    // ============================================================
    // 2. ML SERVICE
    // ============================================================
    try {
        const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const mlRes = await fetch(`${mlUrl}/health`, {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (mlRes.ok) {
            const mlData = await mlRes.json();
            integrations.push({
                name: 'ML Service',
                status: 'CONNECTED',
                last_checked_at: now,
                last_success_at: now,
                error_message: null,
                metadata: {
                    version: mlData.version || 'unknown',
                    status: mlData.status || 'healthy',
                },
            });
        } else {
            integrations.push({
                name: 'ML Service',
                status: 'DEGRADED',
                last_checked_at: now,
                last_success_at: null,
                error_message: `HTTP ${mlRes.status}`,
            });
        }
    } catch (error) {
        integrations.push({
            name: 'ML Service',
            status: 'DISCONNECTED',
            last_checked_at: now,
            last_success_at: null,
            error_message: error instanceof Error ? error.message : 'Service unreachable',
            metadata: {
                url: process.env.ML_SERVICE_URL ? 'configured' : 'localhost:8000',
            },
        });
    }

    // ============================================================
    // 3. EMAIL SERVICE
    // ============================================================
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    integrations.push({
        name: 'Email Service',
        status: smtpConfigured ? 'CONNECTED' : 'DISCONNECTED',
        last_checked_at: now,
        last_success_at: smtpConfigured ? now : null,
        error_message: smtpConfigured ? null : 'SMTP credentials not configured',
        metadata: {
            provider: smtpConfigured ? 'Gmail SMTP' : 'Not configured',
            from: process.env.EMAIL_FROM ? '••••configured' : 'Not set',
        },
    });

    // ============================================================
    // 4. SLACK (OAuth - Not yet implemented)
    // ============================================================
    integrations.push({
        name: 'Slack',
        status: 'DISCONNECTED',
        last_checked_at: now,
        last_success_at: null,
        error_message: 'Feature not yet enabled',
        metadata: {
            feature_status: 'planned',
        },
    });

    // ============================================================
    // 5. FEDEX PRODUCTION API (Status based on key existence)
    // ============================================================
    // Only include for SUPER_ADMIN and FEDEX_ADMIN
    if (['SUPER_ADMIN', 'FEDEX_ADMIN'].includes(userRole)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: apiKey } = await (supabase as any)
            .from('api_keys')
            .select('id, is_active, created_at')
            .eq('is_active', true)
            .limit(1)
            .single();

        integrations.push({
            name: 'FedEx Production API',
            status: apiKey ? 'CONNECTED' : 'DISCONNECTED',
            last_checked_at: now,
            last_success_at: apiKey ? (apiKey.created_at as string) : null,
            error_message: apiKey ? null : 'No active API key',
            metadata: {
                has_active_key: !!apiKey,
                // Don't expose key details
            },
        });
    }

    return NextResponse.json({
        environment: process.env.NODE_ENV || 'development',
        checked_at: now,
        user_role: userRole,
        integrations,
    });
}

/**
 * POST /api/integrations/status
 * Trigger integration action (refresh, test email, etc.)
 * Requires SUPER_ADMIN for destructive actions
 */
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

    const userRole = (profile?.role as string) || 'FEDEX_VIEWER';

    const body = await request.json();
    const { action, integration } = body;

    // Log all integration actions
    await logUserAction(
        'INTEGRATION_ACTION',
        user.id,
        user.email || 'unknown',
        'integration',
        integration,
        {
            action,
            integration,
            user_role: userRole,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        }
    );

    switch (action) {
        case 'test_email':
            // Only SUPER_ADMIN and FEDEX_ADMIN can test email
            if (!['SUPER_ADMIN', 'FEDEX_ADMIN'].includes(userRole)) {
                return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
            }

            try {
                const { sendEmail } = await import('@/lib/email/send-email');
                const result = await sendEmail({
                    to: user.email || '',
                    subject: 'DCA Control Tower - Email Test',
                    html: '<p>This is a test email from the DCA Control Tower integration check.</p>',
                });

                return NextResponse.json({
                    success: result.success,
                    message: result.success ? 'Test email sent successfully' : result.error,
                });
            } catch (error) {
                return NextResponse.json({
                    success: false,
                    message: error instanceof Error ? error.message : 'Failed to send test email',
                });
            }

        default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
}
