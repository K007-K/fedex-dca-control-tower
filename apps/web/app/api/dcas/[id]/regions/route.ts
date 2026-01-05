import { NextResponse } from 'next/server';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dcas/[id]/regions - Get regions where this DCA operates
 * Returns active region_dca_assignments for the given DCA
 */
const handleGetDcaRegions: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const dcaId = pathParts[pathParts.length - 2]; // /api/dcas/[id]/regions -> id is second to last

        if (!dcaId) {
            return NextResponse.json({ error: 'DCA ID is required' }, { status: 400 });
        }

        // Fetch active region assignments for this DCA
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('region_dca_assignments')
            .select(`
                region_id,
                capacity,
                priority,
                is_active,
                regions:region_id (
                    id,
                    name,
                    region_code,
                    status
                )
            `)
            .eq('dca_id', dcaId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching DCA regions:', error);
            return NextResponse.json(
                { error: 'Failed to fetch DCA regions' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            dca_id: dcaId,
            regions: data || [],
        });
    } catch (error) {
        console.error('DCA regions API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

export const GET = withPermission('dcas:read', handleGetDcaRegions);
