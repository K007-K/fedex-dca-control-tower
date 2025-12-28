'use client';

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface AnalyticsChartsProps {
    recoveryTrend: { month: string; recovered: number; target: number }[];
    dcaPerformance: { name: string; score: number; recoveryRate: number; slaCompliance: number }[];
    casesByStatus: { status: string; count: number }[];
    casesByPriority: { priority: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_ALLOCATION: '#f59e0b',
    ALLOCATED: '#3b82f6',
    IN_PROGRESS: '#8b5cf6',
    CUSTOMER_CONTACTED: '#10b981',
    PAYMENT_PROMISED: '#06b6d4',
    PARTIAL_RECOVERY: '#22c55e',
    FULL_RECOVERY: '#059669',
    DISPUTED: '#ef4444',
    ESCALATED: '#dc2626',
    CLOSED: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
};

export function AnalyticsCharts({
    recoveryTrend,
    dcaPerformance,
    casesByStatus,
    casesByPriority,
}: AnalyticsChartsProps) {
    return (
        <div className="space-y-6">
            {/* Top Row - Line and Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recovery Trend Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Trend</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={recoveryTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={(v) => `$${v / 1000}K`} />
                                <Tooltip
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                    contentStyle={{ borderRadius: 8 }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="recovered"
                                    name="Recovered"
                                    stroke="#4F46E5"
                                    strokeWidth={2}
                                    dot={{ fill: '#4F46E5' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    name="Target"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ fill: '#10b981' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* DCA Performance Comparison */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">DCA Performance Comparison</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dcaPerformance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="#6b7280" />
                                <Tooltip contentStyle={{ borderRadius: 8 }} />
                                <Legend />
                                <Bar dataKey="score" name="Score" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="recoveryRate" name="Recovery %" fill="#10b981" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="slaCompliance" name="SLA %" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cases by Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Cases by Status</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={casesByStatus}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ status, count }) => `${status.replace('_', ' ')}: ${count}`}
                                    labelLine={false}
                                >
                                    {casesByStatus.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.status] || '#6b7280'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string) => [value, name.replace('_', ' ')]}
                                    contentStyle={{ borderRadius: 8 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cases by Priority */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Cases by Priority</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={casesByPriority}
                                    dataKey="count"
                                    nameKey="priority"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    label={({ priority, count }) => `${priority}: ${count}`}
                                    labelLine={false}
                                >
                                    {casesByPriority.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PRIORITY_COLORS[entry.priority] || '#6b7280'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8 }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
