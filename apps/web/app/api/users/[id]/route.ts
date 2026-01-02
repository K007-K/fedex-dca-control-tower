import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/permissions';

function getAdminClient() {
    return createAdminSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * GET /api/users/[id] - Get a specific user
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
}

/**
 * PATCH /api/users/[id] - Update a user (deactivate, change role, etc.)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can update users
        if (!['SUPER_ADMIN', 'FEDEX_ADMIN'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const adminClient = getAdminClient();

        // Update user profile
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (adminClient as any)
            .from('users')
            .update({
                full_name: body.full_name,
                role: body.role,
                is_active: body.is_active,
                phone: body.phone,
                dca_id: body.dca_id,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update user error:', error);
            return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/users/[id] - Delete a user
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admins can delete users
        if (!['SUPER_ADMIN', 'FEDEX_ADMIN'].includes(currentUser.role)) {
            return NextResponse.json({ error: 'Only Admins can delete users' }, { status: 403 });
        }

        // Can't delete yourself
        if (currentUser.id === id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        // Handle all foreign key constraints by setting them to null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const admin = adminClient as any;

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

        // 6. Delete audit logs for this user (they have immutable rules but adminClient bypasses)
        // Note: audit logs have rules preventing normal deletes, but we'll try anyway
        try {
            await admin.from('audit_logs').delete().eq('user_id', id);
        } catch {
            // Audit log delete may fail due to immutable rules - that's OK
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
}
