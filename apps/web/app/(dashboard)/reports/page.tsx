import Link from 'next/link';

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
    {
        id: 'collections-forecast',
        name: 'Collections Forecast',
        description: 'Predicted recovery based on historical patterns',
        icon: '🔮',
        category: 'Planning',
    },
    {
        id: 'audit-trail',
        name: 'Audit Trail Report',
        description: 'Complete activity log for compliance',
        icon: '📋',
        category: 'Compliance',
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
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-500">Generate and download detailed reports</p>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                    + Custom Report
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                            📁
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Cases</p>
                            <p className="text-2xl font-bold text-gray-900">{totalCases}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                            💵
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Recovered</p>
                            <p className="text-2xl font-bold text-gray-900">${(totalRecovered / 1000).toFixed(0)}K</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                            🏢
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active DCAs</p>
                            <p className="text-2xl font-bold text-gray-900">{totalDCAs}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Templates */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {REPORT_TEMPLATES.map((report) => (
                        <div
                            key={report.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="text-3xl">{report.icon}</div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                                        {report.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-2">
                                        {report.category}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                                <button className="flex-1 px-3 py-1.5 text-sm text-primary border border-primary rounded hover:bg-primary/5 transition-colors">
                                    Preview
                                </button>
                                <button className="flex-1 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary-700 transition-colors">
                                    Generate
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
                    <Link href="#" className="text-sm text-primary hover:underline">
                        View All →
                    </Link>
                </div>
                <div className="text-center py-12">
                    <div className="text-5xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports generated yet</h3>
                    <p className="text-gray-500 mb-4">
                        Select a template above to generate your first report
                    </p>
                </div>
            </div>

            {/* Scheduled Reports */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Scheduled Reports</h2>
                    <button className="text-sm text-primary hover:underline">
                        + Schedule New
                    </button>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-500">No scheduled reports. Set up automated delivery of key reports.</p>
                </div>
            </div>
        </div>
    );
}
