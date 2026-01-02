import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

/**
 * Generate a secure API key
 */
function generateApiKey(): { key: string; hash: string; prefix: string } {
    const key = `fedex_prod_${crypto.randomBytes(24).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 17) + '...'; // 17 + 3 = 20 chars max
    return { key, hash, prefix };
}

/**
 * GET /api/settings/api-keys - Get current API key info (masked)
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the active API key for display (only prefix)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: apiKey } = await (supabase as any)
            .from('api_keys')
            .select('id, name, key_prefix, last_used_at, created_at, is_active')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return NextResponse.json({
            data: apiKey || null,
            hasKey: !!apiKey,
        });
    } catch (error) {
        console.error('API Keys GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/settings/api-keys - Generate new API key (regenerate)
 */
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's database ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dbUser } = await (supabase as any)
            .from('users')
            .select('id, organization_id')
            .eq('email', user.email)
            .single();

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Revoke all existing active keys
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('api_keys')
            .update({ is_active: false, revoked_at: new Date().toISOString() })
            .eq('is_active', true);

        // Generate new key
        const { key, hash, prefix } = generateApiKey();

        // Insert new key (organization_id can be null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const insertData: Record<string, unknown> = {
            name: 'Production API Key',
            key_hash: hash,
            key_prefix: prefix,
            is_active: true,
        };

        // Only add organization_id if it exists
        if (dbUser.organization_id) {
            insertData.organization_id = dbUser.organization_id;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newKey, error } = await (supabase as any)
            .from('api_keys')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('API Key creation error:', JSON.stringify(error));
            return NextResponse.json({ error: 'Failed to create API key', debug: error }, { status: 500 });
        }

        // Return the full key ONLY on creation (never again)
        return NextResponse.json({
            data: {
                id: newKey.id,
                name: newKey.name,
                key: key, // Full key returned only on creation
                key_prefix: prefix,
                created_at: newKey.created_at,
            },
            message: 'API key generated successfully. Save this key - it will not be shown again.',
        });
    } catch (error) {
        console.error('API Keys POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
