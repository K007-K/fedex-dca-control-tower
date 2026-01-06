import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { UserRole } from '@/lib/auth/rbac';

export const dynamic = 'force-dynamic';

/**
 * Role hierarchy for deletion request approval
 * Maps requester role to roles that can approve their deletion
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
    'SUPER_ADMIN': [], // No one can approve SUPER_ADMIN deletion via this system
    'AUDITOR': ['FEDEX_ADMIN', 'SUPER_ADMIN'],
    'READONLY': ['FEDEX_MANAGER', 'FEDEX_ADMIN', 'SUPER_ADMIN'],
};

/**
 * Roles that can approve are the inverse - which roles can this user approve?
 */
function getApprovableRoles(userRole: UserRole): UserRole[] {
    const approvable: UserRole[] = [];
    for (const [role, approvers] of Object.entries(DELETION_APPROVER_ROLES)) {
        if (approvers.includes(userRole)) {
            approvable.push(role as UserRole);
        }
    }
    return approvable;
}

/**
 * POST /api/account-deletion
 * Submit a deletion request
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reason } = body;

        const adminClient = createAdminClient();

        // Check if user already has a pending request
        const { data: existingRequest } = await (adminClient as any)
            .from('account_deletion_requests')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('status', 'PENDING')
            .single();

        if (existingRequest) {
            return NextResponse.json(
                { error: 'You already have a pending deletion request' },
                { status: 400 }
            );
        }

        // Get user's DCA if applicable
        const { data: userProfile } = await (adminClient as any)
            .from('users')
            .select('dca_id, full_name')
            .eq('id', user.id)
            .single();

        // Create the deletion request
        const { data: newRequest, error } = await (adminClient as any)
            .from('account_deletion_requests')
            .insert({
                user_id: user.id,
                requester_email: user.email,
                requester_name: userProfile?.full_name || user.email,
                requester_role: user.role,
                requester_dca_id: userProfile?.dca_id || null,
                reason: reason || null,
                status: 'PENDING',
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create deletion request:', error);
            return NextResponse.json(
                { error: 'Failed to submit deletion request' },
                { status: 500 }
            );
        }

        // Log the action
        try {
            const { logUserAction } = await import('@/lib/audit');
            await logUserAction(
                'ACCOUNT_DELETION_REQUESTED',
                user.id,
                user.email,
                'account_deletion_requests',
                newRequest.id,
                { reason }
            );
        } catch { }

        return NextResponse.json({
            success: true,
            message: 'Deletion request submitted successfully',
            request: newRequest,
        });
    } catch (error) {
        console.error('Error submitting deletion request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/account-deletion
 * Get pending requests that the current user can handle (based on role hierarchy)
 * Also returns user's own request if exists
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminClient = createAdminClient();

        // Get user's own request
        const { data: ownRequest } = await (adminClient as any)
            .from('account_deletion_requests')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Get roles this user can approve
        const approvableRoles = getApprovableRoles(user.role as UserRole);

        let pendingRequests: any[] = [];

        if (approvableRoles.length > 0) {
            // Get user's DCA for scoping (DCA managers can only see requests from their DCA)
            const { data: userProfile } = await (adminClient as any)
                .from('users')
                .select('dca_id')
                .eq('id', user.id)
                .single();

            let query = (adminClient as any)
                .from('account_deletion_requests')
                .select('*')
                .eq('status', 'PENDING')
                .in('requester_role', approvableRoles)
                .order('created_at', { ascending: true });

            // DCA managers can only see requests from their own DCA (strict governance)
            if (['DCA_MANAGER', 'DCA_ADMIN'].includes(user.role) && userProfile?.dca_id) {
                query = query.eq('requester_dca_id', userProfile.dca_id);
            }

            const { data: requests } = await query;
            pendingRequests = requests || [];
        }

        return NextResponse.json({
            ownRequest: ownRequest || null,
            pendingRequests,
            canApprove: approvableRoles.length > 0,
            approvableRoles,
        });
    } catch (error) {
        console.error('Error fetching deletion requests:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
