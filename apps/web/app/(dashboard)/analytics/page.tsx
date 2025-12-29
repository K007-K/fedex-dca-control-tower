import { Suspense } from 'react';

import { AnalyticsCharts, DateFilter } from '@/components/analytics';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Case = {
    status: string;
    priority: string;
    recovered_amount: number;
    outstanding_amount: number;
    created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DCA = {
    name: string;
    performance_score: number;
    recovery_rate: number;
    sla_compliance_rate: number;
};

interface PageProps {
    searchParams: Promise<{ days?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const days = params.days ?? '30';
    const supabase = await createClient();

    // Calculate date filter
    let dateFilter: Date | null = null;
    if (days !== 'all') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - parseInt(days));
    }

    // Fetch all cases for analytics (with optional date filter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let casesQuery = (supabase as any).from('cases').select('*');
    if (dateFilter) {
        casesQuery = casesQuery.gte('created_at', dateFilter.toISOString());
    }
    const { data: cases } = await casesQuery;

    // Fetch all DCAs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dcas } = await (supabase as any)
        .from('dcas')
        .select('name, performance_score, recovery_rate, sla_compliance_rate')
        .eq('status', 'ACTIVE')
        .order('performance_score', { ascending: false });

    // Process cases by status
    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    let totalRecovered = 0;
    let totalOutstanding = 0;

    cases?.forEach((c: Case) => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
        priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
        totalRecovered += c.recovered_amount || 0;
        totalOutstanding += c.outstanding_amount || 0;
    });

    const casesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
    }));

    const casesByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
        priority,
        count,
    }));

    // Prepare DCA performance data
    const dcaPerformance = dcas?.map((d: DCA) => ({
        name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
        score: d.performance_score || 0,
        recoveryRate: d.recovery_rate || 0,
        slaCompliance: d.sla_compliance_rate || 0,
    })) || [];

    // Generate mock monthly trend data (in real app, would aggregate from cases by month)
    const recoveryTrend = [
        { month: 'Jul', recovered: 125000, target: 150000 },
        { month: 'Aug', recovered: 145000, target: 150000 },
        { month: 'Sep', recovered: 168000, target: 160000 },
        { month: 'Oct', recovered: 192000, target: 170000 },
        { month: 'Nov', recovered: 178000, target: 180000 },
        { month: 'Dec', recovered: totalRecovered || 185000, target: 190000 },
    ];

    // Calculate key metrics
    const totalCases = cases?.length || 0;
    const activeCases = cases?.filter((c: Case) =>
        !['CLOSED', 'WRITTEN_OFF', 'FULL_RECOVERY'].includes(c.status)
    ).length || 0;
    const recoveryRate = totalOutstanding > 0
        ? ((totalRecovered / (totalRecovered + totalOutstanding)) * 100).toFixed(1)
        : '0';
    const avgDCAScore = dcas?.length
        ? (dcas.reduce((sum: number, d: DCA) => sum + (d.performance_score || 0), 0) / dcas.length).toFixed(1)
        : '0';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-500">Track recovery trends and DCA performance metrics</p>
                </div>
                <div className="flex gap-2">
                    <Suspense fallback={<div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />}>
                        <DateFilter currentRange={days} />
                    </Suspense>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-primary to-primary-700 rounded-xl p-5 text-white">
                    <p className="text-sm opacity-80">Total Cases</p>
                    <p className="text-3xl font-bold">{totalCases}</p>
                    <p className="text-xs opacity-70 mt-1">{activeCases} active</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                    <p className="text-sm opacity-80">Total Recovered</p>
                    <p className="text-3xl font-bold">${(totalRecovered / 1000).toFixed(0)}K</p>
                    <p className="text-xs opacity-70 mt-1">{recoveryRate}% recovery rate</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white">
                    <p className="text-sm opacity-80">Outstanding</p>
                    <p className="text-3xl font-bold">${(totalOutstanding / 1000).toFixed(0)}K</p>
                    <p className="text-xs opacity-70 mt-1">across all cases</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                    <p className="text-sm opacity-80">Avg DCA Score</p>
                    <p className="text-3xl font-bold">{avgDCAScore}</p>
                    <p className="text-xs opacity-70 mt-1">out of 100</p>
                </div>
            </div>

            {/* Charts */}
            <AnalyticsCharts
                recoveryTrend={recoveryTrend}
                dcaPerformance={dcaPerformance}
                casesByStatus={casesByStatus}
                casesByPriority={casesByPriority}
            />

            {/* Quick Stats Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">DCA Performance Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                                <th className="pb-3 font-medium">DCA Name</th>
                                <th className="pb-3 font-medium text-center">Performance Score</th>
                                <th className="pb-3 font-medium text-center">Recovery Rate</th>
                                <th className="pb-3 font-medium text-center">SLA Compliance</th>
                                <th className="pb-3 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dcas?.map((dca: DCA, index: number) => (
                                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-3 font-medium text-gray-900">{dca.name}</td>
                                    <td className="py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dca.performance_score >= 80 ? 'bg-green-100 text-green-800' :
                                            dca.performance_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {dca.performance_score || 0}
                                        </span>
                                    </td>
                                    <td className="py-3 text-center text-gray-600">{dca.recovery_rate || 0}%</td>
                                    <td className="py-3 text-center text-gray-600">{dca.sla_compliance_rate || 0}%</td>
                                    <td className="py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dca.sla_compliance_rate >= 90 ? 'bg-green-100 text-green-800' :
                                            dca.sla_compliance_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {dca.sla_compliance_rate >= 90 ? 'Excellent' :
                                                dca.sla_compliance_rate >= 70 ? 'Good' : 'Needs Improvement'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
