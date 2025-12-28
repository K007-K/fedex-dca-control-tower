import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/sla/breach-check - Check for cases at risk of SLA breach
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Get SLA templates
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: templates } = await (supabase as any)
            .from('sla_templates')
            .select('*')
            .eq('is_active', true);

        const defaultResponseHours = templates?.[0]?.response_time_hours || 24;
        const defaultResolutionHours = templates?.[0]?.resolution_time_hours || 72;

        // Get active cases with their SLA status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: cases } = await (supabase as any)
            .from('cases')
            .select('id, case_number, customer_name, status, sla_due_at, created_at')
            .not('status', 'in', '("CLOSED","FULL_RECOVERY","WRITTEN_OFF")')
            .order('created_at', { ascending: true });

        const now = new Date();
        const atRiskCases: Array<{
            id: string;
            case_number: string;
            customer_name: string;
            sla_due_at: string;
            status: string;
            hoursUntilBreach: number;
        }> = [];

        cases?.forEach((c: {
            id: string;
            case_number: string;
            customer_name: string;
            status: string;
            sla_due_at: string | null;
            created_at: string;
        }) => {
            // Calculate SLA due date
            let slaDueAt: Date;
            if (c.sla_due_at) {
                slaDueAt = new Date(c.sla_due_at);
            } else {
                // Default based on status
                const hoursToAdd = c.status === 'PENDING_ALLOCATION' ? defaultResponseHours : defaultResolutionHours;
                slaDueAt = new Date(new Date(c.created_at).getTime() + hoursToAdd * 60 * 60 * 1000);
            }

            const hoursUntilBreach = (slaDueAt.getTime() - now.getTime()) / (1000 * 60 * 60);

            // Alert if breaching within 24 hours
            if (hoursUntilBreach <= 24) {
                atRiskCases.push({
                    id: c.id,
                    case_number: c.case_number,
                    customer_name: c.customer_name,
                    sla_due_at: slaDueAt.toISOString(),
                    status: c.status,
                    hoursUntilBreach,
                });
            }
        });

        // Sort by most urgent first
        atRiskCases.sort((a, b) => a.hoursUntilBreach - b.hoursUntilBreach);

        return NextResponse.json({
            atRiskCases,
            totalAtRisk: atRiskCases.length,
            breached: atRiskCases.filter(c => c.hoursUntilBreach <= 0).length,
            checkedAt: now.toISOString(),
        });

    } catch (error) {
        console.error('SLA breach check error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
