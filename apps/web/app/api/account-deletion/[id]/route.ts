import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { UserRole } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

/**
 * Role hierarchy for deletion request approval
 */
const DELETION_APPROVER_ROLES: Record<UserRole, UserRole[]> = {
    'DCA_AGENT': ['DCA_MANAGER', 'DCA_ADMIN'],
    'DCA_MANAGER': ['DCA_ADMIN'],
    'DCA_ADMIN': ['FEDEX_ADMIN', 'SUPER_ADMIN'],
    'FEDEX_VIEWER': ['FEDEX_MANAGER', 'FEDEX_ADMIN', 'SUPER_ADMIN'],
    'FEDEX_ANALYST': ['FEDEX_MANAGER', 'FEDEX_ADMIN', 'SUPER_ADMIN'],
    'FEDEX_AUDITOR': ['FEDEX_ADMIN', 'SUPER_ADMIN'],
    'FEDEX_MANAGER': ['FEDEX_ADMIN', 'SUPER_ADMIN'],
    'FEDEX_ADMIN': ['SUPER_ADMIN'],
    'SUPER_ADMIN': [],
    'AUDITOR': ['FEDEX_ADMIN', 'SUPER_ADMIN'],
    'READONLY': ['FEDEX_MANAGER', 'FEDEX_ADMIN', 'SUPER_ADMIN'],
};

/**
 * PUT /api/account-deletion/[id]
 * Approve or reject a deletion request
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: requestId } = await params;
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, notes } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be "approve" or "reject"' },
                { status: 400 }
            );
        }

        const adminClient = createAdminClient();

        // Get the request
        const { data: deletionRequest, error: fetchError } = await (adminClient as any)
            .from('account_deletion_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !deletionRequest) {
            return NextResponse.json(
                { error: 'Deletion request not found' },
                { status: 404 }
            );
        }

        // Check if request is still pending
        if (deletionRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: `Request has already been ${deletionRequest.status.toLowerCase()}` },
                { status: 400 }
            );
        }

        // Check if current user can approve this request
        const requesterRole = deletionRequest.requester_role as UserRole;
        const approvers = DELETION_APPROVER_ROLES[requesterRole] || [];

        if (!approvers.includes(user.role as UserRole)) {
            return NextResponse.json(
                { error: 'You are not authorized to handle this deletion request' },
                { status: 403 }
            );
        }

        // For DCA managers, verify they're from the same DCA
        if (['DCA_MANAGER', 'DCA_ADMIN'].includes(user.role)) {
            const { data: userProfile } = await (adminClient as any)
                .from('users')
                .select('dca_id')
                .eq('id', user.id)
                .single();

            if (userProfile?.dca_id && deletionRequest.requester_dca_id !== userProfile.dca_id) {
                return NextResponse.json(
                    { error: 'You can only handle requests from users in your DCA' },
                    { status: 403 }
                );
            }
        }

        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

        // Update the request
        const { error: updateError } = await (adminClient as any)
            .from('account_deletion_requests')
            .update({
                status: newStatus,
                handled_by: user.id,
                handled_at: new Date().toISOString(),
                handler_notes: notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', requestId);

        if (updateError) {
            console.error('Failed to update deletion request:', updateError);
            return NextResponse.json(
                { error: 'Failed to update request' },
                { status: 500 }
            );
        }

        // If approved, FULLY DELETE the user (not just deactivate)
        if (action === 'approve') {
            const userId = deletionRequest.user_id;

            // Step 1: Delete from Supabase Auth FIRST (critical for preventing login)
            try {
                await adminClient.auth.admin.deleteUser(userId);
            } catch (authErr) {
                console.error('Failed to delete auth user:', authErr);
                // If auth deletion fails, we should not continue
                return NextResponse.json(
                    { error: 'Failed to delete user from authentication system' },
                    { status: 500 }
                );
            }

            // Step 2: Clean up foreign key references
            try {
                await (adminClient as any).from('notifications').delete().eq('recipient_id', userId);
                await (adminClient as any).from('audit_logs').delete().eq('user_id', userId);
            } catch (cleanupErr) {
                console.warn('Some cleanup operations failed:', cleanupErr);
                // Non-fatal - user already can't login
            }

            // Step 3: Delete user profile
            const { error: deleteError } = await (adminClient as any)
                .from('users')
                .delete()
                .eq('id', userId);

            if (deleteError) {
                console.error('Failed to delete user profile:', deleteError);
                // Auth is already deleted, so user can't login - log but don't fail
                console.warn('User auth deleted but profile deletion failed');
            }
        }

        // Log the action
        try {
            const { logUserAction } = await import('@/lib/audit');
            await logUserAction({
                action: (action === 'approve' ? 'ACCOUNT_DELETION_APPROVED' : 'ACCOUNT_DELETION_REJECTED') as any,
                userId: user.id,
                userEmail: user.email,
                resourceType: 'account_deletion_requests',
                resourceId: requestId,
                details: {
                    requester_id: deletionRequest.user_id,
                    requester_email: deletionRequest.requester_email,
                    notes,
                },
            });
        } catch { }

        return NextResponse.json({
            success: true,
            message: `Deletion request ${newStatus.toLowerCase()} successfully`,
            status: newStatus,
        });
    } catch (error) {
        console.error('Error handling deletion request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
