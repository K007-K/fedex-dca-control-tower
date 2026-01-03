import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me - Get current authenticated user's profile
 * Returns user role, DCA info, and basic profile for client-side permission checks
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Get the authenticated user from Supabase Auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Fetch user profile from users table using auth_user_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let { data: userProfile } = await (supabase as any)
            .from('users')
            .select('id, email, full_name, role, dca_id, organization_id, is_active, primary_region_id')
            .eq('auth_user_id', authUser.id)
            .single();

        // Fallback: try by email if auth_user_id didn't match
        if (!userProfile && authUser.email) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profileByEmail } = await (supabase as any)
                .from('users')
                .select('id, email, full_name, role, dca_id, organization_id, is_active, primary_region_id')
                .eq('email', authUser.email)
                .single();
            userProfile = profileByEmail;

            // If found by email, update the auth_user_id for future queries
            if (userProfile && !userProfile.auth_user_id) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any)
                    .from('users')
                    .update({ auth_user_id: authUser.id })
                    .eq('id', userProfile.id);
            }
        }

        // Get role from: profile > auth metadata > default
        const role = userProfile?.role || authUser.user_metadata?.role || 'FEDEX_VIEWER';

        if (!userProfile) {
            // If no profile exists, return basic auth info
            return NextResponse.json({
                user: {
                    id: authUser.id,
                    email: authUser.email,
                    role: role,
                    full_name: authUser.user_metadata?.full_name || authUser.email,
                    dca_id: null,
                    organization_id: null,
                    is_active: true,
                },
                role: role,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.email,
                dca_id: null,
                organization_id: null,
            });
        }

        return NextResponse.json({
            user: { ...userProfile, role }, // Ensure role is correct
            role: role,
            email: userProfile.email,
            full_name: userProfile.full_name,
            dca_id: userProfile.dca_id,
            organization_id: userProfile.organization_id,
        });

    } catch (error) {
        console.error('Auth me API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
