import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/notifications - Get notifications for current user
 */
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const recipientId = searchParams.get('recipient_id');
        const isRead = searchParams.get('is_read');
        const notificationType = searchParams.get('type');
        const priority = searchParams.get('priority');
        const limit = parseInt(searchParams.get('limit') ?? '50');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (recipientId) {
            query = query.eq('recipient_id', recipientId);
        }

        if (isRead !== null) {
            query = query.eq('is_read', isRead === 'true');
        }

        if (notificationType) {
            query = query.eq('notification_type', notificationType);
        }

        if (priority) {
            query = query.eq('priority', priority);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Notifications fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch notifications', details: error.message },
                { status: 500 }
            );
        }

        // Get unread count
        let unreadCount = 0;
        if (recipientId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { count: unread } = await (supabase as any)
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', recipientId)
                .eq('is_read', false);
            unreadCount = unread ?? 0;
        }

        return NextResponse.json({
            data,
            meta: {
                total: count ?? data?.length ?? 0,
                unread: unreadCount,
            },
        });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/notifications - Create a notification
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['recipient_id', 'notification_type', 'title', 'message'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('notifications')
            .insert({
                recipient_id: body.recipient_id,
                notification_type: body.notification_type,
                title: body.title,
                message: body.message,
                action_url: body.action_url ?? null,
                related_case_id: body.related_case_id ?? null,
                related_escalation_id: body.related_escalation_id ?? null,
                related_dca_id: body.related_dca_id ?? null,
                channels: body.channels ?? ['IN_APP'],
                priority: body.priority ?? 'NORMAL',
                expires_at: body.expires_at ?? null,
            })
            .select()
            .single();

        if (error) {
            console.error('Notification creation error:', error);
            return NextResponse.json(
                { error: 'Failed to create notification', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ data }, { status: 201 });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/notifications - Bulk mark as read
 */
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { notification_ids, mark_all_read, recipient_id } = body;

        if (mark_all_read && recipient_id) {
            // Mark all notifications as read for a user
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('recipient_id', recipient_id)
                .eq('is_read', false);

            if (error) throw error;

            return NextResponse.json({ message: 'All notifications marked as read' });
        }

        if (notification_ids && Array.isArray(notification_ids)) {
            // Mark specific notifications as read
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from('notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .in('id', notification_ids);

            if (error) throw error;

            return NextResponse.json({
                message: `${notification_ids.length} notifications marked as read`
            });
        }

        return NextResponse.json(
            { error: 'Provide notification_ids or mark_all_read with recipient_id' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Notifications update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
