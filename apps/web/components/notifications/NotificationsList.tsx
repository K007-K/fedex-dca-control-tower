'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface Notification {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    action_url: string | null;
    is_read: boolean;
    priority: string;
    created_at: string;
    related_case_id: string | null;
    related_dca_id: string | null;
}

interface NotificationsListProps {
    notifications: Notification[];
}

const TYPE_ICONS: Record<string, string> = {
    SLA_WARNING: '⚠️',
    SLA_BREACH: '🚨',
    CASE_ASSIGNED: '📋',
    PAYMENT_RECEIVED: '💰',
    ESCALATION_CREATED: '⬆️',
    DISPUTE_RAISED: '⚖️',
    PERFORMANCE_ALERT: '📊',
    SYSTEM_ALERT: '🔔',
};

const TYPE_COLORS: Record<string, { bg: string; border: string; darkBg: string; darkBorder: string }> = {
    SLA_WARNING: { bg: 'bg-amber-50', border: 'border-amber-200', darkBg: 'dark:bg-amber-500/10', darkBorder: 'dark:border-amber-500/30' },
    SLA_BREACH: { bg: 'bg-red-50', border: 'border-red-200', darkBg: 'dark:bg-red-500/10', darkBorder: 'dark:border-red-500/30' },
    CASE_ASSIGNED: { bg: 'bg-blue-50', border: 'border-blue-200', darkBg: 'dark:bg-blue-500/10', darkBorder: 'dark:border-blue-500/30' },
    PAYMENT_RECEIVED: { bg: 'bg-green-50', border: 'border-green-200', darkBg: 'dark:bg-green-500/10', darkBorder: 'dark:border-green-500/30' },
    ESCALATION_CREATED: { bg: 'bg-orange-50', border: 'border-orange-200', darkBg: 'dark:bg-orange-500/10', darkBorder: 'dark:border-orange-500/30' },
    DISPUTE_RAISED: { bg: 'bg-purple-50', border: 'border-purple-200', darkBg: 'dark:bg-purple-500/10', darkBorder: 'dark:border-purple-500/30' },
    PERFORMANCE_ALERT: { bg: 'bg-indigo-50', border: 'border-indigo-200', darkBg: 'dark:bg-indigo-500/10', darkBorder: 'dark:border-indigo-500/30' },
    SYSTEM_ALERT: { bg: 'bg-gray-50', border: 'border-gray-200', darkBg: 'dark:bg-gray-500/10', darkBorder: 'dark:border-gray-500/30' },
};

export function NotificationsList({ notifications }: NotificationsListProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [localNotifications, setLocalNotifications] = useState(notifications);

    const markAsRead = async (id: string) => {
        startTransition(async () => {
            try {
                await fetch(`/api/notifications/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_read: true }),
                });
                setLocalNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                );
                router.refresh();
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        });
    };

    const markAllAsRead = async () => {
        startTransition(async () => {
            try {
                // Use batch API for better performance
                await fetch('/api/notifications/mark-all-read', {
                    method: 'POST',
                });
                setLocalNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                router.refresh();
            } catch (error) {
                console.error('Failed to mark all as read:', error);
            }
        });
    };

    const unreadCount = localNotifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        disabled={isPending}
                        className="text-sm text-gray-600 dark:text-gray-300 hover:underline disabled:opacity-50"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            {localNotifications.length > 0 ? (
                <div className="space-y-3">
                    {localNotifications.map((notification) => {
                        const colors = TYPE_COLORS[notification.notification_type] || {
                            bg: 'bg-gray-50',
                            border: 'border-gray-200',
                            darkBg: 'dark:bg-[#1a1a1a]',
                            darkBorder: 'dark:border-[#333]'
                        };
                        const icon = TYPE_ICONS[notification.notification_type] || '🔔';
                        const timeAgo = getTimeAgo(new Date(notification.created_at));

                        return (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg border transition-all ${colors.bg} ${colors.border} ${colors.darkBg} ${colors.darkBorder} ${!notification.is_read ? 'ring-2 ring-primary/20' : 'opacity-80'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">{icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className={`font-medium ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {notification.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{notification.message}</p>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{timeAgo}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            {notification.action_url && (
                                                <Link
                                                    href={notification.action_url}
                                                    className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
                                                >
                                                    View Details →
                                                </Link>
                                            )}
                                            {notification.related_case_id && (
                                                <Link
                                                    href={`/cases/${notification.related_case_id}`}
                                                    className="text-sm text-gray-600 dark:text-gray-300 hover:underline"
                                                >
                                                    View Case
                                                </Link>
                                            )}
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    disabled={isPending}
                                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-5xl mb-4">🔔</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Notifications</h3>
                    <p className="text-gray-500 dark:text-gray-400">You&apos;re all caught up! Check back later for updates.</p>
                </div>
            )}
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}
