import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth/api-key-auth';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/v1/cases - Get cases via API key authentication
 * 
 * Headers:
 *   Authorization: Bearer fedex_prod_xxxxx
 * 
 * Query params:
 *   limit: number (default: 50, max: 100)
 *   offset: number (default: 0)
 *   status: filter by status (open, in_progress, resolved, escalated)
 */
export async function GET(request: NextRequest) {
    // Validate API key
    const validation = await validateApiKey(request);

    if (!validation.valid) {
        return NextResponse.json(
            {
                error: 'Unauthorized',
                message: validation.error,
                hint: 'Include header: Authorization: Bearer <your_api_key>'
            },
            { status: 401 }
        );
    }

    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Parse query params
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');
        const status = searchParams.get('status');

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('cases')
            .select('id, case_number, title, status, priority, category, created_at, updated_at, customer_name, customer_email', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply status filter if provided
        if (status) {
            query = query.eq('status', status);
        }

        const { data: cases, error, count } = await query;

        if (error) {
            console.error('API v1 cases error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch cases' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: cases,
            pagination: {
                total: count,
                limit,
                offset,
                hasMore: offset + limit < (count || 0),
            },
            _links: {
                self: `/api/v1/cases?limit=${limit}&offset=${offset}`,
                next: offset + limit < (count || 0)
                    ? `/api/v1/cases?limit=${limit}&offset=${offset + limit}`
                    : null,
            }
        });
    } catch (err) {
        console.error('API v1 cases error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
