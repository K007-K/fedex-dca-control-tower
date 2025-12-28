import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/escalations/[id] - Get escalation details
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('escalations')
            .select(`
                *,
                case:cases(id, case_number, customer_name, outstanding_amount, status),
                escalated_to_user:users!escalations_escalated_to_fkey(id, full_name, email),
                escalated_from_user:users!escalations_escalated_from_fkey(id, full_name, email),
                resolved_by_user:users!escalations_resolved_by_fkey(id, full_name, email)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Escalation not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Escalation fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/escalations/[id] - Update/resolve escalation
 */
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();

        const allowedFields = [
            'title', 'description', 'severity', 'status',
            'escalated_to', 'resolution', 'resolved_by',
            'case_reallocated', 'new_dca_id', 'dca_penalized', 'penalty_details'
        ];

        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        // If resolving, set resolved_at
        if (body.status === 'RESOLVED' || body.status === 'CLOSED') {
            updates.resolved_at = new Date().toISOString();
            if (body.resolved_by) {
                updates.resolved_by = body.resolved_by;
            }

            // Calculate resolution time
            const { data: existing } = await supabase
                .from('escalations')
                .select('escalated_at')
                .eq('id', id)
                .single();

            if (existing?.escalated_at) {
                const hours = Math.round(
                    (Date.now() - new Date(existing.escalated_at).getTime()) / (1000 * 60 * 60)
                );
                updates.resolution_time_hours = hours;
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        updates.updated_at = new Date().toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('escalations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Escalation not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Escalation update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/escalations/[id] - Close escalation (soft delete)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('escalations')
            .update({
                status: 'CLOSED',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Escalation not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({
            message: 'Escalation closed',
            data
        });

    } catch (error) {
        console.error('Escalation delete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
