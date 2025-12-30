import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications - Get notifications for current user
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get database user ID by email
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
            .from('users')
            .select('id')
            .eq('email', authUser.email)
            .single();

        const userId = profile?.id || authUser.id;

        // Get limit from query params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // Fetch notifications for this user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('notifications')
            .select('*')
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Fetch notifications error:', error);
            throw error;
        }

        return NextResponse.json({ data: data || [] });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
