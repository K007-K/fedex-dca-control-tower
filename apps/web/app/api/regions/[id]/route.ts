/**
 * Single Region API
 * 
 * GET /api/regions/[id] - Get region details
 * PUT /api/regions/[id] - Update region (Global Admin only)
 * DELETE /api/regions/[id] - Deactivate region (Global Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { regionRBAC } from '@/lib/region';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/regions/[id] - Get region details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user details
        const { data: userData } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', user.email)
            .single();

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check region access
        const accessCheck = await regionRBAC.hasRegionAccess(userData.id, id);

        if (!accessCheck.allowed) {
            return NextResponse.json(
                { error: 'Access denied: ' + accessCheck.reason },
                { status: 403 }
            );
        }

        // Get region with related data
        const { data: region, error } = await supabase
            .from('regions')
            .select(`
                *,
                escalation_matrix:escalation_matrices(*),
                dca_assignments:region_dca_assignments(
                    *,
                    dca:dcas(id, name, status, performance_score)
                ),
                geography_rules:geography_region_rules(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Failed to fetch region:', error);
            return NextResponse.json({ error: 'Region not found' }, { status: 404 });
        }

        return NextResponse.json({
            data: region,
            access_level: accessCheck.access_level
        });

    } catch (error) {
        console.error('Region API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/regions/[id] - Update region
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user details
        const { data: userData } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', user.email)
            .single();

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Only global admins can update regions
        if (!regionRBAC.isGlobalRole(userData.role)) {
            return NextResponse.json(
                { error: 'Only Global Admins can update regions' },
                { status: 403 }
            );
        }

        // Get current region state (for audit)
        const { data: oldRegion } = await supabase
            .from('regions')
            .select('*')
            .eq('id', id)
            .single();

        if (!oldRegion) {
            return NextResponse.json({ error: 'Region not found' }, { status: 404 });
        }

        // Parse request body
        const body = await request.json();

        // Update region
        const { data: updatedRegion, error } = await supabase
            .from('regions')
            .update({
                name: body.name,
                description: body.description,
                country_codes: body.country_codes,
                state_codes: body.state_codes,
                default_currency: body.default_currency,
                timezone: body.timezone,
                business_hours: body.business_hours,
                status: body.status,
                default_sla_template_id: body.default_sla_template_id,
                escalation_matrix_id: body.escalation_matrix_id,
                updated_by: userData.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Failed to update region:', error);
            return NextResponse.json({ error: 'Failed to update region' }, { status: 500 });
        }

        // Log to audit
        await supabase.from('region_audit_log').insert({
            entity_type: 'REGION',
            entity_id: id,
            action: 'UPDATE',
            performed_by: userData.id,
            performed_by_role: userData.role,
            old_values: oldRegion,
            new_values: updatedRegion,
            change_reason: body.change_reason,
        });

        return NextResponse.json({ data: updatedRegion });

    } catch (error) {
        console.error('Region API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/regions/[id] - Deactivate region (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user details
        const { data: userData } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', user.email)
            .single();

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Only global admins can delete regions
        if (!regionRBAC.isGlobalRole(userData.role)) {
            return NextResponse.json(
                { error: 'Only Global Admins can delete regions' },
                { status: 403 }
            );
        }

        // Check if region has active cases
        const { count: activeCases } = await supabase
            .from('cases')
            .select('id', { count: 'exact', head: true })
            .eq('region_id', id)
            .not('status', 'in', '("CLOSED","WRITTEN_OFF")');

        if (activeCases && activeCases > 0) {
            return NextResponse.json(
                { error: `Cannot delete region with ${activeCases} active cases. Reassign cases first.` },
                { status: 400 }
            );
        }

        // Soft delete region
        const { error } = await supabase
            .from('regions')
            .update({
                status: 'INACTIVE',
                deleted_at: new Date().toISOString(),
                deleted_by: userData.id,
            })
            .eq('id', id);

        if (error) {
            console.error('Failed to delete region:', error);
            return NextResponse.json({ error: 'Failed to delete region' }, { status: 500 });
        }

        // Log to audit
        await supabase.from('region_audit_log').insert({
            entity_type: 'REGION',
            entity_id: id,
            action: 'DELETE',
            performed_by: userData.id,
            performed_by_role: userData.role,
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error('Region API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
