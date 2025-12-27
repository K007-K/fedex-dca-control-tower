import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';

// ===========================================
// Date Formatting
// ===========================================

/**
 * Format a date to a readable string
 * @example formatDate('2024-01-15') -> 'Jan 15, 2024'
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM d, yyyy');
}

/**
 * Format a date with time
 * @example formatDateTime('2024-01-15T10:30:00') -> 'Jan 15, 2024 at 10:30 AM'
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "MMM d, yyyy 'at' h:mm a");
}

/**
 * Format a date as relative time
 * @example formatRelativeTime('2024-01-15') -> '2 days ago'
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Calculate days between two dates
 */
export function daysBetween(startDate: Date, endDate: Date = new Date()): number {
    return differenceInDays(endDate, startDate);
}

// ===========================================
// Currency Formatting
// ===========================================

/**
 * Format a number as currency
 * @example formatCurrency(1234.56) -> '$1,234.56'
 */
export function formatCurrency(
    amount: number | null | undefined,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format a number as compact currency
 * @example formatCompactCurrency(1234567) -> '$1.2M'
 */
export function formatCompactCurrency(
    amount: number | null | undefined,
    currency: string = 'USD'
): string {
    if (amount === null || amount === undefined) return '-';

    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (absAmount >= 1_000_000_000) {
        return `${sign}$${(absAmount / 1_000_000_000).toFixed(1)}B`;
    }
    if (absAmount >= 1_000_000) {
        return `${sign}$${(absAmount / 1_000_000).toFixed(1)}M`;
    }
    if (absAmount >= 1_000) {
        return `${sign}$${(absAmount / 1_000).toFixed(1)}K`;
    }
    return formatCurrency(amount, currency);
}

// ===========================================
// Number Formatting
// ===========================================

/**
 * Format a number with thousands separators
 * @example formatNumber(1234567) -> '1,234,567'
 */
export function formatNumber(
    value: number | null | undefined,
    locale: string = 'en-US'
): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a number as compact
 * @example formatCompactNumber(1234567) -> '1.2M'
 */
export function formatCompactNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1_000_000_000) {
        return `${sign}${(absValue / 1_000_000_000).toFixed(1)}B`;
    }
    if (absValue >= 1_000_000) {
        return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
    }
    if (absValue >= 1_000) {
        return `${sign}${(absValue / 1_000).toFixed(1)}K`;
    }
    return formatNumber(value);
}

/**
 * Format a number as percentage
 * @example formatPercentage(0.1234) -> '12.34%'
 */
export function formatPercentage(
    value: number | null | undefined,
    decimals: number = 2
): string {
    if (value === null || value === undefined) return '-';
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a decimal as a score (0-100)
 * @example formatScore(0.85) -> '85'
 */
export function formatScore(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    if (value <= 1) {
        return Math.round(value * 100).toString();
    }
    return Math.round(value).toString();
}

// ===========================================
// Text Formatting
// ===========================================

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert snake_case or SCREAMING_SNAKE_CASE to Title Case
 * @example formatEnumValue('IN_PROGRESS') -> 'In Progress'
 */
export function formatEnumValue(value: string | null | undefined): string {
    if (!value) return '-';
    return value
        .split('_')
        .map((word) => capitalize(word))
        .join(' ');
}

/**
 * Format a case number
 * @example formatCaseNumber('CASE-2025-001234') -> 'CASE-2025-001234'
 */
export function formatCaseNumber(caseNumber: string): string {
    return caseNumber.toUpperCase();
}

// ===========================================
// Ageing Bucket
// ===========================================

/**
 * Get ageing bucket from days
 */
export function getAgeingBucket(days: number): string {
    if (days <= 30) return '0-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    if (days <= 180) return '91-180';
    return '180+';
}

/**
 * Get ageing bucket color class
 */
export function getAgeingBucketColor(days: number): string {
    if (days <= 30) return 'text-success';
    if (days <= 60) return 'text-info';
    if (days <= 90) return 'text-warning';
    return 'text-danger';
}
