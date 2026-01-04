'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { type Permission, type UserRole, ROLE_PERMISSIONS, hasPermission } from '@/lib/auth/rbac';
import { createClient } from '@/lib/supabase/client';

interface PermissionContextType {
    role: UserRole | null;
    permissions: Permission[];
    isLoading: boolean;
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType>({
    role: null,
    permissions: [],
    isLoading: true,
    hasPermission: () => false,
    hasAnyPermission: () => false,
});

export function usePermissions() {
    return useContext(PermissionContext);
}

export function PermissionProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadUserRole() {
            try {
                // Use API endpoint instead of direct Supabase call
                // This avoids RLS issues and uses admin client on backend
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    setRole(null);
                    setIsLoading(false);
                    return;
                }

                const data = await res.json();
                setRole((data.role as UserRole) ?? 'READONLY');
            } catch (error) {
                console.error('Failed to load user role:', error);
                setRole('READONLY');
            } finally {
                setIsLoading(false);
            }
        }

        loadUserRole();
    }, []);

    const permissions = role ? ROLE_PERMISSIONS[role] ?? [] : [];

    const checkPermission = (permission: Permission): boolean => {
        if (!role) return false;
        return hasPermission(role, permission);
    };

    const checkAnyPermission = (perms: Permission[]): boolean => {
        if (!role) return false;
        return perms.some(p => hasPermission(role, p));
    };

    return (
        <PermissionContext.Provider
            value={{
                role,
                permissions,
                isLoading,
                hasPermission: checkPermission,
                hasAnyPermission: checkAnyPermission
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
}

interface PermissionGateProps {
    permission?: Permission;
    permissions?: Permission[];
    requireAll?: boolean;
    fallback?: ReactNode;
    children: ReactNode;
}

/**
 * Conditionally render children based on user permissions
 * 
 * @example
 * <PermissionGate permission="cases:delete">
 *   <DeleteButton />
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate permissions={['cases:update', 'cases:delete']} requireAll={false}>
 *   <EditButton />
 * </PermissionGate>
 */
export function PermissionGate({
    permission,
    permissions,
    requireAll = false,
    fallback = null,
    children
}: PermissionGateProps) {
    const { hasPermission: checkPerm, hasAnyPermission, isLoading } = usePermissions();

    // While loading, don't show anything
    if (isLoading) {
        return null;
    }

    // Single permission check
    if (permission) {
        return checkPerm(permission) ? <>{children}</> : <>{fallback}</>;
    }

    // Multiple permissions check
    if (permissions && permissions.length > 0) {
        if (requireAll) {
            const hasAll = permissions.every(p => checkPerm(p));
            return hasAll ? <>{children}</> : <>{fallback}</>;
        } else {
            return hasAnyPermission(permissions) ? <>{children}</> : <>{fallback}</>;
        }
    }

    // No permission specified, render children
    return <>{children}</>;
}
