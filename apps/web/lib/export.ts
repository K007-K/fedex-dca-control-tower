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
    { key: 'priority', header: 'Priority' },
    { key: 'outstanding_amount', header: 'Outstanding Amount', formatter: v => formatCurrency(v as number) },
    { key: 'recovered_amount', header: 'Recovered Amount', formatter: v => formatCurrency(v as number) },
    { key: 'customer_name', header: 'Customer Name' },
    { key: 'customer_segment', header: 'Segment' },
    { key: 'customer_industry', header: 'Industry' },
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

/**
 * Export data to PDF format
 * Uses browser print API for client-side PDF generation
 */
export function exportToPdf<T extends Record<string, unknown>>(
    data: T[],
    title: string,
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

    // Create print-friendly HTML
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                @page { size: landscape; margin: 20mm; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #4F1D91;
                }
                .header h1 {
                    color: #4F1D91;
                    margin: 0;
                    font-size: 24px;
                }
                .header .subtitle {
                    color: #666;
                    font-size: 12px;
                    margin-top: 5px;
                }
                .meta {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    font-size: 11px;
                    color: #666;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse;
                    font-size: 11px;
                }
                th { 
                    background: #4F1D91; 
                    color: white; 
                    padding: 10px 8px;
                    text-align: left;
                    font-weight: 600;
                }
                td { 
                    padding: 8px; 
                    border-bottom: 1px solid #e5e7eb;
                }
                tr:nth-child(even) { background: #f9fafb; }
                tr:hover { background: #f3f4f6; }
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    font-size: 10px;
                    color: #999;
                }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>FedEx DCA Control Tower</h1>
                <div class="subtitle">${title}</div>
            </div>
            <div class="meta">
                <span>Generated: ${new Date().toLocaleString()}</span>
                <span>Total Records: ${data.length}</span>
            </div>
            <table>
                <thead>
                    <tr>
                        ${cols.map(col => `<th>${col.header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${cols.map(col => {
        const value = item[col.key];
        const formatted = col.formatter ? col.formatter(value) : formatValue(value);
        return `<td>${formatted}</td>`;
    }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                FedEx DCA Control Tower • Confidential Report
            </div>
        </body>
        </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            // Close after print dialog (with small delay for Safari)
            setTimeout(() => printWindow.close(), 1000);
        };
    }
}

/**
 * Generate PDF report with summary statistics
 */
export function exportReportToPdf<T extends Record<string, unknown>>(
    data: T[],
    title: string,
    summary: { label: string; value: string }[],
    columns?: ExportColumn[]
): void {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    const cols: ExportColumn[] = columns || Object.keys(data[0]).map(key => ({
        key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                @page { size: landscape; margin: 20mm; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #4F1D91;
                }
                .header h1 { color: #4F1D91; margin: 0; font-size: 24px; }
                .header .subtitle { color: #666; font-size: 12px; margin-top: 5px; }
                .summary {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .summary-card {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                }
                .summary-card .value { font-size: 22px; font-weight: 700; color: #4F1D91; }
                .summary-card .label { font-size: 11px; color: #666; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th { background: #4F1D91; color: white; padding: 10px 8px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
                tr:nth-child(even) { background: #f9fafb; }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 10px;
                    color: #999;
                }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>FedEx DCA Control Tower</h1>
                <div class="subtitle">${title}</div>
            </div>
            <div class="summary">
                ${summary.map(s => `
                    <div class="summary-card">
                        <div class="value">${s.value}</div>
                        <div class="label">${s.label}</div>
                    </div>
                `).join('')}
            </div>
            <table>
                <thead>
                    <tr>${cols.map(col => `<th>${col.header}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${cols.map(col => {
        const value = item[col.key];
        const formatted = col.formatter ? col.formatter(value) : formatValue(value);
        return `<td>${formatted}</td>`;
    }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                FedEx DCA Control Tower • Generated ${new Date().toLocaleString()}
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
        };
    }
}
