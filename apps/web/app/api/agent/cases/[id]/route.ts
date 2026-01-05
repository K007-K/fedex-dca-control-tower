import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Agent Case Detail API
 * 
 * GET: Fetch case details with activities and SLA info
 * SCOPE: Only cases assigned to the current agent
 * Uses admin client to bypass RLS (user auth is handled separately)
 */

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_AGENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    try {
        // Fetch case - must be assigned to this agent
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('*')
            .eq('id', id)
            .eq('assigned_agent_id', user.id)
            .single();

        if (caseError) {
            console.error('Case fetch error:', caseError);
            if (caseError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Case not found or not assigned to you' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
        }

        if (!caseData) {
            return NextResponse.json({ error: 'Case not found or not assigned to you' }, { status: 404 });
        }

        // Fetch activity logs
        const { data: activities, error: activitiesError } = await supabase
            .from('case_activities')
            .select('id, activity_type, description, metadata, created_at, created_by')
            .eq('case_id', id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (activitiesError) {
            console.error('Activities fetch error:', activitiesError);
            // Don't fail, just return empty activities
        }

        // Get user names for activities
        const creatorIds = [...new Set((activities || []).map(a => a.created_by).filter(Boolean))];
        let userMap: Record<string, string> = {};

        if (creatorIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id, name, email')
                .in('id', creatorIds);

            if (users) {
                userMap = users.reduce((acc, u) => {
                    acc[u.id] = u.name || u.email || 'Unknown';
                    return acc;
                }, {} as Record<string, string>);
            }
        }

        // Map activities with creator name
        const mappedActivities = (activities || []).map((a) => ({
            id: a.id,
            activity_type: a.activity_type,
            description: a.description,
            metadata: a.metadata,
            created_at: a.created_at,
            created_by_name: a.created_by ? (userMap[a.created_by] || 'Unknown') : 'System',
        }));

        // Fetch SLA info - try different approaches
        let slaInfo = null;

        // First try sla_logs table
        const { data: slaLogs, error: slaError } = await supabase
            .from('sla_logs')
            .select('status, due_at')
            .eq('case_id', id)
            .in('status', ['PENDING', 'BREACHED'])
            .order('due_at', { ascending: true })
            .limit(1);

        if (!slaError && slaLogs && slaLogs.length > 0) {
            const now = new Date();
            const dueAt = new Date(slaLogs[0].due_at);
            const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            slaInfo = {
                status: slaLogs[0].status,
                due_at: slaLogs[0].due_at,
                hours_remaining: hoursRemaining,
            };
        } else {
            // Fallback: calculate SLA based on case creation date (5 days default)
            const createdAt = new Date(caseData.created_at);
            const defaultSlaDays = 5;
            const dueAt = new Date(createdAt.getTime() + defaultSlaDays * 24 * 60 * 60 * 1000);
            const now = new Date();
            const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

            slaInfo = {
                status: hoursRemaining < 0 ? 'BREACHED' : 'PENDING',
                due_at: dueAt.toISOString(),
                hours_remaining: hoursRemaining,
            };
        }

        return NextResponse.json({
            case: caseData,
            activities: mappedActivities,
            sla: slaInfo,
        });

    } catch (error) {
        console.error('Agent case detail API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
