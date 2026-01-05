'use client';

/**
 * Agent Case Timeline Page
 * 
 * PURPOSE: Full activity log for a case
 * SCOPE: Only for cases assigned to the current agent
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Activity {
    id: string;
    activity_type: string;
    description: string;
    created_at: string;
    created_by_name: string;
    metadata?: Record<string, unknown>;
}

export default function AgentCaseTimelinePage() {
    const params = useParams();
    const caseId = params.id as string;

    const [activities, setActivities] = useState<Activity[]>([]);
    const [caseNumber, setCaseNumber] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/agent/cases/${caseId}`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities || []);
                setCaseNumber(data.case?.case_number || '');
            } else if (res.status === 403) {
                setError('This case is not assigned to you.');
            } else {
                setError('Failed to load timeline.');
            }
        } catch {
            setError('Failed to connect to server.');
        } finally {
            setIsLoading(false);
        }
    }, [caseId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading timeline...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <Link href="/agent/cases" className="text-primary hover:underline">
                        ← Back to My Cases
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href={`/agent/cases/${caseId}`} className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
                    ← Back to Case
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Timeline</h1>
                <p className="text-gray-500 dark:text-gray-400">{caseNumber}</p>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                {activities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">📋</div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No activity recorded
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Activities will appear here as you work on this case.
                        </p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

                        <div className="space-y-6">
                            {activities.map((activity, index) => (
                                <div key={activity.id} className="relative pl-10">
                                    {/* Timeline dot */}
                                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 bg-white dark:bg-[#111] ${getActivityDotColor(activity.activity_type)}`} />

                                    <div className={`p-4 rounded-lg ${index === 0 ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30' : 'bg-gray-50 dark:bg-[#1a1a1a]'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {getActivityLabel(activity.activity_type)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {formatDateTime(activity.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                            by {activity.created_by_name}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function getActivityIcon(type: string): string {
    switch (type) {
        case 'CONTACT_ATTEMPT': return '📞';
        case 'NOTE': return '📝';
        case 'PAYMENT': return '💰';
        case 'STATUS_CHANGE': return '📋';
        case 'ESCALATION': return '⬆️';
        case 'DOCUMENT': return '📎';
        case 'ASSIGNMENT': return '👤';
        default: return '📌';
    }
}

function getActivityLabel(type: string): string {
    switch (type) {
        case 'CONTACT_ATTEMPT': return 'Contact Attempt';
        case 'NOTE': return 'Note Added';
        case 'PAYMENT': return 'Payment Recorded';
        case 'STATUS_CHANGE': return 'Status Changed';
        case 'ESCALATION': return 'Escalated';
        case 'DOCUMENT': return 'Document Uploaded';
        case 'ASSIGNMENT': return 'Case Assigned';
        default: return 'Activity';
    }
}

function getActivityDotColor(type: string): string {
    switch (type) {
        case 'PAYMENT': return 'border-green-500';
        case 'STATUS_CHANGE': return 'border-blue-500';
        case 'ESCALATION': return 'border-red-500';
        case 'CONTACT_ATTEMPT': return 'border-purple-500';
        default: return 'border-gray-400';
    }
}

function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
