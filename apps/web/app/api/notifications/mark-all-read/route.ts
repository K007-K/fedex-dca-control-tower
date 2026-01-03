import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { createClient as createAdminSupabase } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { withAuth, type ApiHandler } from '@/lib/auth/api-wrapper';

function getAdminClient() {
    return createAdminSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * POST /api/notifications/mark-all-read - Mark all notifications as read
 * Permission: Authenticated (own notifications only)
 */
const handleMarkAllRead: ApiHandler = async (request, { user }) => {
    try {
        const adminClient = getAdminClient();
        const userId = user.id;

        // Update notifications using admin client to bypass RLS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (adminClient as any)
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('recipient_id', userId)
            .eq('is_read', false)
            .select('id');

        if (error) {
            console.error('Mark all read error:', error);
            throw error;
        }

        return NextResponse.json({
            message: 'All notifications marked as read',
            count: data?.length || 0,
        });

    } catch (error) {
        console.error('Mark all read error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

// Protected: requires authentication
export const POST = withAuth(handleMarkAllRead);
