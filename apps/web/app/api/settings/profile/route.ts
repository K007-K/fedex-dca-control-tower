import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user profile
export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile from users table
    const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    if (error) {
        // If no profile exists, return user email info
        return NextResponse.json({
            email: user.email,
            display_name: user.user_metadata?.display_name || '',
            role: 'ADMIN', // Default role
        });
    }

    return NextResponse.json(profile);
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, phone, timezone } = body;

    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name, phone, timezone },
    });

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Also update users table if it exists
    await supabase
        .from('users')
        .update({ full_name: display_name, updated_at: new Date().toISOString() })
        .eq('auth_user_id', user.id);

    return NextResponse.json({ success: true, message: 'Profile updated' });
}
