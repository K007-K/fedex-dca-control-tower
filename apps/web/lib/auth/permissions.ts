import { createClient } from '@/lib/supabase/server';

import { hasPermission, type Permission, type UserRole, ROLE_PERMISSIONS, isFedExRole, isDCARole } from './rbac';

/**
 * User session with role and permissions
 */
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string | null;
    dcaId: string | null;
    permissions: Permission[];
}

/**
 * Get the current authenticated user with role info from database
 * IMPORTANT: Looks up by email (stable) since auth.uid() may differ from users.id
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if (authError || !user) {
        return null;
    }

    // Fetch user profile from database BY EMAIL (not by ID!)
    // This is critical because seed data has different IDs than Supabase Auth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (supabase as any)
        .from('users')
        .select('id, role, organization_id, dca_id')
        .eq('email', user.email)
        .single();

    if (profileError || !profile) {
        // User exists in auth but not in users table - return with auth ID
        return {
            id: user.id,  // Fallback to auth ID
            email: user.email ?? '',
            role: 'READONLY',
            organizationId: null,
            dcaId: null,
            permissions: ROLE_PERMISSIONS['READONLY'],
        };
    }

    const role = profile.role as UserRole;

    return {
        id: profile.id,  // Use the database user ID, NOT auth.uid()!
        email: user.email ?? '',
        role,
        organizationId: profile.organization_id,
        dcaId: profile.dca_id,
        permissions: ROLE_PERMISSIONS[role] ?? [],
    };
}

/**
 * Check if current user has a specific permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;
    return hasPermission(user.role, permission);
}

/**
 * Require a specific permission - throws if not authorized
 */
export async function requirePermission(permission: Permission): Promise<AuthUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Unauthorized: Not authenticated');
    }

    if (!hasPermission(user.role, permission)) {
        throw new Error(`Forbidden: Missing permission '${permission}'`);
    }

    return user;
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<AuthUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Unauthorized: Not authenticated');
    }

    const hasAny = permissions.some(p => hasPermission(user.role, p));

    if (!hasAny) {
        throw new Error(`Forbidden: Missing required permissions`);
    }

    return user;
}

/**
 * Check if user can access a specific DCA's data
 */
export async function canAccessDCA(dcaId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    // FedEx roles can access all DCAs
    if (isFedExRole(user.role)) {
        return true;
    }

    // DCA roles can only access their own DCA
    if (isDCARole(user.role)) {
        return user.dcaId === dcaId;
    }

    // Auditors and readonly can view all
    if (['AUDITOR', 'READONLY'].includes(user.role)) {
        return true;
    }

    return false;
}

/**
 * Check if user can access a specific case
 * DCA users can only access cases assigned to their DCA
 */
export async function canAccessCase(caseId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    // FedEx roles can access all cases
    if (isFedExRole(user.role)) {
        return true;
    }

    // Auditors and readonly can view all
    if (['AUDITOR', 'READONLY'].includes(user.role)) {
        return true;
    }

    // DCA roles need to check if case is assigned to their DCA
    if (isDCARole(user.role) && user.dcaId) {
        const supabase = await createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
            .from('cases')
            .select('assigned_dca_id')
            .eq('id', caseId)
            .single();

        return data?.assigned_dca_id === user.dcaId;
    }

    return false;
}

/**
 * Get data filter for cases based on user role
 * Returns a DCA ID to filter by, or null for all cases
 */
export async function getCaseFilter(): Promise<{ dcaId: string | null }> {
    const user = await getCurrentUser();

    if (!user) {
        return { dcaId: null };
    }

    // FedEx roles see all cases
    if (isFedExRole(user.role) || user.role === 'AUDITOR' || user.role === 'READONLY') {
        return { dcaId: null };
    }

    // DCA roles only see their DCA's cases
    if (isDCARole(user.role)) {
        return { dcaId: user.dcaId };
    }

    return { dcaId: null };
}
