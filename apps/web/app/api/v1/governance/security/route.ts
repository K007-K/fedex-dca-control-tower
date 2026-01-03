/**
 * SUPER_ADMIN Security Settings API
 * 
 * GET /api/v1/governance/security - View security settings
 * POST /api/v1/governance/security - Update security settings
 * 
 * SUPER_ADMIN only. All changes are audited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth/api-wrapper';
import { createAdminClient } from '@/lib/supabase/server';
import { logUserAction } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Default security settings
const DEFAULT_SETTINGS = {
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_number: true,
    password_require_special: true,
    session_timeout_minutes: 60,
    max_failed_login_attempts: 5,
    lockout_duration_minutes: 30,
    mfa_enabled: false,
    mfa_required_for_admins: false,
};

/**
 * GET /api/v1/governance/security
 * 
 * Returns current security settings.
 * Requires: admin:security permission (SUPER_ADMIN)
 */
export const GET = withPermission('admin:security', async (request, { user }) => {
    try {
        // Verify SUPER_ADMIN role
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SUPER_ADMIN_ONLY',
                        message: 'Security settings are only accessible to SUPER_ADMIN',
                    },
                },
                { status: 403 }
            );
        }

        const supabase = createAdminClient();

        // Get settings from system_settings table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: settings } = await (supabase as any)
            .from('system_settings')
            .select('key, value')
            .like('key', 'security.%');

        // Merge with defaults
        const securitySettings = { ...DEFAULT_SETTINGS };

        if (settings) {
            for (const s of settings) {
                const key = s.key.replace('security.', '');
                if (key in securitySettings) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (securitySettings as any)[key] = s.value;
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: securitySettings,
        });

    } catch (error) {
        console.error('Security settings error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to load security settings',
                },
            },
            { status: 500 }
        );
    }
});

/**
 * POST /api/v1/governance/security
 * 
 * Update security settings.
 * Requires: admin:security permission (SUPER_ADMIN)
 * All changes are audited.
 */
export const POST = withPermission('admin:security', async (request: NextRequest, { user }) => {
    try {
        // Verify SUPER_ADMIN role
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SUPER_ADMIN_ONLY',
                        message: 'Security settings can only be modified by SUPER_ADMIN',
                    },
                },
                { status: 403 }
            );
        }

        const body = await request.json();
        const supabase = createAdminClient();

        // Validate and update each setting
        const allowedKeys = Object.keys(DEFAULT_SETTINGS);
        const updatedSettings: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(body)) {
            if (!allowedKeys.includes(key)) {
                continue;
            }

            const dbKey = `security.${key}`;

            // Upsert into system_settings
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('system_settings')
                .upsert({
                    key: dbKey,
                    value: value,
                    updated_at: new Date().toISOString(),
                    updated_by: user.id,
                }, { onConflict: 'key' });

            updatedSettings[key] = value;
        }

        // Audit log
        await logUserAction(
            'SECURITY_SETTINGS_UPDATED',
            user.id,
            user.email,
            'system_settings',
            'security',
            {
                updated_fields: Object.keys(updatedSettings),
                new_values: updatedSettings,
            }
        );

        return NextResponse.json({
            success: true,
            data: {
                updated_settings: updatedSettings,
                updated_by: user.email,
                updated_at: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Security settings update error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to update security settings',
                },
            },
            { status: 500 }
        );
    }
});
