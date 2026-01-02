import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate an API key from the Authorization header
 * Returns the API key record if valid, null otherwise
 */
export async function validateApiKey(request: NextRequest): Promise<{
    valid: boolean;
    keyId?: string;
    error?: string;
}> {
    try {
        // Get Authorization header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return { valid: false, error: 'Missing Authorization header' };
        }

        // Extract the key (supports both "Bearer <key>" and just "<key>")
        let apiKey = authHeader;
        if (authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.substring(7);
        }

        // Validate key format
        if (!apiKey.startsWith('fedex_prod_')) {
            return { valid: false, error: 'Invalid API key format' };
        }

        // Hash the provided key
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        // Look up in database using admin client (bypasses RLS)
        const supabase = createAdminClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: keyRecord, error } = await (supabase as any)
            .from('api_keys')
            .select('id, is_active, last_used_at')
            .eq('key_hash', keyHash)
            .eq('is_active', true)
            .single();

        if (error || !keyRecord) {
            return { valid: false, error: 'Invalid or revoked API key' };
        }

        // Update last_used_at timestamp
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', keyRecord.id);

        return { valid: true, keyId: keyRecord.id };
    } catch (err) {
        console.error('API key validation error:', err);
        return { valid: false, error: 'Internal validation error' };
    }
}

/**
 * Middleware wrapper for API key protected routes
 * Use this to wrap your route handlers
 */
export function withApiKeyAuth(
    handler: (request: NextRequest, keyId: string) => Promise<NextResponse>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const validation = await validateApiKey(request);

        if (!validation.valid) {
            return NextResponse.json(
                {
                    error: 'Unauthorized',
                    message: validation.error
                },
                { status: 401 }
            );
        }

        return handler(request, validation.keyId!);
    };
}
