/**
 * Page Access Guard
 * 
 * Enterprise governance enforcement for page-level access control.
 * This utility ensures UI visibility aligns with backend permissions.
 * 
 * CRITICAL: Backend is always the source of truth. This guard provides
 * consistent UI enforcement that MATCHES backend authorization.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, type Permission, type UserRole } from '@/lib/auth/rbac';

/**
 * Page access configuration
 * Maps pages to their access requirements
 */
export interface PageAccessConfig {
    // Roles that can access this page
    allowedRoles?: UserRole[];
    // Permission required to access this page
    requiredPermission?: Permission;
    // Custom access check function
    customCheck?: (user: { role: UserRole; dcaId?: string }) => boolean;
    // Redirect URL when access denied (default: /dashboard)
    redirectTo?: string;
    // Error message for audit logging
    denyReason?: string;
}

/**
 * Pre-defined page access configurations
 */
export const PAGE_ACCESS_CONFIG: Record<string, PageAccessConfig> = {
    // Standard Dashboard - DCA_AGENT and DCA_MANAGER should use their own dashboards
    '/dashboard': {
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'DCA_ADMIN', 'AUDITOR', 'READONLY'],
        // Redirect handled specially in guardPage for manager vs agent
        denyReason: 'DCA Agent/Manager should use their own Dashboard',
    },

    // Standard Cases - DCA_AGENT and DCA_MANAGER should use their own case views
    '/cases': {
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'DCA_ADMIN', 'AUDITOR', 'READONLY'],
        // Redirect handled specially in guardPage for manager vs agent
        denyReason: 'DCA Agent/Manager should use their own Cases',
    },

    // Overview - DCA_AGENT and DCA_MANAGER should use their own overviews
    '/overview': {
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'DCA_ADMIN', 'AUDITOR', 'READONLY'],
        // Redirect handled specially in guardPage for manager vs agent
        denyReason: 'DCA Agent/Manager should use their own Overview',
    },

    // Analytics - FedEx roles only (DCA_ADMIN blocked per master spec)
    '/analytics': {
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR'],
        denyReason: 'Analytics is restricted to FedEx roles only',
    },

    // Reports - FedEx internal roles only
    '/reports': {
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST'],
        denyReason: 'Reports are restricted to FedEx internal roles',
    },

    // DCAs - FedEx roles only (DCA_ADMIN blocked per master spec - can only see own DCA)
    '/dcas': {
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'AUDITOR', 'READONLY'],
        denyReason: 'DCA users cannot access cross-DCA management page',
    },

    // SLA Management - FedEx roles only (DCA_ADMIN blocked per master spec)
    '/sla': {
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER', 'AUDITOR', 'READONLY'],
        denyReason: 'SLA templates are FedEx-managed, DCA users cannot modify',
    },

    // Settings/Users - requires users:read permission
    '/settings/users': {
        requiredPermission: 'users:read',
        allowedRoles: ['SUPER_ADMIN', 'FEDEX_ADMIN', 'DCA_ADMIN'],
        denyReason: 'User management requires appropriate permissions',
    },

    // Settings/Integrations - SUPER_ADMIN only
    '/settings/integrations': {
        allowedRoles: ['SUPER_ADMIN'],
        denyReason: 'Integrations are restricted to Super Admin',
    },

    // Settings/Governance - SUPER_ADMIN only
    '/settings/governance': {
        allowedRoles: ['SUPER_ADMIN'],
        denyReason: 'Platform governance is restricted to Super Admin',
    },

    // Settings/Security - all authenticated users
    '/settings/security': {
        // All users can access their own security settings
    },
};

/**
 * Check if user has access to a page
 * Returns true if allowed, false if denied
 */
