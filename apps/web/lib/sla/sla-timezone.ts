/**
 * SLA Timezone & Business Hours Service
 * 
 * CRITICAL: All SLA timing is region-aware
 * - Timezone derived from regions.timezone (IANA format)
 * - Business hours respected per region
 * - All timestamps stored in UTC
 * - Region timezone stored for traceability
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// ===========================================
// TYPES
// ===========================================

export interface RegionTimezone {
    regionId: string;
    regionCode: string;
    timezone: string;  // IANA format: 'America/New_York', 'Asia/Kolkata'
    businessHours: BusinessHours;
}

export interface BusinessHours {
    start: string;  // '09:00'
    end: string;    // '18:00'
    days: number[]; // [1,2,3,4,5] = Mon-Fri
}

export interface SLATimingResult {
    slaStartUtc: Date;
    slaDueUtc: Date;
    regionTimezone: string;
    businessHoursApplied: boolean;
    effectiveMinutes: number;
}

// ===========================================
// TIMEZONE UTILITIES
// ===========================================

/**
 * Get region timezone info from database
 */
export async function getRegionTimezone(regionId: string): Promise<RegionTimezone | null> {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('regions')
            .select('id, region_code, timezone, business_hours')
            .eq('id', regionId)
            .single() as { data: { id: string; region_code: string; timezone: string; business_hours: BusinessHours } | null; error: unknown };

        if (error || !data) {
            console.error('Failed to get region timezone:', error);
            return null;
        }

        return {
            regionId: data.id,
            regionCode: data.region_code,
            timezone: data.timezone || 'UTC',
            businessHours: data.business_hours || { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
        };
    } catch (error) {
        console.error('Error getting region timezone:', error);
        return null;
    }
}

/**
 * Get current time in region timezone
 */
export function getNowInRegion(timezone: string): Date {
    // Get current time as string in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const now = new Date();
    const parts = formatter.formatToParts(now);

    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

    // Return the equivalent UTC time that represents "now" in the region
    return now; // For SLA, we always store in UTC
}

/**
 * Convert UTC to region local time string (for display)
 */
export function formatInRegionTimezone(utcDate: Date, timezone: string): string {
    return utcDate.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
}

// ===========================================
// BUSINESS HOURS CALCULATOR
// ===========================================

/**
 * Check if a given UTC time falls within business hours for a region
 */
export function isWithinBusinessHours(
    utcTime: Date,
    timezone: string,
    businessHours: BusinessHours
): boolean {
    // Convert UTC to region local time
    const localFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        weekday: 'short',
    });

    const parts = localFormatter.formatToParts(utcTime);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';

    // Map weekday to number (1=Mon, 7=Sun)
    const dayMap: Record<string, number> = {
        'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7
    };
    const dayNum = dayMap[weekday] || 1;

    // Check if day is a business day
    if (!businessHours.days.includes(dayNum)) {
        return false;
    }

    // Parse business hour strings
    const [startHour, startMin] = businessHours.start.split(':').map(Number);
    const [endHour, endMin] = businessHours.end.split(':').map(Number);

    const currentMinutes = hour * 60 + minute;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Calculate effective business minutes between two UTC times
 * considering region business hours
 */
export function calculateBusinessMinutes(
    startUtc: Date,
    endUtc: Date,
    timezone: string,
    businessHours: BusinessHours
): number {
    let totalMinutes = 0;
    const current = new Date(startUtc);

    // Iterate minute by minute (in production, optimize with hour blocks)
    while (current < endUtc) {
        if (isWithinBusinessHours(current, timezone, businessHours)) {
            totalMinutes++;
        }
        current.setMinutes(current.getMinutes() + 1);

        // Safety: cap at 30 days to prevent infinite loops
        if (totalMinutes > 43200) break; // 30 days * 24 hours * 60 min
    }

    return totalMinutes;
}

/**
 * Calculate SLA due time considering business hours
 */
