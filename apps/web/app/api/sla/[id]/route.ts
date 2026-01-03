import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';

interface SLALogRecord {
    status: string;
}

/**
 * GET /api/sla/[id] - Get SLA template details with logs
 * Permission: sla:read
 */
const handleGetSla: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        const includeLogs = searchParams.get('include_logs') === 'true';

        // Get template
        const { data: template, error: templateError } = await supabase
            .from('sla_templates')
            .select('*')
            .eq('id', id)
            .single();

        if (templateError) {
            if (templateError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'SLA template not found' },
                    { status: 404 }
                );
            }
            throw templateError;
        }

        let logs = null;
        if (includeLogs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: logsData } = await (supabase as any)
                .from('sla_logs')
                .select('*')
                .eq('sla_template_id', id)
                .order('created_at', { ascending: false })
                .limit(100);

            logs = logsData;
        }

        // Get stats
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: statsData } = await (supabase as any)
            .from('sla_logs')
            .select('status')
            .eq('sla_template_id', id);

        const stats = (statsData ?? []) as SLALogRecord[];
        const metCount = stats.filter(s => s.status === 'MET').length;
        const breachedCount = stats.filter(s => s.status === 'BREACHED').length;
        const pendingCount = stats.filter(s => s.status === 'PENDING').length;
        const totalCount = stats.length;

        return NextResponse.json({
            data: {
                ...(template as object),
                logs: includeLogs ? logs : undefined,
                stats: {
                    total: totalCount,
                    met: metCount,
                    breached: breachedCount,
                    pending: pendingCount,
                    complianceRate: (metCount + breachedCount) > 0
                        ? ((metCount / (metCount + breachedCount)) * 100).toFixed(1)
                        : null,
                },
            },
        });

    } catch (error) {
        console.error('SLA template fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

/**
 * PATCH /api/sla/[id] - Update SLA template
 * Permission: sla:update
 */
const handleUpdateSla: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const body = await request.json();

        const allowedFields = [
            'name', 'description', 'duration_hours', 'business_hours_only',
            'applicable_to', 'breach_notification_to', 'auto_escalate_on_breach',
            'escalation_rules', 'is_active'
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
            .from('sla_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'SLA template not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({ data });

    } catch (error) {
        console.error('SLA template update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

/**
 * DELETE /api/sla/[id] - Deactivate SLA template
 * Permission: sla:update (deactivation is an update)
 */
const handleDeleteSla: ApiHandler = async (request, { params, user }) => {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('sla_templates')
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
                    { error: 'SLA template not found' },
                    { status: 404 }
                );
            }
            throw error;
        }

        return NextResponse.json({
            message: 'SLA template deactivated',
            data
        });

    } catch (error) {
        console.error('SLA template delete error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

// Protected routes
export const GET = withPermission('sla:read', handleGetSla);
export const PATCH = withPermission('sla:update', handleUpdateSla);
export const DELETE = withPermission('sla:update', handleDeleteSla);
