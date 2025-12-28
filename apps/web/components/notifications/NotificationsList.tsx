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

const TYPE_COLORS: Record<string, { bg: string; border: string }> = {
    SLA_WARNING: { bg: 'bg-amber-50', border: 'border-amber-200' },
    SLA_BREACH: { bg: 'bg-red-50', border: 'border-red-200' },
    CASE_ASSIGNED: { bg: 'bg-blue-50', border: 'border-blue-200' },
    PAYMENT_RECEIVED: { bg: 'bg-green-50', border: 'border-green-200' },
    ESCALATION_CREATED: { bg: 'bg-orange-50', border: 'border-orange-200' },
    DISPUTE_RAISED: { bg: 'bg-purple-50', border: 'border-purple-200' },
    PERFORMANCE_ALERT: { bg: 'bg-indigo-50', border: 'border-indigo-200' },
    SYSTEM_ALERT: { bg: 'bg-gray-50', border: 'border-gray-200' },
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
            const unreadIds = localNotifications.filter(n => !n.is_read).map(n => n.id);
            for (const id of unreadIds) {
                await fetch(`/api/notifications/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_read: true }),
                });
            }
            setLocalNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            router.refresh();
        });
    };

    const unreadCount = localNotifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-4">
            {/* Actions */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        disabled={isPending}
                        className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notifications List */}
            {localNotifications.length > 0 ? (
                <div className="space-y-3">
                    {localNotifications.map((notification) => {
                        const colors = TYPE_COLORS[notification.notification_type] || { bg: 'bg-gray-50', border: 'border-gray-200' };
                        const icon = TYPE_ICONS[notification.notification_type] || '🔔';
                        const timeAgo = getTimeAgo(new Date(notification.created_at));

                        return (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg border transition-all ${colors.bg} ${colors.border} ${!notification.is_read ? 'ring-2 ring-primary/20' : 'opacity-75'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">{icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            {notification.action_url && (
                                                <Link
                                                    href={notification.action_url}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    View Details →
                                                </Link>
                                            )}
                                            {notification.related_case_id && (
                                                <Link
                                                    href={`/cases/${notification.related_case_id}`}
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    View Case
                                                </Link>
                                            )}
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    disabled={isPending}
                                                    className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                    <p className="text-gray-500">You&apos;re all caught up! Check back later for updates.</p>
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
