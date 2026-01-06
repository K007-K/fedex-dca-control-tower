'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Manager Case Detail Page
 * 
 * Shows case details with:
 * - Case information and SLA status
 * - Activity timeline
 * - Reassign to another agent
 * - Escalate to DCA Admin
 */

interface Agent {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

interface Activity {
    id: string;
    activity_type: string;
    description: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    created_by_name: string;
}

interface SLAInfo {
    sla_type: string;
    status: string;
    due_at: string;
    hours_remaining: number;
    is_breached: boolean;
    is_at_risk: boolean;
}

interface CaseData {
    id: string;
    case_number: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    status: string;
    outstanding_amount: number;
    currency: string;
    assigned_agent_id: string;
    created_at: string;
    updated_at: string;
    escalated_by_manager?: boolean;
    escalated_reason?: string;
    agent?: Agent;
}

export default function ManagerCaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const caseId = params.id as string;

    const [caseData, setCaseData] = useState<CaseData | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [sla, setSla] = useState<SLAInfo | null>(null);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [escalationReason, setEscalationReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [activityTab, setActivityTab] = useState<'all' | 'status' | 'payments' | 'notes'>('all');

    useEffect(() => {
        const fetchCase = async () => {
            try {
                const res = await fetch(`/api/manager/cases/${caseId}`);
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to load case');
                }
                const data = await res.json();
                setCaseData(data.case);
                setActivities(data.activities || []);
                setSla(data.sla);
                setAgents(data.agents || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        };
        fetchCase();
    }, [caseId]);

    const handleReassign = async () => {
        if (!selectedAgent) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/manager/cases/${caseId}/reassign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_agent_id: selectedAgent }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Reassignment failed');
            }
            setShowReassignModal(false);
            router.refresh();
            window.location.reload();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Reassignment failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEscalate = async () => {
        if (!escalationReason.trim()) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/manager/cases/${caseId}/escalate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: escalationReason, priority: 'HIGH' }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Escalation failed');
            }
            setShowEscalateModal(false);
            router.refresh();
            window.location.reload();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Escalation failed');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'ALLOCATED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'IN_PROGRESS': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'CUSTOMER_CONTACTED': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
            'PAYMENT_PROMISED': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            'PARTIAL_PAYMENT': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'DISPUTED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'FULL_RECOVERY': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    };

