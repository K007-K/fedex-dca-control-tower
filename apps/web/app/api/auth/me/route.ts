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

        // Fetch user profile from users table
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('id, email, full_name, role, dca_id, organization_id, is_active')
            .eq('id', authUser.id)
            .single();

        if (profileError || !userProfile) {
            // If no profile exists, return basic auth info with default role
            return NextResponse.json({
                user: {
                    id: authUser.id,
                    email: authUser.email,
                    role: authUser.user_metadata?.role || 'READONLY',
                    full_name: authUser.user_metadata?.full_name || authUser.email,
                    dca_id: null,
                    organization_id: null,
                    is_active: true,
                }
            });
        }

        return NextResponse.json({
            user: userProfile
        });

    } catch (error) {
        console.error('Auth me API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
