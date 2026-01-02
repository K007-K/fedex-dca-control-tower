import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth/api-key-auth';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/v1/cases/[id] - Get a single case by ID via API key authentication
 * 
 * Headers:
 *   Authorization: Bearer fedex_prod_xxxxx
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params;
        const supabase = await createClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: caseData, error } = await (supabase as any)
            .from('cases')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !caseData) {
            return NextResponse.json(
                { error: 'Case not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: caseData,
        });
    } catch (err) {
        console.error('API v1 case detail error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