    const getActivityIcon = (type: string) => {
        const icons: Record<string, string> = {
            'STATUS_CHANGE': '🔄',
            'CONTACT_ATTEMPT': '📞',
            'PAYMENT': '💰',
            'NOTE': '📝',
            'ESCALATED': '⚠️',
            'REASSIGNED': '👤',
            'CALLBACK_SCHEDULED': '📅',
        };
        return icons[type] || '•';
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHrs / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHrs > 0) return `${diffHrs}h ago`;
        return 'Just now';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
                    <div className="h-64 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div className="space-y-4">
                <Link href="/manager/cases" className="text-sm text-primary hover:underline">
                    ← Back to Team Cases
                </Link>
                <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                    {error || 'Case not found'}
                </div>
            </div>
        );
    }

    const currentAgent = caseData.agent;
    const otherAgents = agents.filter(a => a.id !== caseData.assigned_agent_id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/manager/cases" className="text-sm text-primary hover:underline mb-2 inline-block">
                        ← Back to Team Cases
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {caseData.case_number}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">{caseData.customer_name}</p>
                </div>
                <div className="flex gap-2">
                    {!caseData.escalated_by_manager && (
                        <>
                            <button
                                onClick={() => setShowReassignModal(true)}
                                className="px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#222] transition-colors text-sm font-medium"
                            >
                                Reassign
                            </button>
                            <button
                                onClick={() => setShowEscalateModal(true)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                            >
                                Escalate to Admin
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Escalated Notice */}
            {caseData.escalated_by_manager && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                        ⚠️ This case has been escalated to DCA Admin
                    </p>
                    {caseData.escalated_reason && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                            Reason: {caseData.escalated_reason}
                        </p>
                    )}
                </div>
            )}

            {/* SLA Section */}
            {sla && (
                <div className={`p-4 rounded-xl border ${sla.is_breached
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : sla.is_at_risk
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                SLA: {sla.sla_type?.replace(/_/g, ' ') || 'Standard'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Due: {new Date(sla.due_at).toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            {sla.is_breached ? (
                                <span className="text-red-600 dark:text-red-400 font-bold text-lg">
                                    ⚠️ BREACHED
                                </span>
                            ) : sla.is_at_risk ? (
                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                    ⏱️ {Math.round(sla.hours_remaining)}h remaining
                                </span>
                            ) : (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                    ✓ On Track ({Math.round(sla.hours_remaining)}h)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Case Details & Agent */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Case Information
                        </h3>
                        <dl className="space-y-3">
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                                <dd>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(caseData.status)}`}>
                                        {caseData.status.replace(/_/g, ' ')}
                                    </span>
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Outstanding</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">
                                    ₹{caseData.outstanding_amount?.toLocaleString('en-IN') || '0'}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                                <dd className="text-gray-900 dark:text-white">
                                    {new Date(caseData.created_at).toLocaleDateString()}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500 dark:text-gray-400">Last Updated</dt>
                                <dd className="text-gray-900 dark:text-white">
                                    {new Date(caseData.updated_at).toLocaleDateString()}
                                </dd>
                            </div>
                            {caseData.customer_phone && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500 dark:text-gray-400">Customer Phone</dt>
                                    <dd className="text-gray-900 dark:text-white">{caseData.customer_phone}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Assigned Agent
                        </h3>
                        {currentAgent ? (
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                    <span className="text-lg font-medium text-yellow-600">
                                        {currentAgent.name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {currentAgent.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {currentAgent.email}
                                    </p>
                                    {currentAgent.phone && (
                                        <p className="text-xs text-gray-400 mt-1">{currentAgent.phone}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Unassigned</p>
                        )}
                    </div>
                </div>

                {/* Activity Timeline - Tabbed */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Activity Timeline
                    </h3>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
                        <button
                            onClick={() => setActivityTab('all')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activityTab === 'all'
                                ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            All ({activities.length})
                        </button>
                        <button
                            onClick={() => setActivityTab('status')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activityTab === 'status'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Status ({activities.filter(a => a.activity_type === 'STATUS_CHANGE' || a.activity_type === 'ESCALATED' || a.activity_type === 'REASSIGNED').length})
                        </button>
                        <button
                            onClick={() => setActivityTab('payments')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activityTab === 'payments'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Payments ({activities.filter(a => a.activity_type === 'PAYMENT').length})
                        </button>
                        <button
                            onClick={() => setActivityTab('notes')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activityTab === 'notes'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Notes ({activities.filter(a => a.activity_type === 'NOTE' || a.activity_type === 'CONTACT_ATTEMPT' || a.activity_type === 'CALLBACK_SCHEDULED').length})
                        </button>
                    </div>

                    {/* Filtered Activities */}
                    {(() => {
                        const filteredActivities = activities.filter(activity => {
                            if (activityTab === 'all') return true;
                            if (activityTab === 'status') {
                                return ['STATUS_CHANGE', 'ESCALATED', 'REASSIGNED'].includes(activity.activity_type);
                            }
                            if (activityTab === 'payments') {
                                return activity.activity_type === 'PAYMENT';
                            }
                            if (activityTab === 'notes') {
                                return ['NOTE', 'CONTACT_ATTEMPT', 'CALLBACK_SCHEDULED'].includes(activity.activity_type);
                            }
                            return true;
                        });

                        return filteredActivities.length > 0 ? (
                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                {filteredActivities.map((activity) => (
                                    <div key={activity.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${activity.activity_type === 'STATUS_CHANGE' || activity.activity_type === 'ESCALATED' || activity.activity_type === 'REASSIGNED'
                                            ? 'bg-purple-100 dark:bg-purple-900/30'
                                            : activity.activity_type === 'PAYMENT'
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-blue-100 dark:bg-blue-900/30'
                                            }`}>
                                            {getActivityIcon(activity.activity_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${activity.activity_type === 'STATUS_CHANGE' || activity.activity_type === 'ESCALATED' || activity.activity_type === 'REASSIGNED'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : activity.activity_type === 'PAYMENT'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {activity.activity_type.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatTimeAgo(activity.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                by {activity.created_by_name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                No {activityTab === 'all' ? 'activities' : activityTab} recorded yet
                            </p>
                        );
                    })()}
                </div>
            </div>

            {/* Reassign Modal */}
            {showReassignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#111] rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Reassign Case
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Select an agent to reassign this case to:
                        </p>
                        <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white mb-4"
                        >
                            <option value="">Select Agent</option>
                            {otherAgents.map((agent) => (
                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowReassignModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReassign}
                                disabled={!selectedAgent || actionLoading}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                            >
                                {actionLoading ? 'Reassigning...' : 'Reassign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Escalate Modal */}
            {showEscalateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#111] rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Escalate to DCA Admin
                        </h3>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
                            ⚠️ This will lock agent actions on this case until admin resolution.
                        </p>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Reason for escalation *
                        </label>
                        <textarea
                            value={escalationReason}
                            onChange={(e) => setEscalationReason(e.target.value)}
                            placeholder="Describe why this case needs admin attention..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 dark:border-[#222] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowEscalateModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEscalate}
                                disabled={!escalationReason.trim() || actionLoading}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                                {actionLoading ? 'Escalating...' : 'Escalate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
