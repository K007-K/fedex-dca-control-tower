import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { withAuth, type ApiHandler } from '@/lib/auth/api-wrapper';

/**
 * GET /api/notifications - Get notifications for current user
 * Permission: Authenticated user (own notifications only)
 */
const handleGetNotifications: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();
        const userId = user.id;

        // Get limit from query params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // Fetch notifications for this user (user.id from auth context)
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

        return NextResponse.json({ data: data || [], userId });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

// Protected: requires authentication (user sees their own notifications)
export const GET = withAuth(handleGetNotifications);
