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
 * 
 * GOVERNANCE (STRICT):
 * - SUPER_ADMIN: Can view all FedEx roles + DCA_ADMIN only (not DCA_MANAGER, DCA_AGENT)
 * - FEDEX_ADMIN: Can view FedEx roles (below) + DCA_ADMIN only (not SUPER_ADMIN, not DCA internal)
 * - FEDEX_MANAGER/ANALYST/AUDITOR/VIEWER: Read-only access to users they can see
 * - DCA_ADMIN: Can view DCA_MANAGER + DCA_AGENT in their own DCA only
 * - DCA_MANAGER: Can view DCA_AGENT in their own DCA only
 * - DCA_AGENT: No user access
 */
const handleGetUser: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const adminClient = getAdminClient();

        // Use admin client to bypass RLS
        const { data, error } = await adminClient
            .from('users')
            .select('*, organization:organizations(name), dca:dcas(name)')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const targetRole = data.role;
        const targetDcaId = data.dca_id;
        const currentRole = user.role;
        const currentDcaId = user.dcaId;

        // Helper: Define role categories
        const FEDEX_INTERNAL_ROLES = ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER'];
        const DCA_INTERNAL_ROLES = ['DCA_MANAGER', 'DCA_AGENT'];

        // =====================================================
        // GOVERNANCE: Role-based visibility rules
        // =====================================================

        if (currentRole === 'SUPER_ADMIN') {
            // SUPER_ADMIN: Can see FedEx roles + DCA_ADMIN; NOT DCA internal users
            if (DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
        } else if (currentRole === 'FEDEX_ADMIN') {
            // FEDEX_ADMIN: Cannot see SUPER_ADMIN or DCA internal users
            if (targetRole === 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            if (DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
        } else if (['FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER'].includes(currentRole)) {
            // Other FedEx roles: Can only see FedEx users + DCA_ADMIN (not DCA internal)
            if (DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
        } else if (currentRole === 'DCA_ADMIN') {
            // DCA_ADMIN: Can only see DCA_MANAGER + DCA_AGENT in their own DCA
            if (!DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            if (targetDcaId !== currentDcaId) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
        } else if (currentRole === 'DCA_MANAGER') {
            // DCA_MANAGER: Can only see DCA_AGENT in their own DCA
            if (targetRole !== 'DCA_AGENT') {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            if (targetDcaId !== currentDcaId) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
        } else if (currentRole === 'DCA_AGENT') {
            // DCA_AGENT: No user access
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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

        const targetRole = existingUser.role;
        const targetDcaId = existingUser.dca_id;
        const userRole = currentUser.role;
        const userDcaId = currentUser.dcaId;

        // Helper: Define role categories
        const DCA_INTERNAL_ROLES = ['DCA_MANAGER', 'DCA_AGENT'];

        // =====================================================
        // GOVERNANCE: Role-based update restrictions (STRICT)
        // =====================================================
        if (userRole === 'SUPER_ADMIN') {
            // SUPER_ADMIN: Can update FedEx roles + DCA_ADMIN; NOT DCA internal
            if (DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'Cannot manage internal DCA users' }, { status: 403 });
            }
        } else if (userRole === 'FEDEX_ADMIN') {
            // FEDEX_ADMIN: Cannot update SUPER_ADMIN or DCA internal users
            if (targetRole === 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'Cannot manage Super Admin' }, { status: 403 });
            }
            if (DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'Cannot manage internal DCA users' }, { status: 403 });
            }
        } else if (['FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER'].includes(userRole)) {
            // Other FedEx roles: No user update permission
            return NextResponse.json({ error: 'You do not have permission to update users' }, { status: 403 });
        } else if (userRole === 'DCA_ADMIN') {
            // DCA_ADMIN: Can only update DCA_MANAGER + DCA_AGENT in their own DCA
            if (!DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'Cannot manage non-DCA users' }, { status: 403 });
            }
            if (targetDcaId !== userDcaId) {
                return NextResponse.json({ error: 'Cannot update users outside your DCA' }, { status: 403 });
            }
        } else if (userRole === 'DCA_MANAGER') {
            // DCA_MANAGER: Can only update DCA_AGENT in their own DCA
            if (targetRole !== 'DCA_AGENT') {
                return NextResponse.json({ error: 'You can only update DCA Agent users' }, { status: 403 });
            }
            if (targetDcaId !== userDcaId) {
                return NextResponse.json({ error: 'Cannot update users outside your DCA' }, { status: 403 });
            }
        } else if (userRole === 'DCA_AGENT') {
            // DCA_AGENT: No user management
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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
 * 
 * GOVERNANCE (STRICT):
 * - SUPER_ADMIN: Can delete FedEx roles + DCA_ADMIN; NOT DCA internal
 * - FEDEX_ADMIN: Can delete FedEx (below) + DCA_ADMIN; NOT SUPER_ADMIN or DCA internal
 * - FEDEX_MANAGER/ANALYST/AUDITOR/VIEWER: No delete permission
 * - DCA_ADMIN: Can delete DCA_MANAGER + DCA_AGENT in their own DCA
 * - DCA_MANAGER: Can delete DCA_AGENT in their own DCA
 * - DCA_AGENT: No delete permission
 */
const handleDeleteUser: ApiHandler = async (request, { params, user: currentUser }) => {
    try {
        const { id } = await params;

        // Can't delete yourself
        if (currentUser.id === id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        // Fetch the user to be deleted for governance checks
        const { data: targetUser, error: fetchError } = await adminClient
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const targetRole = targetUser.role;
        const targetDcaId = targetUser.dca_id;
        const userRole = currentUser.role;
        const userDcaId = currentUser.dcaId;

        // Helper: Define role categories
        const DCA_INTERNAL_ROLES = ['DCA_MANAGER', 'DCA_AGENT'];

        // =====================================================
        // GOVERNANCE: Role-based delete restrictions (STRICT)
        // =====================================================
        if (userRole === 'SUPER_ADMIN') {
            // SUPER_ADMIN: Can delete FedEx roles + DCA_ADMIN; NOT DCA internal
            if (DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'Cannot manage internal DCA users' }, { status: 403 });
            }
        } else if (userRole === 'FEDEX_ADMIN') {
            // FEDEX_ADMIN: Cannot delete SUPER_ADMIN or DCA internal users
            if (targetRole === 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'Cannot manage Super Admin' }, { status: 403 });
            }
            if (DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'Cannot manage internal DCA users' }, { status: 403 });
            }
        } else if (['FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER'].includes(userRole)) {
            // Other FedEx roles: No delete permission
            return NextResponse.json({ error: 'You do not have permission to delete users' }, { status: 403 });
        } else if (userRole === 'DCA_ADMIN') {
            // DCA_ADMIN: Can only delete DCA_MANAGER + DCA_AGENT in their own DCA
            if (!DCA_INTERNAL_ROLES.includes(targetRole)) {
                return NextResponse.json({ error: 'Cannot manage non-DCA users' }, { status: 403 });
            }
            if (targetDcaId !== userDcaId) {
                return NextResponse.json({ error: 'Cannot delete users outside your DCA' }, { status: 403 });
            }
        } else if (userRole === 'DCA_MANAGER') {
            // DCA_MANAGER: Can only delete DCA_AGENT in their own DCA
            if (targetRole !== 'DCA_AGENT') {
                return NextResponse.json({ error: 'You can only delete DCA Agent users' }, { status: 403 });
            }
            if (targetDcaId !== userDcaId) {
                return NextResponse.json({ error: 'Cannot delete users outside your DCA' }, { status: 403 });
            }
        } else if (userRole === 'DCA_AGENT') {
            // DCA_AGENT: No delete permission
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

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

        // Delete from Supabase Auth FIRST (most critical step)
        // If this fails, user can still login, so we must ensure it succeeds
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(id);
        if (authDeleteError) {
            console.error('Delete auth user error:', authDeleteError);
            return NextResponse.json({
                error: 'Failed to delete user from authentication system',
                details: authDeleteError.message
            }, { status: 500 });
        }

        // Now delete from users table (after auth is deleted, user can't login)
        const { error: profileError } = await admin
            .from('users')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Delete user profile error:', profileError);
            // Auth user is already deleted, so this is a partial failure
            // Log but don't fail completely - the user can't login anymore
            console.warn('Profile deletion failed after auth deletion - orphaned auth delete');
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
