/**
 * SUPER_ADMIN Audit Log Explorer API
 * 
 * GET /api/v1/governance/audit-logs
 * 
 * Full audit log exploration with filters.
 * SUPER_ADMIN only. Read-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth/api-wrapper';
import { createAdminClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/governance/audit-logs
 * 
 * Returns audit logs with filtering.
 * Query params: actor_type, actor_role, action, region, start_date, end_date, limit, offset
 * Requires: admin:audit permission (SUPER_ADMIN)
 */
export const GET = withPermission('admin:audit', async (request: NextRequest, { user }) => {
    try {
        // Verify SUPER_ADMIN role
        if (user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SUPER_ADMIN_ONLY',
                        message: 'Audit log explorer is only accessible to SUPER_ADMIN',
                    },
                },
                { status: 403 }
            );
        }

        const supabase = createAdminClient();
        const url = new URL(request.url);

        // Parse filters
        const actorType = url.searchParams.get('actor_type');
        const actorRole = url.searchParams.get('actor_role');
        const action = url.searchParams.get('action');
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any)
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (actorType) {
            query = query.eq('actor_type', actorType);
        }
        if (actorRole) {
            query = query.eq('actor_role', actorRole);
        }
        if (action) {
            query = query.eq('action', action);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data: logs, count, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: {
                logs: logs || [],
                pagination: {
                    total: count || 0,
                    limit,
                    offset,
                    has_more: (count || 0) > offset + limit,
                },
                filters: {
                    actor_type: actorType,
                    actor_role: actorRole,
                    action,
                    start_date: startDate,
                    end_date: endDate,
                },
            },
        });

    } catch (error) {
        console.error('Audit logs error:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Failed to load audit logs',
                },
            },
            { status: 500 }
        );
    }
});
