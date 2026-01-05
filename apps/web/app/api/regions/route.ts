/**
 * Regions API - List and Create
 * 
 * GET /api/regions - List all regions (respects RBAC)
 * POST /api/regions - Create new region (Global Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { regionRBAC } from '@/lib/region';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

/**
 * GET /api/regions - List all regions
 * Permission: regions:read
 */
const handleGetRegions: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();

        // Check if user is global admin - they see all regions
        const isGlobal = regionRBAC.isGlobalRole(user.role);

        if (isGlobal) {
            // Global admin - return all regions
            const { data: regions, error } = await supabase
                .from('regions')
                .select(`
                    id,
                    region_code,
                    name,
                    description,
                    status,
                    country_codes,
                    timezone,
                    default_currency,
                    dca_count:region_dca_assignments(count)
                `)
                .eq('status', 'ACTIVE')
                .is('deleted_at', null)
                .order('name');

            if (error) {
                console.error('Failed to fetch regions:', error);
                return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
            }

            return NextResponse.json({ data: regions });
        }

        // Non-global - return only accessible regions
        const accessibleRegions = await regionRBAC.getUserAccessibleRegions(user.id);

        if (accessibleRegions.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const regionIds = accessibleRegions.map(r => r.region_id);

        const { data: regions, error } = await supabase
            .from('regions')
            .select(`
                *,
                dca_count:region_dca_assignments(count)
            `)
            .in('id', regionIds)
            .eq('status', 'ACTIVE')
            .order('name');

        if (error) {
            console.error('Failed to fetch regions:', error);
            return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
        }

        // Add access level to each region
        const regionsWithAccess = regions?.map(r => ({
            ...r,
            access_level: accessibleRegions.find(ar => ar.region_id === r.id)?.access_level,
            is_primary: accessibleRegions.find(ar => ar.region_id === r.id)?.is_primary,
        }));

        return NextResponse.json({ data: regionsWithAccess });

    } catch (error) {
        console.error('Regions API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

/**
 * POST /api/regions - Create new region (Global Admin only)
 * Permission: regions:create
 */
const handleCreateRegion: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();

        // Parse request body
        const body = await request.json();

        // Validate required fields
        const { region_code, name, country_codes, default_currency, timezone } = body;

        if (!region_code || !name || !country_codes || !default_currency || !timezone) {
            return NextResponse.json(
                { error: 'Missing required fields: region_code, name, country_codes, default_currency, timezone' },
                { status: 400 }
            );
        }

        // Create region
        const { data: newRegion, error } = await supabase
            .from('regions')
            .insert({
                region_code,
                name,
                description: body.description,
                country_codes,
                state_codes: body.state_codes,
                default_currency,
                timezone,
                business_hours: body.business_hours || { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
                status: 'ACTIVE',
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create region:', error);
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: 'Region with this code already exists' },
                    { status: 409 }
                );
            }
            return NextResponse.json({ error: 'Failed to create region' }, { status: 500 });
        }

        // Log to audit
        await supabase.from('region_audit_log').insert({
            entity_type: 'REGION',
            entity_id: newRegion.id,
            action: 'CREATE',
            performed_by: user.id,
            performed_by_role: user.role,
            new_values: newRegion,
        });

        return NextResponse.json({ data: newRegion }, { status: 201 });

    } catch (error) {
        console.error('Regions API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

// Protected routes
export const GET = withPermission('regions:read', handleGetRegions);
export const POST = withPermission('regions:create', handleCreateRegion);
