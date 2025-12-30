import { MLInsightsPanel } from '@/components/ml';
import { SLABreachAlerts } from '@/components/sla';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

type Case = Database['public']['Tables']['cases']['Row'];
type DCA = Database['public']['Tables']['dcas']['Row'];

// Dashboard metrics types
interface DashboardMetrics {
    totalCases: number;
    activeDCAs: number;
    recoveryRate: number;
    slaCompliance: number;
    pendingCases: number;
    totalRecovered: number;
    totalOutstanding: number;
    // Trend data (previous period for comparison)
    trends: {
        casesTrend: number; // percentage change
        dcasTrend: number;
        recoveryTrend: number;
        slaTrend: number;
    };
}

interface RecentCase {
    id: string;
    case_number: string;
    customer_name: string;
    outstanding_amount: number;
    status: string;
    priority: string;
    created_at: string;
}

async function getDashboardData(): Promise<{
    metrics: DashboardMetrics;
    recentCases: RecentCase[];
}> {
    const supabase = await createClient();

    // Fetch cases data
    const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

    // Fetch DCAs
    const { data: dcasData, error: dcasError } = await supabase
        .from('dcas')
        .select('*')
        .eq('status', 'ACTIVE');

    if (casesError ?? dcasError) {
        console.error('Dashboard data error:', casesError ?? dcasError);
        return {
            metrics: {
                totalCases: 0,
                activeDCAs: 0,
                recoveryRate: 0,
                slaCompliance: 0,
                pendingCases: 0,
                totalRecovered: 0,
                totalOutstanding: 0,
                trends: { casesTrend: 0, dcasTrend: 0, recoveryTrend: 0, slaTrend: 0 },
            },
            recentCases: [],
        };
    }

    // Type cast to ensure proper typing
    const allCases = (casesData ?? []) as Case[];
    const activeDCAs = (dcasData ?? []) as DCA[];

    // Calculate metrics
    const totalRecovered = allCases.reduce((sum, c) => sum + (c.recovered_amount ?? 0), 0);
    const totalOutstanding = allCases.reduce((sum, c) => sum + (c.outstanding_amount ?? 0), 0);
    const totalOriginal = allCases.reduce((sum, c) => sum + (c.original_amount ?? 0), 0);
    const recoveryRate = totalOriginal > 0 ? (totalRecovered / totalOriginal) * 100 : 0;

    const pendingCases = allCases.filter(c =>
        ['PENDING_ALLOCATION', 'ALLOCATED', 'IN_PROGRESS'].includes(c.status)
    ).length;

    // Calculate SLA compliance (cases resolved vs total)
    const resolvedCases = allCases.filter(c =>
        ['FULL_RECOVERY', 'PARTIAL_RECOVERY', 'CLOSED'].includes(c.status)
    );
    const slaCompliance = allCases.length > 0
        ? (resolvedCases.length / allCases.length) * 100
        : 0;

    // Calculate trends by comparing current month vs previous month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthCases = allCases.filter(c => new Date(c.created_at) >= thisMonthStart);
    const lastMonthCases = allCases.filter(c => {
        const d = new Date(c.created_at);
        return d >= lastMonthStart && d <= lastMonthEnd;
    });

    // Case count trend
    const casesTrend = lastMonthCases.length > 0
        ? ((thisMonthCases.length - lastMonthCases.length) / lastMonthCases.length) * 100
        : 0;

    // Recovery rate trend (compare this month's recovery to last month's)
    const thisMonthRecovered = thisMonthCases.reduce((sum, c) => sum + (c.recovered_amount ?? 0), 0);
    const thisMonthOriginal = thisMonthCases.reduce((sum, c) => sum + (c.original_amount ?? 0), 0);
    const lastMonthRecovered = lastMonthCases.reduce((sum, c) => sum + (c.recovered_amount ?? 0), 0);
    const lastMonthOriginal = lastMonthCases.reduce((sum, c) => sum + (c.original_amount ?? 0), 0);

    const thisMonthRate = thisMonthOriginal > 0 ? (thisMonthRecovered / thisMonthOriginal) * 100 : 0;
    const lastMonthRate = lastMonthOriginal > 0 ? (lastMonthRecovered / lastMonthOriginal) * 100 : 0;
    const recoveryTrend = thisMonthRate - lastMonthRate;

    // SLA trend (simplified - just show if above 90%)
    const slaTrend = slaCompliance >= 90 ? 0 : slaCompliance - 90;

    return {
        metrics: {
            totalCases: allCases.length,
            activeDCAs: activeDCAs.length,
            recoveryRate,
            slaCompliance: Math.min(slaCompliance, 100),
            pendingCases,
            totalRecovered,
            totalOutstanding,
            trends: {
                casesTrend: Math.round(casesTrend * 10) / 10,
                dcasTrend: 0, // DCAs don't change frequently
                recoveryTrend: Math.round(recoveryTrend * 10) / 10,
                slaTrend: Math.round(slaTrend * 10) / 10,
            },
        },
        recentCases: allCases.slice(0, 5).map(c => ({
            id: c.id,
            case_number: c.case_number,
            customer_name: c.customer_name,
            outstanding_amount: c.outstanding_amount,
            status: c.status,
            priority: c.priority,
            created_at: c.created_at,
        })),
    };
}

