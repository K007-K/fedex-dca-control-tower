import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';

type SLATemplate = {
    id: string;
    name: string;
    sla_type: string;
    description: string;
    duration_hours: number;
    business_hours_only: boolean;
    is_active: boolean;
    auto_escalate_on_breach: boolean;
};

type SLALog = {
    id: string;
    sla_type: string;
    status: string;
    started_at: string;
    due_at: string;
    completed_at: string | null;
    breach_duration_minutes: number | null;
    case_id: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-500/20 border border-yellow-500/30', text: 'text-yellow-400' },
    MET: { bg: 'bg-green-500/20 border border-green-500/30', text: 'text-green-400' },
    BREACHED: { bg: 'bg-red-500/20 border border-red-500/30', text: 'text-red-400' },
    EXEMPT: { bg: 'bg-gray-500/20 border border-gray-500/30', text: 'text-gray-400' },
};

const SLA_TYPE_LABELS: Record<string, { label: string; description: string }> = {
    FIRST_CONTACT: {
        label: 'First Contact',
        description: 'Time limit for DCA to make initial contact with the customer after case assignment'
    },
    WEEKLY_UPDATE: {
        label: 'Weekly Update',
        description: 'Regular weekly status update required on all active cases'
    },
    MONTHLY_REPORT: {
        label: 'Monthly Report',
        description: 'Monthly performance and portfolio report submission deadline'
    },
    RESPONSE_TO_DISPUTE: {
        label: 'Dispute Response',
        description: 'Time limit to respond when a customer raises a dispute'
    },
    RECOVERY_TARGET: {
        label: 'Recovery Target',
        description: 'Target deadline for achieving full or partial recovery'
    },
    DOCUMENTATION_SUBMISSION: {
        label: 'Documentation',
        description: 'Deadline for submitting required documentation'
    },
};

export default async function SLAPage() {
    const supabase = await createClient();

    // Fetch SLA templates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: templates } = await (supabase as any)
        .from('sla_templates')
        .select('*')
        .order('name');

    // Fetch recent SLA logs with breach info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentLogs } = await (supabase as any)
        .from('sla_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    // Calculate metrics
    const activeTemplates = templates?.filter((t: SLATemplate) => t.is_active).length || 0;
    const pendingCount = recentLogs?.filter((l: SLALog) => l.status === 'PENDING').length || 0;
    const breachedCount = recentLogs?.filter((l: SLALog) => l.status === 'BREACHED').length || 0;
    const complianceRate = recentLogs?.length
        ? ((recentLogs.filter((l: SLALog) => l.status === 'MET').length / recentLogs.length) * 100).toFixed(1)
        : '100';

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SLA Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Monitor SLA compliance and manage templates</p>
                </div>
                <Link
                    href="/sla/new"
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    + New SLA Template
                </Link>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Templates</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeTemplates}</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pending SLAs</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Breached</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{breachedCount}</p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Compliance Rate</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{complianceRate}%</p>
                </div>
            </div>

            {/* SLA Templates */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SLA Templates</h2>
                {templates && templates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template: SLATemplate) => (
                            <div
                                key={template.id}
                                className="border border-gray-200 dark:border-[#222] rounded-lg p-4 hover:border-gray-300 dark:hover:border-[#333] hover:shadow-sm transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 mt-1">
                                            {SLA_TYPE_LABELS[template.sla_type]?.label || template.sla_type}
                                        </span>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${template.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}>
                                        {template.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.description || 'No description'}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        ⏱️ {template.duration_hours}h {template.business_hours_only ? '(business)' : ''}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        {template.auto_escalate_on_breach && (
                                            <span className="text-amber-600 dark:text-amber-400">⚡ Auto-escalate</span>
                                        )}
                                        <Link
                                            href={`/sla/${template.id}/edit`}
                                            className="text-gray-600 dark:text-gray-300 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">⏱️</div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No SLA Templates</h3>
                        <p className="text-gray-500 dark:text-gray-400">Create your first SLA template to start monitoring compliance.</p>
                    </div>
                )}
            </div>

            {/* Recent SLA Activity */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent SLA Activity</h2>
                    <Link href="#" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">View All →</Link>
                </div>
                {recentLogs && recentLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[#222]">
                                    <th className="pb-3 font-medium">Type</th>
                                    <th className="pb-3 font-medium">Case</th>
                                    <th className="pb-3 font-medium">Due</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Breach Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs.map((log: SLALog) => {
                                    const statusColor = STATUS_COLORS[log.status] || { bg: 'bg-gray-500/20 border border-gray-500/30', text: 'text-gray-400' };
                                    const dueDate = new Date(log.due_at);
                                    const isOverdue = log.status === 'PENDING' && dueDate < new Date();

                                    return (
                                        <tr key={log.id} className="border-b border-gray-50 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                            <td className="py-3">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {SLA_TYPE_LABELS[log.sla_type]?.label || log.sla_type}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <Link
                                                    href={`/cases/${log.case_id}`}
                                                    className="text-gray-600 dark:text-gray-300 hover:underline"
                                                >
                                                    View Case
                                                </Link>
                                            </td>
                                            <td className="py-3">
                                                <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-300'}>
                                                    {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-gray-600 dark:text-gray-300">
                                                {log.breach_duration_minutes
                                                    ? `${Math.floor(log.breach_duration_minutes / 60)}h ${log.breach_duration_minutes % 60}m`
                                                    : '-'
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No SLA activity recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
