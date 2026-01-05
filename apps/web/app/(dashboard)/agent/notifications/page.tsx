'use client';

/**
 * Agent Notifications Page
 * 
 * PURPOSE: Show notifications relevant to the agent
 * SCOPE: Only notifications for this agent's cases
 * 
 * Types shown:
 * - Case assigned
 * - SLA due soon
 * - SLA breached
 * - Callback reminders
 * - Payment received
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Notification {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    case_id?: string;
    case_number?: string;
    is_read: boolean;
    created_at: string;
}

export default function AgentNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/agent/notifications?filter=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (e) {
            console.error('Notifications fetch error:', e);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/agent/notifications/${id}/read`, { method: 'POST' });
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (e) {
            console.error('Mark read error:', e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/agent/notifications/read-all', { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (e) {
            console.error('Mark all read error:', e);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                        className="h-10 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] px-3 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="unread">Unread Only</option>
                    </select>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 text-sm text-primary hover:underline"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">🔔</div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No notifications
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            You&apos;re all caught up!
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-[#222]">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkRead={() => markAsRead(notification.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function NotificationItem({ notification, onMarkRead }: {
    notification: Notification;
    onMarkRead: () => void;
}) {
    const icon = getNotificationIcon(notification.notification_type);
    const color = getNotificationColor(notification.notification_type);

    return (
        <div
            className={`p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
        >
            <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-lg`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className={`font-medium ${notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {notification.message}
                            </p>
                        </div>
                        {!notification.is_read && (
                            <button
                                onClick={onMarkRead}
                                className="text-xs text-primary hover:underline whitespace-nowrap"
                            >
                                Mark read
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">
                            {formatRelativeTime(notification.created_at)}
                        </span>
                        {notification.case_number && (
                            <Link
                                href={`/agent/cases/${notification.case_id}`}
                                className="text-xs text-primary hover:underline"
                            >
                                {notification.case_number}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getNotificationIcon(type: string): string {
    switch (type) {
        case 'CASE_ASSIGNED': return '📋';
        case 'SLA_DUE_SOON': return '⏰';
        case 'SLA_BREACHED': return '🔴';
        case 'CALLBACK_REMINDER': return '📞';
        case 'PAYMENT_RECEIVED': return '💰';
        case 'ESCALATION_UPDATE': return '⬆️';
        default: return '🔔';
    }
}

function getNotificationColor(type: string): string {
    switch (type) {
        case 'SLA_BREACHED': return 'bg-red-100 dark:bg-red-900/20';
        case 'SLA_DUE_SOON': return 'bg-yellow-100 dark:bg-yellow-900/20';
        case 'PAYMENT_RECEIVED': return 'bg-green-100 dark:bg-green-900/20';
        case 'CASE_ASSIGNED': return 'bg-blue-100 dark:bg-blue-900/20';
        default: return 'bg-gray-100 dark:bg-gray-800';
    }
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
