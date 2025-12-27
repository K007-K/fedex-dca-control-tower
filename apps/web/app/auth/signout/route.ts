import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /auth/signout
 * Sign out the current user
 */
export async function POST(request: Request) {
    const supabase = await createClient();

    await supabase.auth.signOut();

    // Get the origin from the request
    const requestUrl = new URL(request.url);

    return NextResponse.redirect(new URL('/login', requestUrl.origin), {
        status: 302,
    });
}
