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

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/register', '/forgot-password'];
    const isPublicRoute = publicRoutes.includes(path);

    // Auth routes - redirect to dashboard if already logged in
    const authRoutes = ['/login', '/register', '/forgot-password'];
    const isAuthRoute = authRoutes.includes(path);

    // If user is logged in and trying to access auth routes, redirect to dashboard
    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
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
