import { NextResponse } from 'next/server';

import { withPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { createClient } from '@/lib/supabase/server';
import {
    calculateSlaDueDate,
    calculateRemainingBusinessHours,
    DEFAULT_BUSINESS_HOURS
} from '@/lib/utils/business-hours';

interface SLAAtRiskCase {
    id: string;
    case_number: string;
    customer_name: string;
    sla_due_at: string;
    sla_type: string;
    status: string;
    hoursUntilBreach: number;
    isBreached: boolean;
}

/**
 * GET /api/sla/breach-check
 * Check for cases at risk of SLA breach
 * P0-2 FIX: Implements proper business hours calculation
 * Permission: sla:read
 */
const handleBreachCheck: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Get threshold hours for warning (default: 8 hours)
        const warningThresholdHours = parseInt(searchParams.get('threshold') ?? '8');

        // Get active SLA templates for default durations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: slaTemplates } = await (supabase as any)
            .from('sla_templates')
            .select('*')
            .eq('is_active', true);

        // Create lookup for SLA durations by type
        const slaDurations: Record<string, { hours: number; businessHoursOnly: boolean }> = {};
        for (const template of slaTemplates || []) {
            slaDurations[template.sla_type] = {
                hours: template.duration_hours,
                businessHoursOnly: template.business_hours_only ?? true,
            };
        }

        // Default durations if no templates found
        const defaultFirstContactHours = slaDurations['FIRST_CONTACT']?.hours ?? 24;
        const defaultResolutionHours = slaDurations['RESOLUTION']?.hours ?? 168; // 7 days
        const defaultBusinessHoursOnly = slaDurations['FIRST_CONTACT']?.businessHoursOnly ?? true;

        // Get cases with pending SLAs from sla_logs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: slaLogs, error: slaError } = await (supabase as any)
            .from('sla_logs')
            .select(`
                *,
                case:cases(id, case_number, customer_name, status)
            `)
            .eq('status', 'PENDING')
            .not('case', 'is', null);

        const atRiskCases: SLAAtRiskCase[] = [];
        const now = new Date();

        if (slaLogs) {
            for (const log of slaLogs) {
                if (!log.case) continue;

                const dueAt = new Date(log.due_at);

                // Calculate remaining hours using business hours logic
                const slaConfig = slaDurations[log.sla_type];
                const businessHoursOnly = slaConfig?.businessHoursOnly ?? defaultBusinessHoursOnly;

                let hoursUntilBreach: number;
                if (businessHoursOnly) {
                    hoursUntilBreach = calculateRemainingBusinessHours(now, dueAt, DEFAULT_BUSINESS_HOURS);
                } else {
                    hoursUntilBreach = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
                }

                const isBreached = hoursUntilBreach <= 0;

                // Include if breached or within warning threshold
                if (hoursUntilBreach <= warningThresholdHours) {
                    atRiskCases.push({
                        id: log.case.id,
                        case_number: log.case.case_number,
                        customer_name: log.case.customer_name,
                        sla_due_at: log.due_at,
                        sla_type: log.sla_type,
                        status: log.case.status,
                        hoursUntilBreach: Math.round(hoursUntilBreach * 10) / 10,
                        isBreached,
                    });
                }
            }
        }

        // Also check cases without explicit SLA logs (fallback)
        // These are cases that might not have SLA records
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: casesWithoutSla } = await (supabase as any)
            .from('cases')
            .select('id, case_number, customer_name, status, created_at, sla_due_at')
            .in('status', ['PENDING_ALLOCATION', 'IN_PROGRESS', 'CUSTOMER_CONTACTED'])
            .not('id', 'in', `(${atRiskCases.map(c => `'${c.id}'`).join(',') || "'none'"})`)
            .is('sla_due_at', null);

        // For cases without explicit SLA, calculate based on creation time
        for (const c of casesWithoutSla || []) {
            const createdAt = new Date(c.created_at);
            const hoursToAdd = c.status === 'PENDING_ALLOCATION' ? defaultFirstContactHours : defaultResolutionHours;

            // Calculate due date with business hours
            const slaDueAt = calculateSlaDueDate(createdAt, hoursToAdd, defaultBusinessHoursOnly, DEFAULT_BUSINESS_HOURS);

            let hoursUntilBreach: number;
            if (defaultBusinessHoursOnly) {
                hoursUntilBreach = calculateRemainingBusinessHours(now, slaDueAt, DEFAULT_BUSINESS_HOURS);
            } else {
                hoursUntilBreach = (slaDueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            }

            const isBreached = hoursUntilBreach <= 0;

            if (hoursUntilBreach <= warningThresholdHours) {
                atRiskCases.push({
                    id: c.id,
                    case_number: c.case_number,
                    customer_name: c.customer_name,
                    sla_due_at: slaDueAt.toISOString(),
                    sla_type: c.status === 'PENDING_ALLOCATION' ? 'FIRST_CONTACT' : 'RESOLUTION',
                    status: c.status,
                    hoursUntilBreach: Math.round(hoursUntilBreach * 10) / 10,
                    isBreached,
                });
            }
        }

        // Sort by hours until breach (most urgent first)
        atRiskCases.sort((a, b) => a.hoursUntilBreach - b.hoursUntilBreach);

        return NextResponse.json({
            atRiskCases,
            summary: {
                total: atRiskCases.length,
                breached: atRiskCases.filter(c => c.isBreached).length,
                withinHour: atRiskCases.filter(c => c.hoursUntilBreach > 0 && c.hoursUntilBreach <= 1).length,
                within4Hours: atRiskCases.filter(c => c.hoursUntilBreach > 1 && c.hoursUntilBreach <= 4).length,
                within8Hours: atRiskCases.filter(c => c.hoursUntilBreach > 4 && c.hoursUntilBreach <= 8).length,
            },
            businessHoursConfig: DEFAULT_BUSINESS_HOURS,
        });

    } catch (error) {
        console.error('SLA breach check error:', error);
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Failed to check SLA breaches' } },
            { status: 500 }
        );
    }
};

export const GET = withPermission('sla:read', handleBreachCheck);
