import Link from 'next/link';

import { ReportCard } from '@/components/reports/ReportCard';
import { createClient } from '@/lib/supabase/server';

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

export default async function ReportsPage() {
    const supabase = await createClient();

    // Get summary stats for the quick metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cases } = await (supabase as any).from('cases').select('status, outstanding_amount, recovered_amount');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dcas } = await (supabase as any).from('dcas').select('name, total_cases_handled, total_amount_recovered');

    const totalCases = cases?.length || 0;
    const totalRecovered = cases?.reduce((sum: number, c: Case) => sum + (c.recovered_amount || 0), 0) || 0;
    const totalDCAs = dcas?.length || 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
                    <p className="text-gray-500 dark:text-gray-400">Generate and download detailed reports</p>
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
