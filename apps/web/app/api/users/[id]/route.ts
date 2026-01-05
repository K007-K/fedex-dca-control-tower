import { NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

function getAdminClient() {
    return createAdminSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * ALLOWED fields for user update
 * CRITICAL: role, email, dca_id are IMMUTABLE and must NEVER be updated
 */
const ALLOWED_UPDATE_FIELDS = [
    'full_name',
    'phone',
    'is_active',
    'notification_preferences',
    'ui_preferences',
    'avatar_url',
    'timezone',
    'locale',
];

/**
 * Log user update audit entry
 */
async function logUserUpdateAudit(
    adminClient: ReturnType<typeof getAdminClient>,
    actorId: string,
    actorEmail: string,
    actorRole: string,
    targetUserId: string,
    changedFields: string[],
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>
) {
    try {
        await adminClient.from('audit_logs').insert({
            action: 'USER_UPDATE',
            entity_type: 'USER',
            entity_id: targetUserId,
            actor_id: actorId,
            actor_email: actorEmail,
            actor_role: actorRole,
            details: {
                changed_fields: changedFields,
                old_values: oldValues,
                new_values: newValues,
            },
            severity: 'INFO',
        });
    } catch (error) {
        console.error('Failed to log user update audit:', error);
        throw new Error('AUDIT_LOG_REQUIRED: Failed to log update');
    }
}

/**
 * GET /api/users/[id] - Get a specific user
 * Permission: users:read
 */
const handleGetUser: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('users')
            .select('*, organization:organizations(name), dca:dcas(name)')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

/**
 * PATCH /api/users/[id] - Update a user
 * Permission: users:update
 * 
 * GOVERNANCE RULES:
 * - email: IMMUTABLE - cannot be changed
 * - role: IMMUTABLE - cannot be changed
 * - dca_id: IMMUTABLE - cannot be changed
 * 
 * These fields are STRIPPED from the payload even if sent.
 * DB trigger also enforces this as a second layer.
 */
const handleUpdateUser: ApiHandler = async (request, { params, user: currentUser }) => {
    try {
        const { id } = await params;
        const body = await request.json();
        const adminClient = getAdminClient();

        // =====================================================
        // GOVERNANCE: Strip forbidden fields
        // =====================================================
        // NEVER allow these to be updated
        const forbiddenFields = ['email', 'role', 'dca_id', 'id', 'created_at'];
        const attemptedForbidden = forbiddenFields.filter(f => f in body);

        if (attemptedForbidden.length > 0) {
            console.warn(`[GOVERNANCE] Attempt to modify immutable fields: ${attemptedForbidden.join(', ')} by user ${currentUser.email}`);
        }

        // Build sanitized update payload
        const sanitizedPayload: Record<string, unknown> = {};
        const changedFields: string[] = [];

        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (field in body && body[field] !== undefined) {
                sanitizedPayload[field] = body[field];
                changedFields.push(field);
            }
        }

        if (changedFields.length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // =====================================================
        // Fetch current user data for audit comparison
        // =====================================================
        const { data: existingUser, error: fetchError } = await adminClient
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Build old values for audit
        const oldValues: Record<string, unknown> = {};
        for (const field of changedFields) {
            oldValues[field] = existingUser[field];
        }

        // =====================================================
        // Update user
        // =====================================================
        sanitizedPayload.updated_at = new Date().toISOString();

        const { data, error } = await adminClient
            .from('users')
            .update(sanitizedPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update user error:', error);
            // Check if it's immutability trigger
            if (error.message?.includes('USER_IDENTITY_IMMUTABLE')) {
                return NextResponse.json(
                    { error: 'Cannot modify immutable fields (email, role, DCA)' },
                    { status: 403 }
                );
            }
            return NextResponse.json(
                { error: 'Failed to update user', details: error.message },
                { status: 500 }
            );
        }

        // =====================================================
        // AUDIT LOG (MANDATORY)
        // =====================================================
        await logUserUpdateAudit(
            adminClient,
            currentUser.id,
            currentUser.email,
            currentUser.role,
            id,
            changedFields,
            oldValues,
            sanitizedPayload
        );

        return NextResponse.json({
            data,
            message: 'User updated successfully',
            changed_fields: changedFields,
        });
    } catch (error) {
        console.error('Update user error:', error);
        if (error instanceof Error && error.message.includes('AUDIT_LOG_REQUIRED')) {
            return NextResponse.json(
                { error: 'Failed to audit log the update - operation aborted' },
                { status: 500 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

/**
 * DELETE /api/users/[id] - Delete a user
 * Permission: users:delete
 */
const handleDeleteUser: ApiHandler = async (request, { params, user: currentUser }) => {
    try {
        const { id } = await params;

        // Can't delete yourself
        if (currentUser.id === id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        // Handle all foreign key constraints by setting them to null
        const admin = adminClient;

        // 1. Delete notifications
        await admin.from('notifications').delete().eq('recipient_id', id);

        // 2. Set null on case_actions.performed_by
        await admin.from('case_actions').update({ performed_by: null }).eq('performed_by', id);

        // 3. Set null on cases.assigned_agent_id, created_by, updated_by
        await admin.from('cases').update({ assigned_agent_id: null }).eq('assigned_agent_id', id);
        await admin.from('cases').update({ created_by: null }).eq('created_by', id);
        await admin.from('cases').update({ updated_by: null }).eq('updated_by', id);

        // 4. Set null on sla_logs.exempted_by
        await admin.from('sla_logs').update({ exempted_by: null }).eq('exempted_by', id);

        // 5. Set null on escalations.escalated_to, escalated_from, resolved_by
        await admin.from('escalations').update({ escalated_to: null }).eq('escalated_to', id);
        await admin.from('escalations').update({ escalated_from: null }).eq('escalated_from', id);
        await admin.from('escalations').update({ resolved_by: null }).eq('resolved_by', id);

        // 6. Delete audit logs for this user
        try {
            await admin.from('audit_logs').delete().eq('user_id', id);
        } catch {
            console.log('audit_logs deletion skipped (may have immutable rules)');
        }

        // 7. Set null on DCA created_by/updated_by references
        await admin.from('dcas').update({ created_by: null }).eq('created_by', id);
        await admin.from('dcas').update({ updated_by: null }).eq('updated_by', id);

        // Now delete from users table
        const { error: profileError } = await admin
            .from('users')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Delete user profile error:', profileError);
            return NextResponse.json({
                error: 'Failed to delete user profile',
                details: profileError.message
            }, { status: 500 });
        }

        // Delete from Supabase Auth
        try {
            await adminClient.auth.admin.deleteUser(id);
        } catch (authErr) {
            console.error('Delete auth user error (non-fatal):', authErr);
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

// Protected routes
export const GET = withPermission('users:read', handleGetUser);
export const PATCH = withPermission('users:update', handleUpdateUser);
export const DELETE = withPermission('users:delete', handleDeleteUser);
