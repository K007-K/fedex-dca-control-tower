/**
 * CSV Export Utility
 * Converts data arrays to CSV format and triggers download
 */

interface ExportColumn {
    key: string;
    header: string;
    formatter?: (value: unknown) => string;
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCsv<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    columns?: ExportColumn[]
): void {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Auto-detect columns if not provided
    const cols: ExportColumn[] = columns || Object.keys(data[0]).map(key => ({
        key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

    // Build CSV content
    const headers = cols.map(col => `"${col.header}"`).join(',');

    const rows = data.map(item =>
        cols.map(col => {
            const value = item[col.key];
            const formatted = col.formatter ? col.formatter(value) : formatValue(value);
            // Escape quotes and wrap in quotes
            return `"${String(formatted).replace(/"/g, '""')}"`;
        }).join(',')
    );

    const csv = [headers, ...rows].join('\n');

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Format value for CSV
 */
function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Predefined column configurations for common exports
 */
export const CASE_EXPORT_COLUMNS: ExportColumn[] = [
    { key: 'case_number', header: 'Case Number' },
    { key: 'status', header: 'Status' },
    { key: 'outstanding_amount', header: 'Amount', formatter: v => formatCurrency(v as number) },
    { key: 'customer_name', header: 'Customer Name' },
    { key: 'customer_email', header: 'Email' },
    { key: 'customer_phone', header: 'Phone' },
    { key: 'customer_segment', header: 'Segment' },
    { key: 'customer_industry', header: 'Industry' },
    { key: 'days_past_due', header: 'Days Past Due' },
    { key: 'assigned_dca', header: 'Assigned DCA' },
    { key: 'created_at', header: 'Created Date', formatter: v => formatDate(v as string) },
];

export const DCA_EXPORT_COLUMNS: ExportColumn[] = [
    { key: 'name', header: 'DCA Name' },
    { key: 'code', header: 'Code' },
    { key: 'status', header: 'Status' },
    { key: 'capacity_limit', header: 'Capacity Limit' },
    { key: 'capacity_used', header: 'Capacity Used' },
    { key: 'performance_score', header: 'Performance Score' },
    { key: 'recovery_rate', header: 'Recovery Rate', formatter: v => `${v}%` },
    { key: 'active_cases', header: 'Active Cases' },
    { key: 'total_recovered', header: 'Total Recovered', formatter: v => formatCurrency(v as number) },
];
