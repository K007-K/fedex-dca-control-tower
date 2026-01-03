import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

/**
 * PATCH /api/webhooks/[id] - Update webhook
 * Permission: admin:settings
 */
const handleUpdateWebhook: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

        if (body.name !== undefined) updates.name = body.name;
        if (body.url !== undefined) updates.url = body.url;
        if (body.events !== undefined) updates.events = body.events;
        if (body.is_active !== undefined) updates.is_active = body.is_active;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: webhook, error } = await (supabase as any)
            .from('webhooks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Webhook update error:', error);
            return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
        }

        return NextResponse.json({ data: webhook });
    } catch (error) {
        console.error('Webhooks PATCH error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

/**
 * DELETE /api/webhooks/[id] - Delete webhook
 * Permission: admin:settings
 */
const handleDeleteWebhook: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from('webhooks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Webhook delete error:', error);
            return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhooks DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

// Protected routes
export const PATCH = withPermission('admin:settings', handleUpdateWebhook);
export const DELETE = withPermission('admin:settings', handleDeleteWebhook);
