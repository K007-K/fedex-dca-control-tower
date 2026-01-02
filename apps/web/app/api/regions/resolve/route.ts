/**
 * Region Resolve API
 * 
 * POST /api/regions/resolve - Resolve region from geography data
 * 
 * Used for:
 * 1. Testing auto-assignment rules
 * 2. Pre-validation before case creation
 * 3. Manual region lookup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { regionAssignmentEngine, type GeographyData } from '@/lib/region';

// POST /api/regions/resolve - Resolve region from geography
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();

        const geography: GeographyData = {
            country: body.country || body.country_code,
            state: body.state || body.state_code,
            city: body.city,
            postalCode: body.postal_code || body.postalCode,
        };

        if (!geography.country) {
            return NextResponse.json(
                { error: 'country or country_code is required' },
                { status: 400 }
            );
        }

        // Resolve region
        const region = await regionAssignmentEngine.resolveRegion(geography);

        if (!region) {
            return NextResponse.json({
                resolved: false,
                message: `No matching region found for country: ${geography.country}`,
                geography,
            });
        }

        return NextResponse.json({
            resolved: true,
            region: {
                id: region.id,
                region_code: region.region_code,
                name: region.name,
                default_currency: region.default_currency,
                timezone: region.timezone,
            },
            geography,
        });

    } catch (error) {
        console.error('Region resolve API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
