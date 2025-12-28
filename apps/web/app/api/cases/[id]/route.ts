/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/cases/[id]
 * Get case details by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const result = await (supabase as any)
            .from('cases')
            .select(`
        *,
        assigned_dca:dcas(id, name, status, performance_score, recovery_rate),
        assigned_agent:users!cases_assigned_agent_id_fkey(id, full_name, email, role)
      `)
            .eq('id', id)
            .single();

        if (result.error) {
            if (result.error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'Case not found' } },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: result.error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: result.data });
    } catch (error) {
        console.error('Case API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch case' } },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/cases/[id]
 * Update case details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        // Use admin client to bypass RLS for updates
        const supabase = createAdminClient();
        const body = await request.json();

        const updateData: Record<string, any> = {};
        const allowedFields = [
            'status', 'priority', 'assigned_dca_id', 'assigned_agent_id',
            'outstanding_amount', 'recovered_amount', 'internal_notes', 'tags',
            'is_disputed', 'dispute_reason', 'high_priority_flag', 'vip_customer'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // Map 'notes' from form to 'internal_notes' in database
        if (body.notes !== undefined) {
            updateData['internal_notes'] = body.notes;
        }

        if (body.assigned_dca_id !== undefined && updateData['assigned_dca_id']) {
            updateData['assigned_at'] = new Date().toISOString();
            updateData['assignment_method'] = body.assignment_method ?? 'MANUAL';
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: 'No valid fields to update' } },
                { status: 400 }
            );
        }

        updateData['updated_at'] = new Date().toISOString();

        const result = await (supabase as any)
            .from('cases')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (result.error) {
            if (result.error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'Case not found' } },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: result.error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: result.data });
    } catch (error) {
        console.error('Case API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to update case' } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/cases/[id]
 * Soft delete a case (mark as closed)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        // Use admin client to bypass RLS for updates
        const supabase = createAdminClient();

        const result = await (supabase as any)
            .from('cases')
            .update({
                status: 'CLOSED',
                closed_at: new Date().toISOString(),
                closure_reason: 'MANUALLY_CLOSED',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (result.error) {
            if (result.error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: { code: 'NOT_FOUND', message: 'Case not found' } },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: { code: 'DATABASE_ERROR', message: result.error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ data: result.data, message: 'Case closed successfully' });
    } catch (error) {
        console.error('Case API error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to close case' } },
            { status: 500 }
        );
    }
}
