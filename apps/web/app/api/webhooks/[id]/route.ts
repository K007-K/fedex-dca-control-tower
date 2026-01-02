import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/webhooks/[id] - Update webhook
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
}

/**
 * DELETE /api/webhooks/[id] - Delete webhook
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
}
