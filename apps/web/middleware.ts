import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware for Supabase Auth
 * Handles session refresh and route protection
 * 
 * NOTE: If Supabase credentials are not configured, the middleware
 * allows all requests to pass through (development mode without auth)
 */
export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If Supabase is not configured, allow all requests (dev mode)
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('[Middleware] Supabase not configured - auth disabled');
        return response;
    }

    const path = request.nextUrl.pathname;

    // Auth callback routes - ALWAYS allow through without auth check
    // These routes handle OAuth redirects and must be public
    const authCallbackRoutes = ['/auth/callback', '/auth/signout'];
    if (authCallbackRoutes.some(route => path.startsWith(route))) {
        return response;
    }

    // Create Supabase client with cookie handling
    let modifiedResponse = response;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                request.cookies.set({
                    name,
                    value,
                    ...options,
                });
                modifiedResponse = NextResponse.next({
                    request: {
                        headers: request.headers,
                    },
                });
                modifiedResponse.cookies.set({
                    name,
                    value,
                    ...options,
                });
            },
            remove(name: string, options: CookieOptions) {
                request.cookies.set({
                    name,
                    value: '',
                    ...options,
                });
                modifiedResponse = NextResponse.next({
                    request: {
                        headers: request.headers,
                    },
                });
                modifiedResponse.cookies.set({
                    name,
                    value: '',
                    ...options,
                });
            },
        },
    });

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // P1-11 FIX: Audit and secure all public routes
    // Public routes that don't require authentication
    const publicRoutes = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',  // Added for password reset flow
        '/mfa-verify',      // MFA verification page (user is partially authenticated)
    ];
    const isPublicRoute = publicRoutes.includes(path);

    // Auth routes - redirect to dashboard if already logged in
    const authRoutes = ['/login', '/register', '/forgot-password'];
    const isAuthRoute = authRoutes.includes(path);

    // If user is logged in and trying to access auth routes, redirect to dashboard
    if (user && isAuthRoute) {
        // P1-9 FIX: Check if user needs MFA verification
        // Check for MFA requirement for admin roles
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const adminRoles = ['SUPER_ADMIN', 'FEDEX_ADMIN', 'AUDITOR'];

        if (userData && adminRoles.includes(userData.role)) {
            // Check if MFA is verified for this session
            const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

            if (mfaData?.currentLevel === 'aal1' && mfaData?.nextLevel === 'aal2') {
                // User needs to verify MFA
                return NextResponse.redirect(new URL('/mfa-verify?redirect=/overview', request.url));
            }
        }

        return NextResponse.redirect(new URL('/overview', request.url));
    }

    // If user is not logged in and trying to access protected routes
    if (!user && !isPublicRoute) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', path);
        return NextResponse.redirect(redirectUrl);
    }

    return modifiedResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (handled separately)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
    ],
};
