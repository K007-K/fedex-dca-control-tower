import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser, type AuthUser, type Permission, hasPermission } from '@/lib/auth';

export type ApiHandler = (
    request: NextRequest,
    context: { params: Promise<Record<string, string>>; user: AuthUser }
) => Promise<NextResponse>;

/**
 * Wrap API route handler with permission check
 * 
 * @example
 * export const DELETE = withPermission('cases:delete', async (request, { params, user }) => {
 *   // user is guaranteed to have cases:delete permission
 *   const { id } = await params;
 *   // ... handle delete
 * });
 */
export function withPermission(permission: Permission, handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            if (!hasPermission(user.role, permission)) {
                return NextResponse.json(
                    {
                        error: {
                            code: 'FORBIDDEN',
                            message: `You don't have permission to perform this action`,
                            required: permission,
                            userRole: user.role
                        }
                    },
                    { status: 403 }
                );
            }

            return handler(request, { ...context, user });
        } catch (error) {
            console.error('API auth error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}

/**
 * Wrap API route with any of multiple permissions (OR logic)
 */
export function withAnyPermission(permissions: Permission[], handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            const hasAny = permissions.some(p => hasPermission(user.role, p));
            if (!hasAny) {
                return NextResponse.json(
                    {
                        error: {
                            code: 'FORBIDDEN',
                            message: `You don't have permission to perform this action`,
                            required: permissions,
                            userRole: user.role
                        }
                    },
                    { status: 403 }
                );
            }

            return handler(request, { ...context, user });
        } catch (error) {
            console.error('API auth error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}

/**
 * Simple auth check (no specific permission, just authenticated)
 */
export function withAuth(handler: ApiHandler) {
    return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            const user = await getCurrentUser();

            if (!user) {
                return NextResponse.json(
                    { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
                    { status: 401 }
                );
            }

            return handler(request, { ...context, user });
        } catch (error) {
            console.error('API auth error:', error);
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
                { status: 500 }
            );
        }
    };
}
