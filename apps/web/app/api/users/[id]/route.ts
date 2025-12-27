import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id] - Get user details
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('users')
            .select(`
        *,
        organization:organizations(id, name),
        dca:dcas(id, name, status)
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('User fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/users/[id] - Update user
 */
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();

        // Fields that can be updated
        const allowedFields = [
            'full_name', 'phone', 'role', 'organization_id', 'dca_id',
            'timezone', 'locale', 'is_active', 'notification_preferences',
            'ui_preferences', 'avatar_url', 'permissions'
        ];

        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
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
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('User update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[id] - Deactivate user (soft delete)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // Soft delete by setting is_active to false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('users')
            .update({
                is_active: false,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({
            message: 'User deactivated successfully',
            data
        });

    } catch (error) {
        console.error('User delete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
