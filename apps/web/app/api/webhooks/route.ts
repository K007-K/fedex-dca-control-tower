import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/webhooks - List all webhooks
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: webhooks, error } = await (supabase as any)
            .from('webhooks')
            .select('id, name, url, events, is_active, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Webhooks fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
        }

        return NextResponse.json({ data: webhooks || [] });
    } catch (error) {
        console.error('Webhooks GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/webhooks - Create new webhook
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, url, events } = body;

        if (!name || !url) {
            return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // Get user's database info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dbUser } = await (supabase as any)
            .from('users')
            .select('id, organization_id')
            .eq('email', user.email)
            .single();

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Generate webhook secret for HMAC verification
        const crypto = await import('crypto');
        const secret = crypto.randomBytes(32).toString('hex');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: webhook, error } = await (supabase as any)
            .from('webhooks')
            .insert({
                organization_id: dbUser.organization_id,
                name,
                url,
                events: events || ['case.updated'],
                secret,
                created_by: dbUser.id,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Webhook creation error:', error);
            return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
        }

        return NextResponse.json({
            data: webhook,
            message: 'Webhook created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Webhooks POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
