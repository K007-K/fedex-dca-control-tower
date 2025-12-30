/**
 * Business Hours Calculator for SLA Due Date Calculation
 * P0-2 FIX: Implements proper business hours logic
 */

export interface BusinessHoursConfig {
    /** Start of work day (0-23) */
    workDayStart: number;
    /** End of work day (0-23) */
    workDayEnd: number;
    /** Working days (0 = Sunday, 6 = Saturday) */
    workDays: number[];
    /** Timezone for calculations */
    timezone: string;
}

// Default business hours configuration
export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
    workDayStart: 9,  // 9 AM
    workDayEnd: 17,   // 5 PM
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
    timezone: 'America/New_York',
};

// Placeholder for holiday configuration
// In production, this should come from database or config
export const HOLIDAY_DATES: string[] = [
    // Format: 'YYYY-MM-DD'
    // Example entries - should be managed via admin UI
    // '2025-01-01', // New Year's Day
    // '2025-12-25', // Christmas
];

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return HOLIDAY_DATES.includes(dateStr);
}

/**
 * Check if a date is a working day
 */
export function isWorkingDay(date: Date, config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS): boolean {
    const dayOfWeek = date.getDay();
    return config.workDays.includes(dayOfWeek) && !isHoliday(date);
}

/**
 * Get hours remaining in current work day from given time
 */
function getWorkHoursRemainingToday(date: Date, config: BusinessHoursConfig): number {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Before work hours
    if (hours < config.workDayStart) {
        return config.workDayEnd - config.workDayStart;
    }

    // After work hours
    if (hours >= config.workDayEnd) {
        return 0;
    }

    // During work hours
    return config.workDayEnd - hours - (minutes / 60);
}

/**
 * Get hours in a full work day
 */
function getWorkHoursPerDay(config: BusinessHoursConfig): number {
    return config.workDayEnd - config.workDayStart;
}

/**
 * Calculate SLA due date considering business hours
 * 
 * @param startDate - When the SLA period starts
 * @param durationHours - SLA duration in hours
 * @param businessHoursOnly - Whether to only count business hours
 * @param config - Business hours configuration
 * @returns Due date
 */
export function calculateSlaDueDate(
    startDate: Date,
    durationHours: number,
    businessHoursOnly: boolean,
    config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
): Date {
    // If not business hours only, just add the hours
    if (!businessHoursOnly) {
        return new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
    }

    let remainingHours = durationHours;
    const current = new Date(startDate);
    const workHoursPerDay = getWorkHoursPerDay(config);

    // Safety limit to prevent infinite loops
    const maxIterations = 365;
    let iterations = 0;

    while (remainingHours > 0 && iterations < maxIterations) {
        iterations++;

        // Skip non-working days
        if (!isWorkingDay(current, config)) {
            current.setDate(current.getDate() + 1);
            current.setHours(config.workDayStart, 0, 0, 0);
            continue;
        }

        // Get available work hours for current day
        const currentHour = current.getHours();

        // If before work hours, move to start of work day
        if (currentHour < config.workDayStart) {
            current.setHours(config.workDayStart, 0, 0, 0);
        }

        // If after work hours, move to next day
        if (currentHour >= config.workDayEnd) {
            current.setDate(current.getDate() + 1);
            current.setHours(config.workDayStart, 0, 0, 0);
            continue;
        }

        // Calculate remaining work hours today
        const hoursLeftToday = getWorkHoursRemainingToday(current, config);

        if (remainingHours <= hoursLeftToday) {
            // SLA ends today
            const endTime = new Date(current.getTime() + remainingHours * 60 * 60 * 1000);
            return endTime;
        } else {
            // Use up today's hours and continue to next day
            remainingHours -= hoursLeftToday;
            current.setDate(current.getDate() + 1);
            current.setHours(config.workDayStart, 0, 0, 0);
        }
    }

    // Fallback: if we hit max iterations, return current date
    return current;
}

/**
 * Calculate the remaining business hours until a due date
 */
export function calculateRemainingBusinessHours(
    currentDate: Date,
    dueDate: Date,
    config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
): number {
    if (currentDate >= dueDate) {
        return 0;
    }

    let totalHours = 0;
    const current = new Date(currentDate);
    const workHoursPerDay = getWorkHoursPerDay(config);

    const maxIterations = 365;
    let iterations = 0;

    while (current < dueDate && iterations < maxIterations) {
        iterations++;

        if (!isWorkingDay(current, config)) {
            current.setDate(current.getDate() + 1);
            current.setHours(config.workDayStart, 0, 0, 0);
            continue;
        }

        const currentHour = current.getHours();

        // Before work hours
        if (currentHour < config.workDayStart) {
            current.setHours(config.workDayStart, 0, 0, 0);
            continue;
        }

        // After work hours
        if (currentHour >= config.workDayEnd) {
            current.setDate(current.getDate() + 1);
            current.setHours(config.workDayStart, 0, 0, 0);
            continue;
        }

        // During work hours
        const hoursLeftToday = getWorkHoursRemainingToday(current, config);

        // Check if due date is today
        if (current.toDateString() === dueDate.toDateString()) {
            const dueHour = dueDate.getHours();
            const dueMinutes = dueDate.getMinutes();

            if (dueHour <= config.workDayEnd) {
                const hoursUntilDue = dueHour + (dueMinutes / 60) - currentHour - (current.getMinutes() / 60);
                totalHours += Math.max(0, Math.min(hoursUntilDue, hoursLeftToday));
            } else {
                totalHours += hoursLeftToday;
            }
            break;
        }

        totalHours += hoursLeftToday;
        current.setDate(current.getDate() + 1);
        current.setHours(config.workDayStart, 0, 0, 0);
    }

    return Math.max(0, totalHours);
}

/**
 * Format time remaining in human readable format
 */
export function formatTimeRemaining(hours: number): string {
    if (hours <= 0) {
        return 'Overdue';
    }

    if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes}m`;
    }

    if (hours < 24) {
        return `${Math.round(hours)}h`;
    }

    const days = Math.floor(hours / 8); // 8 business hours per day
    const remainingHours = Math.round(hours % 8);

    if (remainingHours === 0) {
        return `${days}d`;
    }

    return `${days}d ${remainingHours}h`;
}
