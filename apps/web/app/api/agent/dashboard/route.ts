import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Agent Dashboard API
 * 
 * SCOPE: Only data for the current agent (assigned_agent_id = current_user.id)
 * ACCESS: DCA_AGENT role only
 * Uses admin client to bypass RLS (user auth verified separately via getCurrentUser)
 */

export async function GET() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DCA_AGENT can access this endpoint
    if (user.role !== 'DCA_AGENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const agentId = user.id;

    try {
        // 1. Get workload counts - active cases assigned to this agent
        // Active = NOT in terminal states (CLOSED, FULL_RECOVERY, WRITTEN_OFF)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: allCases, error: casesError } = await (supabase as any)
            .from('cases')
            .select('id, status, outstanding_amount, currency, case_number, updated_at')
            .eq('assigned_agent_id', agentId);

        if (casesError) {
            console.error('Cases fetch error:', casesError);
        }

        // Filter out closed cases in JS (more reliable than PostgREST not in)
        const terminalStatuses = ['CLOSED', 'FULL_RECOVERY', 'WRITTEN_OFF'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeCases = (allCases || []).filter((c: any) => !terminalStatuses.includes(c.status));
        const assignedCases = activeCases.length;

        // 2. Get SLA data for agent's active cases
        const caseIds = activeCases.map((c: { id: string }) => c.id);

        let slaDueSoon: Array<{
            id: string;
            case_number: string;
            customer_name: string;
            outstanding_amount: number;
            currency: string;
            hours_remaining: number;
            is_breached: boolean;
            sla_due_at: string;
        }> = [];

        let slaBreached: typeof slaDueSoon = [];
        let dueToday = 0;
        let overdueCases = 0;

        if (caseIds.length > 0) {
            // Get active SLA logs for agent's cases
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: slaLogs } = await (supabase as any)
                .from('sla_logs')
                .select(`
                    id,
                    case_id,
                    status,
                    due_at,
                    cases!inner(id, case_number, customer_name, outstanding_amount, currency)
                `)
                .in('case_id', caseIds)
                .in('status', ['PENDING', 'BREACHED']);

            const now = new Date();
            const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            slaLogs?.forEach((log: any) => {
                const dueAt = new Date(log.due_at);
                const hoursRemaining = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

                const slaCase = {
                    id: log.cases.id,
                    case_number: log.cases.case_number,
                    customer_name: log.cases.customer_name,
                    outstanding_amount: log.cases.outstanding_amount,
                    currency: log.cases.currency || 'INR',
                    hours_remaining: hoursRemaining,
                    is_breached: log.status === 'BREACHED' || hoursRemaining < 0,
                    sla_due_at: log.due_at,
                };

                if (log.status === 'BREACHED' || hoursRemaining < 0) {
                    slaBreached.push(slaCase);
                    overdueCases++;
                } else if (dueAt <= in24Hours) {
                    slaDueSoon.push(slaCase);
                    if (dueAt <= endOfDay) {
                        dueToday++;
                    }
                }
            });

            // Sort by urgency
            slaDueSoon.sort((a, b) => a.hours_remaining - b.hours_remaining);
            slaBreached.sort((a, b) => a.hours_remaining - b.hours_remaining);
        }
        // 3. Generate action reminders based on active cases
        // Sort by updated_at ascending (oldest first = needs attention)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortedActiveCases = [...activeCases].sort((a: any, b: any) => {
            return new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
        }).slice(0, 10);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actionReminders = sortedActiveCases.map((c: any) => {
            let action_type: 'contact' | 'update' | 'followup' | 'payment' = 'update';
            let description = 'Update case status';

            switch (c.status) {
                case 'ALLOCATED':
                    action_type = 'contact';
                    description = 'Contact customer';
                    break;
                case 'CUSTOMER_CONTACTED':
                    action_type = 'followup';
                    description = 'Follow up on contact';
                    break;
                case 'PAYMENT_PROMISED':
                    action_type = 'payment';
                    description = 'Record payment received';
                    break;
                case 'DISPUTED':
                    action_type = 'update';
                    description = 'Resolve dispute';
                    break;
                default:
                    action_type = 'update';
                    description = 'Update case progress';
            }

            return {
                id: `reminder-${c.id}`,
                case_id: c.id,
                case_number: c.case_number || `CASE-${c.id.slice(0, 8)}`,
                action_type,
                description,
            };
        });

        // Determine currency from first case or default to INR
        const currency = activeCases?.[0]?.currency || 'INR';

        return NextResponse.json({
            workload: {
                assignedCases,
                dueToday,
                overdueCases,
            },
            slaDueSoon,
            slaBreached,
            actionReminders,
            currency,
        });

    } catch (error) {
        console.error('Agent dashboard API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
