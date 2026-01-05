import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Agent Calendar API
 * 
 * GET: Fetch scheduled callbacks for the current agent
 * POST: Schedule a new callback
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
    const view = searchParams.get('view') || 'all';

    const supabase = createAdminClient();

    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        let query = supabase
            .from('scheduled_callbacks')
            .select('id, case_id, scheduled_for, notes, status')
            .eq('agent_id', user.id)
            .eq('status', 'PENDING')
            .order('scheduled_for', { ascending: true });

        if (view === 'today') {
            const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
            query = query.gte('scheduled_for', todayStart.toISOString()).lt('scheduled_for', todayEnd.toISOString());
        } else if (view === 'week') {
            query = query.gte('scheduled_for', todayStart.toISOString()).lt('scheduled_for', weekEnd.toISOString());
        }

        const { data: callbacks, error } = await query;

        if (error) {
            console.error('Calendar fetch error:', error);
            return NextResponse.json({ callbacks: [] });
        }

        // Get case info separately
        const caseIds = [...new Set((callbacks || []).map(c => c.case_id))];
        let caseMap: Record<string, { case_number: string; customer_name: string }> = {};

        if (caseIds.length > 0) {
            const { data: cases } = await supabase
                .from('cases')
                .select('id, case_number, customer_name')
                .in('id', caseIds);

            if (cases) {
                caseMap = cases.reduce((acc, c) => {
                    acc[c.id] = { case_number: c.case_number, customer_name: c.customer_name };
                    return acc;
                }, {} as Record<string, { case_number: string; customer_name: string }>);
            }
        }

        const mapped = (callbacks || []).map((c) => ({
            id: c.id,
            case_id: c.case_id,
            case_number: caseMap[c.case_id]?.case_number || 'Unknown',
            customer_name: caseMap[c.case_id]?.customer_name || 'Unknown',
            scheduled_for: c.scheduled_for,
            notes: c.notes,
            status: c.status,
        }));

        return NextResponse.json({ callbacks: mapped });

    } catch (error) {
        console.error('Calendar API error:', error);
        return NextResponse.json({ callbacks: [] });
    }
}

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_AGENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { case_id, scheduled_for, notes } = body;

    if (!case_id || !scheduled_for) {
        return NextResponse.json({ error: 'case_id and scheduled_for are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    try {
        // Verify case is assigned to this agent
        const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('id, case_number')
            .eq('id', case_id)
            .eq('assigned_agent_id', user.id)
            .single();

        if (caseError || !caseData) {
            return NextResponse.json({ error: 'Case not found or not assigned to you' }, { status: 404 });
        }

        // Create callback
        const { data: callback, error: insertError } = await supabase
            .from('scheduled_callbacks')
            .insert({
                case_id,
                agent_id: user.id,
                scheduled_for,
                notes: notes || '',
                status: 'PENDING',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Callback insert error:', insertError);
            return NextResponse.json({
                error: 'Failed to schedule callback',
                details: insertError.message
            }, { status: 500 });
        }

        // Also log as activity
        await supabase
            .from('case_activities')
            .insert({
                case_id,
                activity_type: 'NOTE',
                description: `Callback scheduled for ${new Date(scheduled_for).toLocaleString()}${notes ? `: ${notes}` : ''}`,
                created_by: user.id,
            });

        console.log(`Callback scheduled for case ${caseData.case_number} by ${user.email}`);

        return NextResponse.json({ success: true, callback });

    } catch (error) {
        console.error('Calendar POST API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
