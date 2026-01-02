import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic';
/**
 * GET /auth/callback
 * Handle OAuth callback from Supabase Auth providers (Google, etc.)
 */
export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';
    const errorDescription = requestUrl.searchParams.get('error_description');

    // Handle OAuth errors
    if (errorDescription) {
        console.error('OAuth error:', errorDescription);
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(errorDescription)}`, requestUrl.origin)
        );
    }

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Session exchange error:', error.message);
            return NextResponse.redirect(
                new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
            );
        }

        // Successfully authenticated - redirect to dashboard
        return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    // No code provided - redirect to login
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
