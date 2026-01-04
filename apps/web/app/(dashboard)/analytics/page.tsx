import { Suspense } from 'react';
import { AnalyticsCharts } from '@/components/analytics';
import { AnalyticsPageHeader } from '@/components/analytics/AnalyticsPageHeader';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Case = {
    status: string;
    priority: string;
    recovered_amount: number;
    outstanding_amount: number;
    created_at: string;
    currency?: string;
    region?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DCA = {
    name: string;
    performance_score: number;
    recovery_rate: number;
    sla_compliance_rate: number;
    region?: string;
};

interface PageProps {
    searchParams: Promise<{ days?: string; region?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const days = params.days ?? '30';
    const region = params.region ?? 'ALL';
    const supabase = await createClient();

    // Calculate date filter
    let dateFilter: Date | null = null;
    if (days !== 'all') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - parseInt(days));
    }

    // Fetch all cases for analytics (with optional date and region filters)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let casesQuery = (supabase as any).from('cases').select('*');
    if (dateFilter) {
        casesQuery = casesQuery.gte('created_at', dateFilter.toISOString());
    }
    if (region && region !== 'ALL') {
        casesQuery = casesQuery.eq('region', region);
    }
    const { data: cases } = await casesQuery;

    // Fetch all DCAs with optional region filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dcasQuery = (supabase as any)
        .from('dcas')
        .select('name, performance_score, recovery_rate, sla_compliance_rate, region')
        .eq('status', 'ACTIVE')
        .order('performance_score', { ascending: false });

    if (region && region !== 'ALL') {
        dcasQuery = dcasQuery.eq('region', region);
    }
    const { data: dcas } = await dcasQuery;

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

    // Generate real monthly trend data from cases
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyData: Record<string, { recovered: number; target: number }> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        monthlyData[monthKey] = {
            recovered: 0,
            target: 50000 + (Math.abs(5 - i) * 10000) // Progressive targets
        };
    }

    // Aggregate recovered amounts by month from actual cases
    cases?.forEach((c: Case) => {
        const caseDate = new Date(c.created_at);
        const monthKey = `${caseDate.getFullYear()}-${caseDate.getMonth()}`;
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].recovered += c.recovered_amount || 0;
        }
    });

    // Convert to array format for charts
    const recoveryTrend = Object.entries(monthlyData).map(([key, data]) => {
        const [_year, month] = key.split('-').map(Number);
        return {
            month: monthNames[month],
            recovered: data.recovered,
            target: data.target,
        };
    });

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
            {/* Page Header with Region Filter */}
            <AnalyticsPageHeader days={days} />

            {/* Key Metrics Cards - Dark mode compatible */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Cases</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCases}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activeCases} active</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Recovered</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">${(totalRecovered / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{recoveryRate}% recovery rate</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${(totalOutstanding / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">across all cases</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg DCA Score</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgDCAScore}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">out of 100</p>
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
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">DCA Performance Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[#222]">
                                <th className="pb-3 font-medium">DCA Name</th>
                                <th className="pb-3 font-medium text-center">Performance Score</th>
                                <th className="pb-3 font-medium text-center">Recovery Rate</th>
                                <th className="pb-3 font-medium text-center">SLA Compliance</th>
                                <th className="pb-3 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dcas?.map((dca: DCA, index: number) => (
                                <tr key={index} className="border-b border-gray-50 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                    <td className="py-3 font-medium text-gray-900 dark:text-white">{dca.name}</td>
                                    <td className="py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${dca.performance_score >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            dca.performance_score >= 60 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                            {dca.performance_score || 0}
                                        </span>
                                    </td>
                                    <td className="py-3 text-center text-gray-600 dark:text-gray-300">{dca.recovery_rate || 0}%</td>
                                    <td className="py-3 text-center text-gray-600 dark:text-gray-300">{dca.sla_compliance_rate || 0}%</td>
                                    <td className="py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${dca.sla_compliance_rate >= 90 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                            dca.sla_compliance_rate >= 70 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                'bg-red-500/20 text-red-400 border-red-500/30'
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