export function calculateSlaDueTime(
    startUtc: Date,
    durationHours: number,
    timezone: string,
    businessHours: BusinessHours,
    businessHoursOnly: boolean
): Date {
    if (!businessHoursOnly) {
        // Simple: just add the hours
        const dueTime = new Date(startUtc);
        dueTime.setHours(dueTime.getHours() + durationHours);
        return dueTime;
    }

    // Complex: only count business hours
    const requiredMinutes = durationHours * 60;
    let countedMinutes = 0;
    const current = new Date(startUtc);

    while (countedMinutes < requiredMinutes) {
        if (isWithinBusinessHours(current, timezone, businessHours)) {
            countedMinutes++;
        }
        current.setMinutes(current.getMinutes() + 1);

        // Safety: cap at 90 days
        const maxIterations = 90 * 24 * 60;
        if (countedMinutes === 0 && (current.getTime() - startUtc.getTime()) > maxIterations * 60000) {
            console.error('SLA calculation exceeded max iterations');
            break;
        }
    }

    return current;
}

// ===========================================
// SLA TIMING SERVICE
// ===========================================

/**
 * Calculate SLA start and due times for a case
 * 
 * @param regionId - The region of the case
 * @param durationHours - SLA duration in hours
 * @param businessHoursOnly - Whether to only count business hours
 * @returns SLA timing result with UTC timestamps
 */
export async function calculateSLATiming(
    regionId: string,
    durationHours: number,
    businessHoursOnly: boolean
): Promise<SLATimingResult | null> {
    const region = await getRegionTimezone(regionId);

    if (!region) {
        console.error('Could not get region timezone for SLA calculation');
        return null;
    }

    const slaStartUtc = new Date(); // Always UTC

    const slaDueUtc = calculateSlaDueTime(
        slaStartUtc,
        durationHours,
        region.timezone,
        region.businessHours,
        businessHoursOnly
    );

    // Calculate effective minutes (for audit)
    const effectiveMinutes = businessHoursOnly
        ? calculateBusinessMinutes(slaStartUtc, slaDueUtc, region.timezone, region.businessHours)
        : durationHours * 60;

    return {
        slaStartUtc,
        slaDueUtc,
        regionTimezone: region.timezone,
        businessHoursApplied: businessHoursOnly,
        effectiveMinutes,
    };
}

/**
 * Check if SLA is breached at current time
 */
export async function isSlaBreached(
    slaDueUtc: Date,
    regionId: string,
    businessHoursOnly: boolean
): Promise<{ breached: boolean; breachMinutes: number }> {
    const now = new Date();

    if (now <= slaDueUtc) {
        return { breached: false, breachMinutes: 0 };
    }

    // Calculate breach duration
    let breachMinutes: number;

    if (businessHoursOnly) {
        const region = await getRegionTimezone(regionId);
        if (region) {
            breachMinutes = calculateBusinessMinutes(slaDueUtc, now, region.timezone, region.businessHours);
        } else {
            breachMinutes = Math.floor((now.getTime() - slaDueUtc.getTime()) / 60000);
        }
    } else {
        breachMinutes = Math.floor((now.getTime() - slaDueUtc.getTime()) / 60000);
    }

    return { breached: true, breachMinutes };
}

// ===========================================
// AUDIT HELPERS
// ===========================================

/**
 * Get SLA timing context for audit logging
 */
export function getSlaAuditContext(
    slaStartUtc: Date,
    slaDueUtc: Date,
    regionTimezone: string,
    businessHoursApplied: boolean
): Record<string, unknown> {
    return {
        sla_started_at_utc: slaStartUtc.toISOString(),
        sla_due_at_utc: slaDueUtc.toISOString(),
        sla_started_at_local: formatInRegionTimezone(slaStartUtc, regionTimezone),
        sla_due_at_local: formatInRegionTimezone(slaDueUtc, regionTimezone),
        region_timezone: regionTimezone,
        business_hours_applied: businessHoursApplied,
    };
}

/**
 * Get breach timing context for audit logging
 */
export function getBreachAuditContext(
    slaDueUtc: Date,
    breachTimeUtc: Date,
    breachMinutes: number,
    regionTimezone: string
): Record<string, unknown> {
    return {
        sla_due_at_utc: slaDueUtc.toISOString(),
        sla_breached_at_utc: breachTimeUtc.toISOString(),
        sla_due_at_local: formatInRegionTimezone(slaDueUtc, regionTimezone),
        sla_breached_at_local: formatInRegionTimezone(breachTimeUtc, regionTimezone),
        breach_duration_minutes: breachMinutes,
        region_timezone: regionTimezone,
    };
}
