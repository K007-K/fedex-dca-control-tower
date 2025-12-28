'use client';

import Link from 'next/link';

interface Escalation {
    id: string;
    escalation_type: string;
    title: string;
    severity: string;
    status: string;
    escalated_at: string;
    resolved_at: string | null;
}

const severityColors: Record<string, { bg: string; text: string }> = {
    LOW: { bg: 'bg-gray-100', text: 'text-gray-600' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-700' },
};

const statusColors: Record<string, { bg: string; text: string }> = {
    OPEN: { bg: 'bg-red-100', text: 'text-red-700' },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
    RESOLVED: { bg: 'bg-green-100', text: 'text-green-700' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const typeLabels: Record<string, string> = {
    SLA_BREACH: 'SLA Breach',
    REPEATED_BREACH: 'Repeated Breach',
    NO_PROGRESS: 'No Progress',
    CUSTOMER_COMPLAINT: 'Customer Complaint',
    DCA_PERFORMANCE: 'DCA Performance',
    HIGH_VALUE: 'High Value',
    FRAUD_SUSPECTED: 'Fraud Suspected',
    LEGAL_REQUIRED: 'Legal Required',
    MANUAL: 'Manual',
};

interface EscalationListProps {
    escalations: Escalation[];
}

export function EscalationList({ escalations }: EscalationListProps) {
    if (!escalations || escalations.length === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-gray-500">No escalations for this case.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {escalations.map((escalation) => {
                const severity = severityColors[escalation.severity] || severityColors.MEDIUM;
                const status = statusColors[escalation.status] || statusColors.OPEN;

                return (
                    <div
                        key={escalation.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severity.bg} ${severity.text}`}>
                                    {escalation.severity}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                                    {escalation.status}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">
                                {typeLabels[escalation.escalation_type] || escalation.escalation_type}
                            </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{escalation.title}</h4>
                        <p className="text-xs text-gray-500">
                            Escalated: {new Date(escalation.escalated_at).toLocaleDateString()}
                            {escalation.resolved_at && (
                                <> • Resolved: {new Date(escalation.resolved_at).toLocaleDateString()}</>
                            )}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
