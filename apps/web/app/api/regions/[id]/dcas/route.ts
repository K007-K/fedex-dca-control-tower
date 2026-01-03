/**
 * Region DCA Assignment API
 * 
 * GET /api/regions/[id]/dcas - Get DCAs assigned to region
 * POST /api/regions/[id]/dcas - Assign DCA to region
 * DELETE /api/regions/[id]/dcas - Remove DCA from region
 * 
 * Permissions:
 * - GET: regions:read
 * - POST: regions:assign-dcas
 * - DELETE: regions:assign-dcas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { regionRBAC } from '@/lib/region';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

/**
 * GET /api/regions/[id]/dcas - Get DCAs assigned to region
 * Permission: regions:read
 */
const handleGetRegionDCAs: ApiHandler = async (request, { params, user }) => {
    try {
        const { id: regionId } = await params;
        const supabase = await createClient();

        // Check region access
        const accessCheck = await regionRBAC.hasRegionAccess(user.id, regionId);

        if (!accessCheck.allowed) {
            return NextResponse.json(
                { error: 'Access denied: ' + accessCheck.reason },
                { status: 403 }
            );
        }

        // Get DCA assignments with DCA details
        const { data: assignments, error } = await supabase
            .from('region_dca_assignments')
            .select(`
                *,
                dca:dcas(
                    id, name, status, performance_score, 
                    recovery_rate, sla_compliance_rate,
                    capacity_limit, capacity_used
                )
            `)
            .eq('region_id', regionId)
            .eq('is_active', true)
            .order('allocation_priority', { ascending: true });

        if (error) {
            console.error('Failed to fetch DCA assignments:', error);
            return NextResponse.json({ error: 'Failed to fetch DCAs' }, { status: 500 });
        }

        return NextResponse.json({ data: assignments });

    } catch (error) {
        console.error('Region DCAs API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

/**
 * POST /api/regions/[id]/dcas - Assign DCA to region
 * Permission: regions:assign-dcas
 */
const handleAssignDCAToRegion: ApiHandler = async (request, { params, user }) => {
    try {
        const { id: regionId } = await params;
        const supabase = await createClient();

        // Parse request body
        const body = await request.json();
        const { dca_id, is_primary, allocation_priority, capacity_allocation_pct } = body;

        if (!dca_id) {
            return NextResponse.json(
                { error: 'dca_id is required' },
                { status: 400 }
            );
        }

        // Verify DCA exists and is active
        const { data: dca } = await supabase
            .from('dcas')
            .select('id, name, status')
            .eq('id', dca_id)
            .single();

        if (!dca) {
            return NextResponse.json({ error: 'DCA not found' }, { status: 404 });
        }

        if (dca.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Cannot assign inactive DCA to region' },
                { status: 400 }
            );
        }

        // If setting as primary, unset other primaries
        if (is_primary) {
            await supabase
                .from('region_dca_assignments')
                .update({ is_primary: false })
                .eq('region_id', regionId)
                .eq('is_primary', true);
        }

        // Create or update assignment
        const { data: assignment, error } = await supabase
            .from('region_dca_assignments')
            .upsert({
                region_id: regionId,
                dca_id: dca_id,
                is_primary: is_primary || false,
                allocation_priority: allocation_priority || 1,
                capacity_allocation_pct: capacity_allocation_pct || 100,
                is_active: true,
                suspended_at: null,
                created_by: user.id,
            }, {
                onConflict: 'region_id,dca_id',
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to assign DCA:', error);
            return NextResponse.json({ error: 'Failed to assign DCA' }, { status: 500 });
        }

        // Log to audit
        await supabase.from('region_audit_log').insert({
            entity_type: 'DCA_ASSIGNMENT',
            entity_id: assignment.id,
            action: 'CREATE',
            performed_by: user.id,
            performed_by_role: user.role,
            new_values: assignment,
        });

        return NextResponse.json({ data: assignment }, { status: 201 });

    } catch (error) {
        console.error('Region DCAs API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

/**
 * DELETE /api/regions/[id]/dcas - Remove DCA from region
 * Permission: regions:assign-dcas
 */
const handleRemoveDCAFromRegion: ApiHandler = async (request, { params, user }) => {
    try {
        const { id: regionId } = await params;
        const { searchParams } = new URL(request.url);
        const dcaId = searchParams.get('dca_id');

        if (!dcaId) {
            return NextResponse.json(
                { error: 'dca_id query parameter is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check if DCA has active cases in this region
        const { count: activeCases } = await supabase
            .from('cases')
            .select('id', { count: 'exact', head: true })
            .eq('region_id', regionId)
            .eq('assigned_dca_id', dcaId)
            .not('status', 'in', '("CLOSED","WRITTEN_OFF")');

        if (activeCases && activeCases > 0) {
            return NextResponse.json(
                { error: `Cannot remove DCA with ${activeCases} active cases in this region` },
                { status: 400 }
            );
        }

        // Deactivate assignment (soft delete)
        const { error } = await supabase
            .from('region_dca_assignments')
            .update({
                is_active: false,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('region_id', regionId)
            .eq('dca_id', dcaId);

        if (error) {
            console.error('Failed to remove DCA:', error);
            return NextResponse.json({ error: 'Failed to remove DCA' }, { status: 500 });
        }

        // Log to audit
        await supabase.from('region_audit_log').insert({
            entity_type: 'DCA_ASSIGNMENT',
            entity_id: dcaId,
            action: 'DELETE',
            performed_by: user.id,
            performed_by_role: user.role,
            change_reason: 'DCA removed from region',
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Region DCAs API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
};

// Protected routes
export const GET = withPermission('regions:read', handleGetRegionDCAs);
export const POST = withPermission('regions:assign-dcas', handleAssignDCAToRegion);
export const DELETE = withPermission('regions:assign-dcas', handleRemoveDCAFromRegion);
