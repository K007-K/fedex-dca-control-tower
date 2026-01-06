'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * DCA_ADMIN Notifications Page
 * 
 * Per MASTER UI SPEC:
 * - Escalations from managers
 * - SLA breach alerts
 * - DCA-level warnings
 */

interface Notification {
    id: string;
    type: 'escalation' | 'sla_breach' | 'sla_warning' | 'system';
    title: string;
    message: string;
    case_id?: string;
    case_number?: string;
    from_user?: string;
    created_at: string;
    is_read: boolean;
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/api/admin/notifications');
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.notifications || []);
                }
            } catch (e) {
                console.error('Failed to fetch notifications:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'escalation': return '🔔';
            case 'sla_breach': return '🚨';
            case 'sla_warning': return '⚠️';
            default: return '📢';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'escalation': return { label: 'Escalation', color: 'bg-orange-100 text-orange-700' };
            case 'sla_breach': return { label: 'SLA Breach', color: 'bg-red-100 text-red-700' };
            case 'sla_warning': return { label: 'SLA Warning', color: 'bg-yellow-100 text-yellow-700' };
            default: return { label: 'System', color: 'bg-gray-100 text-gray-700' };
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Escalations, SLA alerts, and DCA warnings
                        {unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                {unreadCount} unread
                            </span>
                        )}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="text-sm text-primary hover:underline">
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300'
                        }`}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">🔔</div>
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-[#222]">
                        {filteredNotifications.map((notification) => {
                            const typeInfo = getTypeLabel(notification.type);
                            return (
                                <div
                                    key={notification.id}
                                    className={`px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${!notification.is_read ? 'bg-primary/5' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-2xl">{getIcon(notification.type)}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                                {!notification.is_read && (
                                                    <span className="w-2 h-2 bg-primary rounded-full" />
                                                )}
                                                <span className="text-xs text-gray-400 ml-auto">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{notification.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                                            {notification.case_number && (
                                                <Link
                                                    href={`/admin/cases/${notification.case_id}`}
                                                    className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                                >
                                                    View Case {notification.case_number} →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
