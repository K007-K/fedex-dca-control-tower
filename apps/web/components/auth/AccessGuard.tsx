'use client';

/**
 * Client-Side Access Guard Component
 * 
 * Use this component to wrap client-side pages that require access control.
 * Redirects unauthorized users to dashboard with error message.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/auth/rbac';

interface AccessGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    fallbackUrl?: string;
    loadingComponent?: React.ReactNode;
}

export function AccessGuard({
    children,
    allowedRoles,
    fallbackUrl = '/dashboard?error=access_denied',
    loadingComponent,
}: AccessGuardProps) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAccess() {
            try {
                // Fetch current user's role
                const res = await fetch('/api/settings/profile');
                if (!res.ok) {
                    // Not logged in or error
                    router.replace('/login');
                    return;
                }

                const data = await res.json();
                const userRole = data.role as UserRole;

                if (allowedRoles.includes(userRole)) {
                    setIsAuthorized(true);
                } else {
                    console.warn(`[ACCESS DENIED] Role ${userRole} not in allowed roles: ${allowedRoles.join(', ')}`);
                    router.replace(fallbackUrl);
                }
            } catch (error) {
                console.error('Access check failed:', error);
                router.replace('/login');
            } finally {
                setIsLoading(false);
            }
        }

        checkAccess();
    }, [allowedRoles, fallbackUrl, router]);

    if (isLoading) {
        return loadingComponent || (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Checking access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Will be redirected
    }

    return <>{children}</>;
}

/**
 * Higher-order component version for easier wrapping
 */
export function withAccessGuard<P extends object>(
    Component: React.ComponentType<P>,
    allowedRoles: UserRole[],
    fallbackUrl?: string
) {
    return function GuardedComponent(props: P) {
        return (
            <AccessGuard allowedRoles={allowedRoles} fallbackUrl={fallbackUrl}>
                <Component {...props} />
            </AccessGuard>
        );
    };
}