export function checkPageAccess(
    userRole: UserRole,
    config: PageAccessConfig,
    userDcaId?: string
): boolean {
    // If custom check provided, use it
    if (config.customCheck) {
        return config.customCheck({ role: userRole, dcaId: userDcaId });
    }

    // Check allowed roles first (more specific)
    if (config.allowedRoles && config.allowedRoles.length > 0) {
        if (!config.allowedRoles.includes(userRole)) {
            return false;
        }
    }

    // Check required permission
    if (config.requiredPermission) {
        if (!hasPermission(userRole, config.requiredPermission)) {
            return false;
        }
    }

    return true;
}

/**
 * Server-side page guard
 * Use this at the top of page components to enforce access
 * 
 * @example
 * export default async function AnalyticsPage() {
 *     await guardPage('/analytics');
 *     // ... rest of page
 * }
 */
export async function guardPage(
    pagePath: string,
    options?: { redirectTo?: string }
): Promise<{ user: Awaited<ReturnType<typeof getCurrentUser>>; role: UserRole }> {
    const user = await getCurrentUser();

    // Must be authenticated
    if (!user) {
        redirect('/login?redirect=' + encodeURIComponent(pagePath));
    }

    const userRole = user.role as UserRole;
    const config = PAGE_ACCESS_CONFIG[pagePath];

    // If no config, allow access (default permissive for unconfigured pages)
    if (!config) {
        return { user, role: userRole };
    }

    const hasAccess = checkPageAccess(userRole, config, user.dcaId ?? undefined);

    if (!hasAccess) {
        // Log access denial for audit
        console.warn(`[ACCESS DENIED] User ${user.email} (${userRole}) attempted to access ${pagePath}: ${config.denyReason}`);

        // Determine role-specific redirect for DCA roles
        let redirectTo = options?.redirectTo || config.redirectTo || '/dashboard';

        // Handle DCA_AGENT and DCA_MANAGER role-specific redirects
        if (userRole === 'DCA_MANAGER') {
            if (pagePath === '/overview') redirectTo = '/manager/overview';
            else if (pagePath === '/dashboard') redirectTo = '/manager/dashboard';
            else if (pagePath === '/cases') redirectTo = '/manager/cases';
            else redirectTo = '/manager/dashboard';
        } else if (userRole === 'DCA_AGENT') {
            if (pagePath === '/overview') redirectTo = '/agent/overview';
            else if (pagePath === '/dashboard') redirectTo = '/agent/dashboard';
            else if (pagePath === '/cases') redirectTo = '/agent/cases';
            else redirectTo = '/agent/dashboard';
        } else if (userRole === 'DCA_ADMIN') {
            if (pagePath === '/overview') redirectTo = '/admin/overview';
            else if (pagePath === '/dashboard') redirectTo = '/admin/dashboard';
            else if (pagePath === '/cases') redirectTo = '/admin/cases';
            else redirectTo = '/admin/dashboard';
        }

        redirect(redirectTo + '?error=access_denied');
    }

    return { user, role: userRole };
}

/**
 * Role-based element visibility helper
 * Use in components to conditionally render elements
 */
export function canAccessPage(userRole: UserRole, pagePath: string): boolean {
    const config = PAGE_ACCESS_CONFIG[pagePath];
    if (!config) return true;
    return checkPageAccess(userRole, config);
}

/**
 * DCA role check - for filtering data to own DCA only
 */
export function isDCARole(role: UserRole): boolean {
    return ['DCA_ADMIN', 'DCA_MANAGER', 'DCA_AGENT'].includes(role);
}

/**
 * FedEx internal role check
 */
export function isFedExRole(role: UserRole): boolean {
    return ['SUPER_ADMIN', 'FEDEX_ADMIN', 'FEDEX_MANAGER', 'FEDEX_ANALYST', 'FEDEX_AUDITOR', 'FEDEX_VIEWER'].includes(role);
}

/**
 * Global admin check (no region restrictions)
 */
export function isGlobalAdmin(role: UserRole): boolean {
    return role === 'SUPER_ADMIN';
}
