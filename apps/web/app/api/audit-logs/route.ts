import { NextRequest, NextResponse } from 'next/server';
import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/audit-logs - List audit logs with filtering
 * Permission: audit:read (only admins can view audit logs)
 */
const handleGetAuditLogs: ApiHandler = async (request) => {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Parse query params
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');
        const action = searchParams.get('action');
        const userId = searchParams.get('user_id');
        const resourceType = searchParams.get('resource_type');
        const severity = searchParams.get('severity');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (action) {
            query = query.eq('action', action);
        }
        if (userId) {
            query = query.eq('user_id', userId);
        }
        if (resourceType) {
            query = query.eq('resource_type', resourceType);
        }
        if (severity) {
            query = query.eq('severity', severity);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Audit logs fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch audit logs', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            data,
            pagination: {
                total: count,
                limit,
                offset,
                hasMore: offset + limit < (count || 0),
            },
        });

    } catch (error) {
        console.error('Audit logs API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

export const GET = withPermission('admin:audit', handleGetAuditLogs);
