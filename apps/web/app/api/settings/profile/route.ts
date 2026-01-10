import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logUserAction } from '@/lib/audit';
import {
    validateProfileUpdate,
    getEditableFields,
    getSecurityVisibility,
    canRevokeSessions,
    RESTRICTED_FIELDS
} from '@/lib/profile/governance';
import { UserRole } from '@/lib/auth/rbac';

// GET - Fetch user profile with role-aware security visibility
export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS for role lookup
    const adminSupabase = createAdminClient();

    // Try to fetch user profile from users table
    // First try by auth_user_id, then by email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data: profile } = await (adminSupabase as any)
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    // Fallback: try by email if auth_user_id didn't match
    if (!profile && user.email) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileByEmail } = await (adminSupabase as any)
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
        profile = profileByEmail;

        // If found by email, update the auth_user_id for future queries
        if (profile && !profile.auth_user_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (adminSupabase as any)
                .from('users')
                .update({ auth_user_id: user.id })
                .eq('id', profile.id);
        }
    }

    // Get role from profile, auth metadata, or default
    const userRole = (profile?.role || user.user_metadata?.role || 'FEDEX_VIEWER') as UserRole;

    if (!profile) {
        // If no profile exists at all, return info from auth
        const editableFields = getEditableFields(userRole);
        const securityVisibility = getSecurityVisibility(userRole);
        const canRevoke = canRevokeSessions(userRole);

        return NextResponse.json({
            email: user.email,
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
            role: userRole,
            editable_fields: editableFields,
            security_visibility: securityVisibility,
            can_revoke_sessions: canRevoke,
            restricted_fields: RESTRICTED_FIELDS,
            last_login: user.last_sign_in_at || null,
        });
    }

    // Get role-based governance rules
    const editableFields = getEditableFields(userRole);
    const securityVisibility = getSecurityVisibility(userRole);
    const canRevoke = canRevokeSessions(userRole);

    return NextResponse.json({
        ...profile,
        role: userRole, // Ensure role is correct
        // Governance metadata for UI
        editable_fields: editableFields,
        security_visibility: securityVisibility,
        can_revoke_sessions: canRevoke,
        restricted_fields: RESTRICTED_FIELDS,
        // Security info (role-aware)
        last_login: user.last_sign_in_at || null,
        password_changed: user.updated_at || null,
    });
}

// PUT - Update user profile with role-based field validation
export async function PUT(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role from profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
        .from('users')
        .select('id, role, email')
        .eq('auth_user_id', user.id)
        .single();

    const userRole = (profile?.role as UserRole) || 'FEDEX_VIEWER';
    const body = await request.json();

    // ============================================================
    // GOVERNANCE: Validate payload against role rules
    // ============================================================
    const validation = validateProfileUpdate(userRole, body);

    if (!validation.valid) {
        // Log security violation attempt
        await logUserAction(
            'PERMISSION_DENIED',
            user.id,
            user.email || 'unknown',
            'profile',
            user.id,
            {
                action: 'PROFILE_UPDATE_VIOLATION',
                violations: validation.violations,
                role: userRole,
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            }
        );

        return NextResponse.json(
            {
                error: 'Restricted for security and compliance',
                message: 'Some fields cannot be modified by your role',
                violations: validation.violations,
            },
            { status: 403 }
        );
    }

    // ============================================================
    // Apply ONLY sanitized (validated) fields
    // ============================================================
    const sanitizedUpdate = validation.sanitized;

    // If no valid fields to update, return early
    if (Object.keys(sanitizedUpdate).length === 0) {
        return NextResponse.json({
            success: true,
            message: 'No changes to apply',
            updated_fields: [],
        });
    }

    // Capture old values for audit
    const oldValues: Record<string, unknown> = {};
    for (const field of Object.keys(sanitizedUpdate)) {
        oldValues[field] = profile?.[field] || null;
    }

    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
        data: sanitizedUpdate,
    });

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Also update users table
    const tableUpdate: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    // Map display_name to full_name for users table
    if ('display_name' in sanitizedUpdate) {
        tableUpdate.full_name = sanitizedUpdate.display_name;
    }
    if ('phone' in sanitizedUpdate) {
        tableUpdate.phone = sanitizedUpdate.phone;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
        .from('users')
        .update(tableUpdate)
        .eq('auth_user_id', user.id);

    // ============================================================
    // AUDIT: Log successful profile update with field changes
    // ============================================================
    await logUserAction(
        'USER_UPDATED',
        user.id,
        user.email || 'unknown',
        'profile',
        user.id,
        {
            action: 'PROFILE_UPDATED',
            updated_fields: Object.keys(sanitizedUpdate),
            old_values: oldValues,
            new_values: sanitizedUpdate,
            role: userRole,
            source: 'UI',
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        }
    );

    return NextResponse.json({
        success: true,
        message: 'Profile updated',
        updated_fields: Object.keys(sanitizedUpdate),
    });
}
