import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Manager Notifications API
 * 
 * SCOPE: Notifications for manager only (DCA-scoped by recipient_id)
 * ACCESS: DCA_MANAGER role only
 */

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_MANAGER') {
        return NextResponse.json({ error: 'Forbidden - DCA_MANAGER only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const supabase = createAdminClient();

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('notifications')
            .select('*')
            .eq('recipient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (unreadOnly) {
            query = query.eq('read_at', null);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('Notifications fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get unread count
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: unreadCount } = await (supabase as any)
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .is('read_at', null);

        return NextResponse.json({
            notifications: notifications || [],
            unreadCount: unreadCount || 0,
        });

    } catch (error) {
        console.error('Manager notifications API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Mark notifications as read
export async function PUT(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_MANAGER') {
        return NextResponse.json({ error: 'Forbidden - DCA_MANAGER only' }, { status: 403 });
    }

    const body = await request.json();
    const { notification_ids, mark_all } = body;

    const supabase = createAdminClient();

    try {
        if (mark_all) {
            // Mark all as read
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('recipient_id', user.id)
                .is('read_at', null);
        } else if (notification_ids?.length > 0) {
            // Mark specific notifications as read
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('recipient_id', user.id)
                .in('id', notification_ids);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Manager notifications update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
