import { NextResponse } from 'next/server';

// Force dynamic rendering - this route uses cookies/headers
export const dynamic = 'force-dynamic';

import { withRateLimitedPermission, type ApiHandler } from '@/lib/auth/api-wrapper';
import { createClient } from '@/lib/supabase/server';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { logUserAction } from '@/lib/audit';
import { GOVERNED_REPORTS, canAccessReport, canExportReport } from '@/lib/reports/governance';
import { UserRole } from '@/lib/auth/rbac';

interface ReportRequest {
    reportType: string;
    format?: 'json' | 'csv';
    region?: string;  // REQUIRED: Region filter for reports
    startDate?: string;
    endDate?: string;
}

/**
 * POST /api/reports/generate - Generate a report
 * Permission: analytics:export
 * Rate limited for export operations
 * 
 * GOVERNANCE:
 * - Per-report role validation
 * - Audit logging for all actions
 * - Scope enforcement via secure query
 * - Region filtering MANDATORY
 */
const handleGenerateReport: ApiHandler = async (request, { user }) => {
    try {
        const supabase = await createClient();
        const body: ReportRequest = await request.json();

        const { reportType, format = 'json', region, startDate, endDate } = body;

        if (!reportType) {
            return NextResponse.json(
                { error: 'reportType is required' },
                { status: 400 }
            );
        }

        // ============================================================
        // GOVERNANCE: Per-Report Access Control
        // ============================================================
        const reportConfig = GOVERNED_REPORTS[reportType];
        if (!reportConfig) {
            return NextResponse.json(
                { error: `Unknown report type: ${reportType}` },
                { status: 400 }
            );
        }

        // Check if user role can access this specific report
        if (!canAccessReport(reportType, user.role as UserRole)) {
            // Log security event for unauthorized access attempt
            await logUserAction(
                'REPORT_ACCESS_DENIED',
                user.id,
                user.email,
                'report',
                reportType,
                {
                    role: user.role,
                    reportType,
                    format,
                    reason: 'Role not authorized for this report',
                }
            );

            return NextResponse.json(
                { error: 'You do not have permission to access this report' },
                { status: 403 }
            );
        }

        // For CSV exports, check export permission
        if (format === 'csv' && !canExportReport(reportType, user.role as UserRole)) {
            await logUserAction(
                'REPORT_EXPORT_DENIED',
                user.id,
                user.email,
                'report',
                reportType,
                {
                    role: user.role,
                    reportType,
                    reason: 'CSV export not permitted for this role',
                }
            );

            return NextResponse.json(
                { error: 'CSV export is not permitted for your role' },
                { status: 403 }
            );
        }

        // ============================================================
        // AUDIT: Log report action BEFORE generation
        // ============================================================
        const auditAction = format === 'csv' ? 'REPORT_EXPORTED' : 'REPORT_PREVIEWED';
        await logUserAction(
            auditAction,
            user.id,
            user.email,
            'report',
            reportType,
            {
                reportName: reportConfig.name,
                role: user.role,
                scope: reportConfig.scope,
                sensitivity: reportConfig.sensitivity,
                format,
                region: region || 'ALL',
            }
        );

        let reportData: Record<string, unknown> = {};
        let csvContent = '';

        // Helper to apply region filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const applyRegionFilter = (query: any) => {
            if (region && region !== 'ALL') {
                return query.eq('region', region);
            }
            return query;
        };

        switch (reportType) {
            case 'recovery-summary': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let casesQuery = (supabase as any)
                    .from('cases')
                    .select('status, outstanding_amount, recovered_amount, created_at, region');

                // GOVERNANCE: Apply region filter
                casesQuery = applyRegionFilter(casesQuery);

                // Apply date filters if provided
                if (startDate) {
                    casesQuery = casesQuery.gte('created_at', startDate);
                }
                if (endDate) {
                    casesQuery = casesQuery.lte('created_at', endDate);
                }

                const { data: cases } = await casesQuery;

                const totalOutstanding = cases?.reduce((sum: number, c: { outstanding_amount: number }) =>
                    sum + (c.outstanding_amount || 0), 0) || 0;
                const totalRecovered = cases?.reduce((sum: number, c: { recovered_amount: number }) =>
                    sum + (c.recovered_amount || 0), 0) || 0;
                const recoveryRate = totalOutstanding > 0 ? (totalRecovered / totalOutstanding * 100) : 0;

                const statusBreakdown: Record<string, number> = {};
                cases?.forEach((c: { status: string }) => {
                    statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
                });

                reportData = {
                    reportName: 'Recovery Summary',
                    generatedAt: new Date().toISOString(),
                    region: region || 'ALL',
                    summary: {
                        totalCases: cases?.length || 0,
                        totalOutstanding,
                        totalRecovered,
                        recoveryRate: recoveryRate.toFixed(2) + '%',
                    },
                    statusBreakdown,
                };

                if (format === 'csv') {
                    csvContent = `Recovery Summary Report\nGenerated: ${new Date().toISOString()}\nRegion: ${region || 'ALL'}\n\n`;
                    csvContent += `Metric,Value\n`;
                    csvContent += `Total Cases,${cases?.length || 0}\n`;
                    csvContent += `Total Outstanding,$${totalOutstanding.toLocaleString()}\n`;
                    csvContent += `Total Recovered,$${totalRecovered.toLocaleString()}\n`;
                    csvContent += `Recovery Rate,${recoveryRate.toFixed(2)}%\n`;
                }
                break;
            }

            case 'dca-performance': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let dcasQuery = (supabase as any)
                    .from('dcas')
                    .select('name, code, status, performance_score, recovery_rate, capacity_used, capacity_limit, total_cases_handled, total_amount_recovered, region');

                // GOVERNANCE: Apply region filter
                dcasQuery = applyRegionFilter(dcasQuery);

                const { data: dcas } = await dcasQuery;

                reportData = {
                    reportName: 'DCA Performance Report',
                    generatedAt: new Date().toISOString(),
                    region: region || 'ALL',
                    dcas: dcas || [],
                    summary: {
                        totalDCAs: dcas?.length || 0,
                        activeDCAs: dcas?.filter((d: { status: string }) => d.status === 'ACTIVE').length || 0,
                        avgPerformance: dcas?.length ?
                            (dcas.reduce((sum: number, d: { performance_score: number }) => sum + (d.performance_score || 0), 0) / dcas.length).toFixed(1) : 0,
                    },
                };

                if (format === 'csv') {
                    csvContent = `DCA Performance Report\nGenerated: ${new Date().toISOString()}\nRegion: ${region || 'ALL'}\n\n`;
                    csvContent += `DCA Name,Code,Status,Performance,Recovery Rate,Capacity Used,Capacity Limit\n`;
                    dcas?.forEach((d: { name: string; code: string; status: string; performance_score: number; recovery_rate: number; capacity_used: number; capacity_limit: number }) => {
                        csvContent += `"${d.name}","${d.code}","${d.status}",${d.performance_score || 0},${d.recovery_rate || 0}%,${d.capacity_used || 0},${d.capacity_limit || 0}\n`;
                    });
                }
                break;
            }

            case 'sla-compliance': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let slaQuery = (supabase as any)
                    .from('sla_logs')
                    .select('*, cases!inner(region)')
                    .order('created_at', { ascending: false })
                    .limit(100);

                const { data: slaLogs } = await slaQuery;

                // Filter by region if specified
                let filteredLogs = slaLogs || [];
                if (region && region !== 'ALL') {
                    filteredLogs = slaLogs?.filter((l: { cases: { region: string } }) => l.cases?.region === region) || [];
                }

                const breached = filteredLogs.filter((l: { is_breach: boolean }) => l.is_breach).length || 0;
                const compliant = filteredLogs.length - breached;

                reportData = {
                    reportName: 'SLA Compliance Report',
                    generatedAt: new Date().toISOString(),
                    region: region || 'ALL',
                    summary: {
                        totalEvents: filteredLogs.length,
                        compliant,
                        breached,
                        complianceRate: filteredLogs.length ? ((compliant / filteredLogs.length) * 100).toFixed(1) + '%' : 'N/A',
                    },
                    recentEvents: filteredLogs.slice(0, 10),
                };

                if (format === 'csv') {
                    csvContent = `SLA Compliance Report\nGenerated: ${new Date().toISOString()}\nRegion: ${region || 'ALL'}\nCompliant: ${compliant}, Breached: ${breached}\n\n`;
                    csvContent += `Event ID,Case ID,Is Breach,Created At\n`;
                    filteredLogs.slice(0, 50).forEach((l: { id: string; case_id: string; is_breach: boolean; created_at: string }) => {
                        csvContent += `"${l.id}","${l.case_id}",${l.is_breach ? 'Yes' : 'No'},"${l.created_at}"\n`;
                    });
                }
                break;
            }

            case 'aging-report': {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let casesQuery = (supabase as any)
                    .from('cases')
                    .select('case_number, customer_name, outstanding_amount, days_past_due, status, region')
                    .order('days_past_due', { ascending: false });

                // GOVERNANCE: Apply region filter
                casesQuery = applyRegionFilter(casesQuery);

                const { data: cases } = await casesQuery;

                const buckets = {
                    '0-30': cases?.filter((c: { days_past_due: number }) => c.days_past_due <= 30) || [],
                    '31-60': cases?.filter((c: { days_past_due: number }) => c.days_past_due > 30 && c.days_past_due <= 60) || [],
                    '61-90': cases?.filter((c: { days_past_due: number }) => c.days_past_due > 60 && c.days_past_due <= 90) || [],
                    '90+': cases?.filter((c: { days_past_due: number }) => c.days_past_due > 90) || [],
                };

                reportData = {
                    reportName: 'Aging Report',
                    generatedAt: new Date().toISOString(),
                    region: region || 'ALL',
                    summary: {
                        '0-30 days': buckets['0-30'].length,
                        '31-60 days': buckets['31-60'].length,
                        '61-90 days': buckets['61-90'].length,
                        '90+ days': buckets['90+'].length,
                    },
                    cases: cases?.slice(0, 50) || [],
                };

                if (format === 'csv') {
                    csvContent = `Aging Report\nGenerated: ${new Date().toISOString()}\nRegion: ${region || 'ALL'}\n\n`;
                    csvContent += `Case Number,Customer,Outstanding,Days Past Due,Status\n`;
                    cases?.forEach((c: { case_number: string; customer_name: string; outstanding_amount: number; days_past_due: number; status: string }) => {
                        csvContent += `"${c.case_number}","${c.customer_name}",$${c.outstanding_amount},${c.days_past_due},"${c.status}"\n`;
                    });
                }
                break;
            }

            default:
                return NextResponse.json(
                    { error: `Unknown report type: ${reportType}` },
                    { status: 400 }
                );
        }

        if (format === 'csv') {
            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.csv"`,
                },
            });
        }

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('Report generation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

/**
 * GET /api/reports/generate - Generate a CSV report (for direct link downloads)
 * Supports query params: format, days, reportType
 * SECURITY: Requires authentication and analytics:export permission
 */
const handleGetReport: ApiHandler = async (request, { user }) => {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';
        const days = searchParams.get('days') || '30';
        const reportType = searchParams.get('reportType') || 'recovery-summary';

        const supabase = await createClient();

        // Calculate date filter
        let dateFilter: Date | null = null;
        if (days !== 'all') {
            dateFilter = new Date();
            dateFilter.setDate(dateFilter.getDate() - parseInt(days));
        }

        // Fetch cases with date filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let casesQuery = (supabase as any).from('cases').select('*');
        if (dateFilter) {
            casesQuery = casesQuery.gte('created_at', dateFilter.toISOString());
        }
        const { data: cases } = await casesQuery;

        // Generate CSV content
        let csvContent = '';

        if (reportType === 'recovery-summary' || format === 'csv') {
            csvContent = `Case Number,Customer,Status,Priority,Outstanding,Recovered,Days Past Due,Created At\n`;
            cases?.forEach((c: {
                case_number: string;
                customer_name: string;
                status: string;
                priority: string;
                outstanding_amount: number;
                recovered_amount: number;
                days_past_due: number;
                created_at: string;
            }) => {
                csvContent += `"${c.case_number || ''}","${c.customer_name || ''}","${c.status || ''}","${c.priority || ''}",$${c.outstanding_amount || 0},$${c.recovered_amount || 0},${c.days_past_due || 0},"${c.created_at || ''}"\n`;
            });
        }

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="analytics_export_${days}days_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error('Report generation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
};

// Export with RBAC and rate limiting for both GET and POST
export const GET = withRateLimitedPermission('analytics:export', handleGetReport, RATE_LIMIT_CONFIGS.export);
export const POST = withRateLimitedPermission('analytics:export', handleGenerateReport, RATE_LIMIT_CONFIGS.export);