export default async function DashboardPage() {
    const { metrics, recentCases } = await getDashboardData();

    return (
        <div className="space-y-6">
            {/* SLA Breach Alerts */}
            <SLABreachAlerts />

            {/* AI/ML Insights */}
            <MLInsightsPanel />

            {/* Welcome Banner - Dark gray in dark mode */}
            <div className="bg-gradient-to-r from-primary via-primary-600 to-accent dark:from-[#111] dark:via-[#111] dark:to-[#111] rounded-2xl p-6 text-white shadow-lg dark:border dark:border-[#222]">
                <h2 className="text-2xl font-bold mb-2">
                    Welcome to FedEx DCA Control Tower
                </h2>
                <p className="text-white/80 dark:text-gray-400">
                    Monitor debt collection performance, track SLA compliance, and manage DCA relationships.
                </p>
            </div>

            {/* Stats Grid - Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<CasesIcon />}
                    value={metrics.totalCases.toString()}
                    title="Total Cases"
                    subtitle="Active debt cases"
                    trend={metrics.trends.casesTrend !== 0
                        ? `${metrics.trends.casesTrend > 0 ? '+' : ''}${metrics.trends.casesTrend}% from last month`
                        : 'No change'}
                    trendUp={metrics.trends.casesTrend > 0 ? true : metrics.trends.casesTrend < 0 ? false : null}
                />
                <MetricCard
                    icon={<BuildingIcon />}
                    value={metrics.activeDCAs.toString()}
                    title="Active DCAs"
                    subtitle="Collection agencies"
                    trend={`${metrics.activeDCAs} pending approval`}
                    trendUp={null}
                />
                <MetricCard
                    icon={<ChartIcon />}
                    value={`${metrics.recoveryRate.toFixed(1)}%`}
                    title="Recovery Rate"
                    subtitle="Average across all DCAs"
                    trend={metrics.trends.recoveryTrend !== 0
                        ? `${metrics.trends.recoveryTrend > 0 ? '+' : ''}${metrics.trends.recoveryTrend}% from last quarter`
                        : 'Stable'}
                    trendUp={metrics.trends.recoveryTrend > 0 ? true : metrics.trends.recoveryTrend < 0 ? false : null}
                />
                <MetricCard
                    icon={<CheckIcon />}
                    value={`${metrics.slaCompliance.toFixed(1)}%`}
                    title="SLA Compliance"
                    subtitle="On-time performance"
                    trend={metrics.slaCompliance >= 90 ? 'Above 90% target' : `${(90 - metrics.slaCompliance).toFixed(1)}% below target`}
                    trendUp={metrics.slaCompliance >= 90}
                />
            </div>

            {/* Secondary Stats - Centered layout with icons on right */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SecondaryStatCard
                    title="Pending Cases"
                    value={metrics.pendingCases.toString()}
                    icon={<HourglassIcon />}
                />
                <SecondaryStatCard
                    title="Total Recovered"
                    value={`$${metrics.totalRecovered.toLocaleString()}`}
                    valueColor="text-green-400"
                    icon={<DollarIcon />}
                />
                <SecondaryStatCard
                    title="Outstanding Amount"
                    value={`$${metrics.totalOutstanding.toLocaleString()}`}
                    icon={<BarChartIcon />}
                />
            </div>

            {/* Recent Cases Table */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Cases</h3>
                    <a href="/cases" className="text-sm text-primary font-medium hover:underline">
                        View all →
                    </a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                    Case #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                    Priority
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                            {recentCases.map((caseItem) => (
                                <tr key={caseItem.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                                    <td className="px-6 py-4">
                                        <a href={`/cases/${caseItem.id}`} className="text-sm font-medium text-primary hover:underline">
                                            {caseItem.case_number}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                                        {caseItem.customer_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">
                                        ${caseItem.outstanding_amount?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={caseItem.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <PriorityBadge priority={caseItem.priority} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/cases" className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-primary/5 dark:hover:bg-[#222] border border-transparent dark:border-[#222] transition-all">
                        <span className="text-2xl mb-2">📁</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Cases</span>
                    </a>
                    <a href="/dcas" className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-primary/5 dark:hover:bg-[#222] border border-transparent dark:border-[#222] transition-all">
                        <span className="text-2xl mb-2">🏢</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage DCAs</span>
                    </a>
                    <a href="/analytics" className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-primary/5 dark:hover:bg-[#222] border border-transparent dark:border-[#222] transition-all">
                        <span className="text-2xl mb-2">📊</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analytics</span>
                    </a>
                    <a href="/settings" className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-primary/5 dark:hover:bg-[#222] border border-transparent dark:border-[#222] transition-all">
                        <span className="text-2xl mb-2">⚙️</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
                    </a>
                </div>
            </div>
        </div>
    );
}

// Primary Metric Card Component - Matches reference design exactly
function MetricCard({
    icon,
    value,
    title,
    subtitle,
    trend,
    trendUp,
}: {
    icon: React.ReactNode;
    value: string;
    title: string;
    subtitle: string;
    trend: string;
    trendUp: boolean | null;
}) {
    return (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
            {/* Top row: Icon left, Trend badge right */}
            <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${trendUp === true
                            ? 'bg-green-500/10 text-green-400 border-green-500/30'
                            : trendUp === false
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-[#1a1a1a] text-gray-400 border-[#333]'
                        }`}>
                        {trend}
                    </span>
                )}
            </div>
            {/* Value */}
            <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            {/* Title */}
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
            {/* Subtitle */}
            <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
        </div>
    );
}

// Secondary Stat Card - Title top, value center, icon right
function SecondaryStatCard({
    title,
    value,
    icon,
    valueColor = 'text-gray-900 dark:text-white',
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    valueColor?: string;
}) {
    return (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{title}</p>
                    <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Icons matching the reference design
function CasesIcon() {
    return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function BuildingIcon() {
    return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}

function ChartIcon() {
    return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function HourglassIcon() {
    return (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function DollarIcon() {
    return (
        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function BarChartIcon() {
    return (
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        PENDING_ALLOCATION: { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400', label: 'Pending' },
        ALLOCATED: { bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-400', label: 'Allocated' },
        IN_PROGRESS: { bg: 'bg-purple-500/20 border-purple-500/30', text: 'text-purple-400', label: 'In Progress' },
        CUSTOMER_CONTACTED: { bg: 'bg-indigo-500/20 border-indigo-500/30', text: 'text-indigo-400', label: 'Contacted' },
        PAYMENT_PROMISED: { bg: 'bg-cyan-500/20 border-cyan-500/30', text: 'text-cyan-400', label: 'Payment Promised' },
        PARTIAL_RECOVERY: { bg: 'bg-orange-500/20 border-orange-500/30', text: 'text-orange-400', label: 'Partial' },
        FULL_RECOVERY: { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-400', label: 'Recovered' },
        DISPUTED: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', label: 'Disputed' },
        ESCALATED: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', label: 'Escalated' },
        CLOSED: { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-400', label: 'Closed' },
    };

    const config = statusConfig[status] ?? { bg: 'bg-gray-500/20 border-gray-500/30', text: 'text-gray-400', label: status };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const priorityConfig: Record<string, { color: string; dot: string }> = {
        CRITICAL: { color: 'text-red-400', dot: 'bg-red-400' },
        HIGH: { color: 'text-orange-400', dot: 'bg-orange-400' },
        MEDIUM: { color: 'text-yellow-400', dot: 'bg-yellow-400' },
        LOW: { color: 'text-green-400', dot: 'bg-green-400' },
    };

    const config = priorityConfig[priority] ?? { color: 'text-gray-400', dot: 'bg-gray-400' };

    return (
        <span className={`inline-flex items-center text-xs font-medium ${config.color}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot} mr-2`}></span>
            {priority}
        </span>
    );
}
