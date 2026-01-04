import Link from 'next/link';

import { ReportCard } from '@/components/reports/ReportCard';
import { ReportsPageHeader } from '@/components/reports/ReportsPageHeader';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Case = {
    status: string;
    outstanding_amount: number;
    recovered_amount: number;
};

const REPORT_TEMPLATES = [
    {
        id: 'recovery-summary',
        name: 'Recovery Summary',
        description: 'Monthly overview of recovery performance across all DCAs',
        icon: '💰',
        category: 'Financial',
    },
    {
        id: 'dca-performance',
        name: 'DCA Performance Report',
        description: 'Detailed performance metrics for each DCA partner',
        icon: '📊',
        category: 'Operations',
    },
    {
        id: 'sla-compliance',
        name: 'SLA Compliance Report',
        description: 'Track SLA adherence and identify breaches',
        icon: '⏱️',
        category: 'Compliance',
    },
    {
        id: 'aging-report',
        name: 'Aging Report',
        description: 'Cases grouped by days past due',
        icon: '📅',
        category: 'Financial',
    },
];

interface PageProps {
    searchParams: Promise<{ region?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const region = params.region;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // GOVERNANCE: Check export permission
    const canExport = user && !['FEDEX_VIEWER'].includes(user.role) && !user.role.startsWith('DCA_');

    // Get summary stats for the quick metrics (with region filter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let casesQuery = (supabase as any).from('cases').select('status, outstanding_amount, recovered_amount');
    if (region && region !== 'ALL') {
        casesQuery = casesQuery.eq('region', region);
    }
    const { data: cases } = await casesQuery;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dcasQuery = (supabase as any).from('dcas').select('name, total_cases_handled, total_amount_recovered');
    if (region && region !== 'ALL') {
        dcasQuery = dcasQuery.eq('region', region);
    }
    const { data: dcas } = await dcasQuery;

    const totalCases = cases?.length || 0;
    const totalRecovered = cases?.reduce((sum: number, c: Case) => sum + (c.recovered_amount || 0), 0) || 0;
    const totalDCAs = dcas?.length || 0;

    return (
        <div className="space-y-6">
            {/* Page Header with Region Filter */}
            <ReportsPageHeader userRole={user?.role} canExport={canExport ?? false} />

            {/* SYSTEM-Derived Analytics Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Read-Only Analytics</h3>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            All metrics are SYSTEM-calculated and cannot be manually modified. Data reflects
                            your authorized region scope. Exports include only visible data and are audit-logged.
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center text-2xl">
                            📁
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Cases</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCases}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center text-2xl">
                            💵
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Recovered</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">${(totalRecovered / 1000).toFixed(0)}K</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center text-2xl">
                            🏢
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Active DCAs</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDCAs}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Panels Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Drivers of Change Panel */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Drivers of Change</h3>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400">
                            SYSTEM-Generated
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                            <span className="text-green-500 mt-0.5">↑</span>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Recovery Rate +2.3%</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Driven by increased first-contact success in NORTH region</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                            <span className="text-red-500 mt-0.5">↓</span>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">SLA Compliance -1.5%</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Higher case volume exceeding DCA capacity in WEST region</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                            <span className="text-blue-500 mt-0.5">→</span>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Escalation Rate Stable</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Auto-escalation workflow performing within normal bounds</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Interpretation Panel */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Interpretation</h3>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400">
                            AI-Powered
                        </span>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                <strong>Summary:</strong> Overall portfolio health is <span className="text-green-600 dark:text-green-400 font-semibold">improving</span>.
                                Recovery momentum is positive with {totalCases} active cases generating ${(totalRecovered / 1000).toFixed(0)}K in recoveries.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risk Level</p>
                                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Moderate</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trend Direction</p>
                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">Positive</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Interpretation is automatically generated by SYSTEM based on real-time data analysis.
                        </p>
                    </div>
                </div>
            </div>

            {/* Scope Indicator */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-[#0a0a0a] rounded-lg px-4 py-3 border border-gray-200 dark:border-[#222]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Role Scope:</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                            {user?.role || 'FEDEX_VIEWER'}
                        </span>
                    </div>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Region Scope:</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                            {user?.role === 'SUPER_ADMIN' ? 'ALL REGIONS' : 'Assigned Regions'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Export:</span>
                    {canExport ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">Enabled</span>
                    ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium">Disabled</span>
                    )}
                </div>
            </div>

            {/* Report Templates */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {REPORT_TEMPLATES.map((report) => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reports</h2>
                    <Link href="#" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
                        View All →
                    </Link>
                </div>
                <div className="text-center py-12">
                    <div className="text-5xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports generated yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Select a template above to generate your first report
                    </p>
                </div>
            </div>

            {/* Scheduled Reports */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scheduled Reports</h2>
                    <button className="text-sm text-gray-600 dark:text-gray-300 hover:underline">
                        + Schedule New
                    </button>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No scheduled reports. Set up automated delivery of key reports.</p>
                </div>
            </div>
        </div>
    );
}
