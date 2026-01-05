import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Agent Notifications API
 * 
 * GET: Fetch notifications for the current agent
 * Uses admin client to bypass RLS (user auth is handled separately)
 */

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_AGENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    const supabase = createAdminClient();

    try {
        let query = supabase
            .from('agent_notifications')
            .select('id, notification_type, title, message, case_id, is_read, created_at')
            .eq('agent_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (filter === 'unread') {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('Notifications fetch error:', error);
            // Return empty array instead of error
            return NextResponse.json({ notifications: [] });
        }

        // Get case numbers separately if we have case_ids
        const caseIds = [...new Set((notifications || []).map(n => n.case_id).filter(Boolean))];
        let caseMap: Record<string, string> = {};

        if (caseIds.length > 0) {
            const { data: cases } = await supabase
                .from('cases')
                .select('id, case_number')
                .in('id', caseIds);

            if (cases) {
                caseMap = cases.reduce((acc, c) => {
                    acc[c.id] = c.case_number;
                    return acc;
                }, {} as Record<string, string>);
            }
        }

        const mapped = (notifications || []).map((n) => ({
            id: n.id,
            notification_type: n.notification_type,
            title: n.title,
            message: n.message,
            case_id: n.case_id,
            case_number: n.case_id ? (caseMap[n.case_id] || null) : null,
            is_read: n.is_read,
            created_at: n.created_at,
        }));

        return NextResponse.json({ notifications: mapped });

    } catch (error) {
        console.error('Notifications API error:', error);
        return NextResponse.json({ notifications: [] });
    }
}
