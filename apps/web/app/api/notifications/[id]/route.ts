import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { withAuth, type ApiHandler } from '@/lib/auth/api-wrapper';

/**
 * GET /api/notifications/[id] - Get notification details
 * Permission: Authenticated (own notifications only via RLS)
 */
const handleGetNotification: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', id)
            .eq('recipient_id', user.id) // Ensure user can only see their own
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Notification not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Notification fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

/**
 * PATCH /api/notifications/[id] - Update notification (mark as read/dismissed)
 * Permission: Authenticated (own notifications only)
 */
const handleUpdateNotification: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();

        const updates: { is_read?: boolean; read_at?: string; is_dismissed?: boolean } = {};

        if (body.is_read !== undefined) {
            updates.is_read = body.is_read;
            if (body.is_read) {
                updates.read_at = new Date().toISOString();
            }
        }

        if (body.is_dismissed !== undefined) {
            updates.is_dismissed = body.is_dismissed;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('notifications')
            .update(updates)
            .eq('id', id)
            .eq('recipient_id', user.id) // Ensure user can only update their own
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Notification not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Notification update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

/**
 * DELETE /api/notifications/[id] - Delete notification
 * Permission: Authenticated (own notifications only)
 */
const handleDeleteNotification: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('recipient_id', user.id); // Ensure user can only delete their own

        if (error) {
            throw error;
        }

        return NextResponse.json({ message: 'Notification deleted' });

    } catch (error) {
        console.error('Notification delete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

// Protected routes (user-scoped)
export const GET = withAuth(handleGetNotification);
export const PATCH = withAuth(handleUpdateNotification);
export const DELETE = withAuth(handleDeleteNotification);
