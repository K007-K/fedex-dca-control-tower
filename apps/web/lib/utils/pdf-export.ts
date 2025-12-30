import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFData {
    title: string;
    subtitle?: string;
    data: Record<string, unknown>[];
    columns: { header: string; dataKey: string }[];
}

/**
 * P3-16: PDF Export Utility
 * Generate PDF reports from application data
 */
export function generatePDF({ title, subtitle, data, columns }: PDFData): void {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(74, 28, 141); // Primary purple
    doc.text(title, 14, 22);

    // Add subtitle
    if (subtitle) {
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(subtitle, 14, 30);
    }

    // Add table
    autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data.map(row => columns.map(col => String(row[col.dataKey] || ''))),
        startY: subtitle ? 35 : 30,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [74, 28, 141], // Primary purple
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252], // Light gray
        },
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(
            `Page ${i} of ${pageCount} | Generated: ${new Date().toLocaleDateString()}`,
            14,
            doc.internal.pageSize.height - 10
        );
    }

    // Save the PDF
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export analytics data to PDF
 */
export function exportAnalyticsPDF(cases: unknown[]) {
    generatePDF({
        title: 'FedEx DCA Analytics Report',
        subtitle: `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        data: cases as Record<string, unknown>[],
        columns: [
            { header: 'Case #', dataKey: 'case_number' },
            { header: 'Customer', dataKey: 'customer_name' },
            { header: 'Status', dataKey: 'status' },
            { header: 'Priority', dataKey: 'priority' },
            { header: 'Outstanding', dataKey: 'outstanding_amount' },
            { header: 'Recovered', dataKey: 'recovered_amount' },
            { header: 'Days Past Due', dataKey: 'days_past_due' },
        ],
    });
}
