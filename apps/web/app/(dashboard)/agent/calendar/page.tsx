'use client';

/**
 * Agent Calendar Page
 * 
 * PURPOSE: View and manage scheduled callbacks
 * SCOPE: Only this agent's callbacks
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Callback {
    id: string;
    case_id: string;
    case_number: string;
    customer_name: string;
    scheduled_for: string;
    notes?: string;
    status: string;
}

export default function AgentCalendarPage() {
    const [callbacks, setCallbacks] = useState<Callback[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'today' | 'week' | 'all'>('today');

    const fetchCallbacks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/agent/calendar?view=${view}`);
            if (res.ok) {
                const data = await res.json();
                setCallbacks(data.callbacks || []);
            }
        } catch (e) {
            console.error('Calendar fetch error:', e);
        } finally {
            setIsLoading(false);
        }
    }, [view]);

    useEffect(() => {
        fetchCallbacks();
    }, [fetchCallbacks]);

    const markCompleted = async (id: string) => {
        try {
            await fetch(`/api/agent/calendar/${id}/complete`, { method: 'POST' });
            fetchCallbacks();
        } catch (e) {
            console.error('Complete callback error:', e);
        }
    };

    const now = new Date();
    const todayCallbacks = callbacks.filter(c => {
        const date = new Date(c.scheduled_for);
        return date.toDateString() === now.toDateString() && c.status === 'PENDING';
    });

    const overdueCallbacks = callbacks.filter(c => {
        const date = new Date(c.scheduled_for);
        return date < now && c.status === 'PENDING';
    });

    const upcomingCallbacks = callbacks.filter(c => {
        const date = new Date(c.scheduled_for);
        return date > now && c.status === 'PENDING';
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Calendar</h1>
                    <p className="text-gray-500 dark:text-gray-400">Scheduled callbacks and reminders</p>
                </div>
                <div className="flex items-center gap-2">
                    {['today', 'week', 'all'].map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v as typeof view)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === v
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]'
                                }`}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    label="Today"
                    value={todayCallbacks.length}
                    icon="📅"
                    color="blue"
                />
                <StatCard
                    label="Overdue"
                    value={overdueCallbacks.length}
                    icon="⚠️"
                    color="red"
                />
                <StatCard
                    label="Upcoming"
                    value={upcomingCallbacks.length}
                    icon="🔜"
                    color="green"
                />
            </div>

            {/* Callbacks List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading calendar...</p>
                    </div>
                ) : callbacks.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">📅</div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No scheduled callbacks
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Schedule callbacks from case detail pages
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-[#222]">
                        {/* Overdue Section */}
                        {overdueCallbacks.length > 0 && (
                            <div>
                                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-900/30">
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                        ⚠️ Overdue ({overdueCallbacks.length})
                                    </p>
                                </div>
                                {overdueCallbacks.map((callback) => (
                                    <CallbackItem
                                        key={callback.id}
                                        callback={callback}
                                        onComplete={() => markCompleted(callback.id)}
                                        isOverdue
                                    />
                                ))}
                            </div>
                        )}

                        {/* Today Section */}
                        {todayCallbacks.length > 0 && (
                            <div>
                                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-900/30">
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                        📅 Today ({todayCallbacks.length})
                                    </p>
                                </div>
                                {todayCallbacks.map((callback) => (
                                    <CallbackItem
                                        key={callback.id}
                                        callback={callback}
                                        onComplete={() => markCompleted(callback.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Upcoming Section */}
                        {upcomingCallbacks.length > 0 && (
                            <div>
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/10 border-b border-gray-200 dark:border-gray-800">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        🔜 Upcoming ({upcomingCallbacks.length})
                                    </p>
                                </div>
                                {upcomingCallbacks.map((callback) => (
                                    <CallbackItem
                                        key={callback.id}
                                        callback={callback}
                                        onComplete={() => markCompleted(callback.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: {
    label: string;
    value: number;
    icon: string;
    color: 'blue' | 'red' | 'green';
}) {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    };

    return (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center text-lg`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function CallbackItem({ callback, onComplete, isOverdue }: {
    callback: Callback;
    onComplete: () => void;
    isOverdue?: boolean;
}) {
    const scheduledDate = new Date(callback.scheduled_for);

    return (
        <div className={`p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/5' : ''
            }`}>
            <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/agent/cases/${callback.case_id}`}
                            className="font-medium text-primary hover:underline"
                        >
                            {callback.case_number}
                        </Link>
                        <span className="text-gray-400">·</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {callback.customer_name}
                        </span>
                    </div>
                    {callback.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {callback.notes}
                        </p>
                    )}
                    <p className={`text-sm mt-1 ${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isOverdue ? '⚠️ ' : ''}
                        {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/agent/cases/${callback.case_id}`}
                        className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Call Now
                    </Link>
                    <button
                        onClick={onComplete}
                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-[#333] rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
