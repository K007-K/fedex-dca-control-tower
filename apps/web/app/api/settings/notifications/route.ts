import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import {
    GOVERNED_NOTIFICATIONS,
    getNotificationsForRole,
    validatePreferenceUpdate
} from '@/lib/notifications/governance';
import { UserRole } from '@/lib/auth/rbac';
import { logUserAction } from '@/lib/audit';

// GET - Fetch notification preferences
export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role from profile
    let userRole: UserRole = 'FEDEX_VIEWER';
    if (user.email) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (profile?.role) {
            userRole = profile.role as UserRole;
        }
    }

    // Get saved preferences from user metadata
    const savedPreferences = user.user_metadata?.notification_preferences || {};

    // Return user role for the UI to filter available notifications
    return NextResponse.json({
        userRole,
        preferences: savedPreferences,
    });
}

// PUT - Update notification preferences
export async function PUT(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
        return NextResponse.json({ error: 'Invalid preferences format' }, { status: 400 });
    }

    // ============================================================
    // GOVERNANCE: Validate that critical notifications are not disabled
    // ============================================================
    const validation = validatePreferenceUpdate(preferences);

    if (!validation.valid) {
        // Log security event for attempted critical notification suppression
        await logUserAction(
            'PERMISSION_DENIED',
            user.id,
            user.email || 'unknown',
            'notification_preference',
            user.id,
            {
                action: 'CRITICAL_NOTIFICATION_SUPPRESSION_BLOCKED',
                attempted_notifications: validation.invalidChanges,
                reason: 'Critical notifications cannot be disabled',
            }
        );

        return NextResponse.json({
            error: 'Cannot disable critical notifications',
            message: 'The following notifications are required and cannot be turned off: ' +
                validation.invalidChanges.map(id => GOVERNED_NOTIFICATIONS[id]?.label || id).join(', '),
            invalid_changes: validation.invalidChanges,
        }, { status: 403 });
    }

    // ============================================================
    // Sanitize preferences - force critical notifications to ON
    // ============================================================
    const sanitizedPreferences = { ...preferences };
    for (const [notificationId, config] of Object.entries(GOVERNED_NOTIFICATIONS)) {
        if (config.isNonDisableable) {
            // Force critical notifications to always be enabled
            sanitizedPreferences[notificationId] = { email: true, inApp: true };
        }
    }

    // Store in user metadata
    const { error: updateError } = await supabase.auth.updateUser({
        data: { notification_preferences: sanitizedPreferences },
    });

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Log the preference update
    await logUserAction(
        'USER_UPDATED',
        user.id,
        user.email || 'unknown',
        'notification_preference',
        user.id,
        {
            action: 'NOTIFICATION_PREFERENCES_UPDATED',
            preferences_updated: Object.keys(preferences),
        }
    );

    return NextResponse.json({ success: true, message: 'Preferences saved' });
}
