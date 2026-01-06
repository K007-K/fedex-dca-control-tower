import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * DCA_ADMIN Cases API
 * 
 * SCOPE: Only cases where dca_id = current_user.dca_id
 * ACCESS: DCA_ADMIN role only
 */

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'DCA_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    try {
        // Get user's DCA
        const { data: userProfile } = await supabase
            .from('users')
            .select('dca_id')
            .eq('id', user.id)
            .single();

        if (!userProfile?.dca_id) {
            return NextResponse.json({ error: 'No DCA assigned' }, { status: 400 });
        }

        const dcaId = userProfile.dca_id;

        // Get filter from query params
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter');

        // Build query
        let query = supabase
            .from('cases')
            .select(`
                id,
                case_number,
                customer_name,
                outstanding_amount,
                currency,
                status,
                sla_due_at,
                updated_at,
                assigned_agent_id,
                users!cases_assigned_agent_id_fkey(full_name)
            `)
            .eq('dca_id', dcaId)
            .order('updated_at', { ascending: false });

        // Apply filters
        if (filter === 'escalated') {
            query = query.eq('status', 'ESCALATED');
        } else if (filter === 'overdue') {
            query = query.lt('sla_due_at', new Date().toISOString());
        }

        const { data: cases, error } = await query;

        if (error) {
            console.error('Admin cases fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
        }

        // Enrich with SLA calculations
        const now = new Date();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const enrichedCases = (cases || []).map((c: any) => {
            let sla_hours_remaining = 0;
            if (c.sla_due_at) {
                const dueAt = new Date(c.sla_due_at);
                sla_hours_remaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            }

            return {
                id: c.id,
                case_number: c.case_number,
                customer_name: c.customer_name,
                assigned_agent: c.users?.full_name || 'Unassigned',
                status: c.status,
                outstanding_amount: c.outstanding_amount,
                currency: c.currency || 'INR',
                sla_hours_remaining,
                updated_at: c.updated_at,
                is_escalated: c.status === 'ESCALATED',
            };
        });

        // Apply at-risk filter post-query
        let finalCases = enrichedCases;
        if (filter === 'at-risk') {
            finalCases = enrichedCases.filter(c => c.sla_hours_remaining > 0 && c.sla_hours_remaining < 24);
        }

        return NextResponse.json({
            cases: finalCases,
            total: finalCases.length,
        });
    } catch (error) {
        console.error('Admin cases API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
