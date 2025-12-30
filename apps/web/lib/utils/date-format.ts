/**
 * Date Formatting Utilities
 * P3-8 FIX: Consistent timestamp formatting across the app
 */

type DateInput = Date | string | number;

/**
 * Convert various date formats to Date object
 */
function toDate(input: DateInput): Date {
    if (input instanceof Date) return input;
    return new Date(input);
}

/**
 * Format date for display: "Mar 15, 2024"
 */
export function formatDate(input: DateInput): string {
    const date = toDate(input);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Format date and time: "Mar 15, 2024, 2:30 PM"
 */
export function formatDateTime(input: DateInput): string {
    const date = toDate(input);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format time only: "2:30 PM"
 */
export function formatTime(input: DateInput): string {
    const date = toDate(input);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format as relative time: "2 hours ago", "3 days ago"
 */
export function formatRelative(input: DateInput): string {
    const date = toDate(input);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
}

/**
 * Format for SLA/deadlines: "in 2 hours" or "2 hours overdue"
 */
export function formatDeadline(input: DateInput): { text: string; isPast: boolean } {
    const date = toDate(input);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const isPast = diff < 0;
    const absDiff = Math.abs(diff);

    const minutes = Math.floor(absDiff / (1000 * 60));
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

    let timeStr: string;
    if (minutes < 60) {
        timeStr = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
        timeStr = `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
        timeStr = `${days} day${days !== 1 ? 's' : ''}`;
    }

    return {
        text: isPast ? `${timeStr} overdue` : `in ${timeStr}`,
        isPast,
    };
}

/**
 * Format as ISO date for API/database: "2024-03-15"
 */
export function formatISO(input: DateInput): string {
    const date = toDate(input);
    return date.toISOString().split('T')[0];
}

/**
 * Format as ISO datetime for API/database
 */
export function formatISODateTime(input: DateInput): string {
    return toDate(input).toISOString();
}

/**
 * Format for file names: "2024-03-15_143000"
 */
export function formatForFilename(input: DateInput): string {
    const date = toDate(input);
    const iso = date.toISOString();
    return iso.replace(/[-:]/g, '').replace('T', '_').split('.')[0];
}

/**
 * Check if date is today
 */
export function isToday(input: DateInput): boolean {
    const date = toDate(input);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Check if date is in the past
 */
export function isPast(input: DateInput): boolean {
    return toDate(input).getTime() < Date.now();
}

export default {
    formatDate,
    formatDateTime,
    formatTime,
    formatRelative,
    formatDeadline,
    formatISO,
    formatISODateTime,
    formatForFilename,
    isToday,
    isPast,
};
