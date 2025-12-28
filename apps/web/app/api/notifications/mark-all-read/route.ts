import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/notifications/mark-all-read - Mark all notifications as read
 */
export async function POST() {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Batch update all unread notifications for this user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .eq('is_read', false)
            .select('id');

        if (error) {
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
}
