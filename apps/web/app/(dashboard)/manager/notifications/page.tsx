'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Notification {
    id: string;
    notification_type: string;
    title: string;
    message: string;
    related_case_id: string | null;
    priority: string;
    read_at: string | null;
    created_at: string;
}

export default function ManagerNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);

    const fetchNotifications = async () => {
        try {
            const params = showUnreadOnly ? '?unread=true' : '';
            const res = await fetch(`/api/manager/notifications${params}`);
            if (res.ok) {
                const json = await res.json();
                setNotifications(json.notifications || []);
                setUnreadCount(json.unreadCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [showUnreadOnly]);

    const markAllAsRead = async () => {
        try {
            await fetch('/api/manager/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_all: true }),
            });
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            case 'HIGH': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'ESCALATION_CREATED': return '⚠️';
            case 'SLA_BREACH': return '🔴';
            case 'SLA_WARNING': return '⏰';
            case 'CASE_ASSIGNED': return '📋';
            default: return '🔔';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Notifications
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-primary hover:underline"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <button
                    onClick={() => setShowUnreadOnly(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!showUnreadOnly
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setShowUnreadOnly(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showUnreadOnly
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                        }`}
                >
                    Unread
                </button>
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 flex items-start gap-4 ${!notif.read_at ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                                    }`}
                            >
                                <div className="text-2xl flex-shrink-0">
                                    {getTypeIcon(notif.notification_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                            {notif.title}
                                        </h3>
                                        {notif.priority !== 'NORMAL' && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(notif.priority)}`}>
                                                {notif.priority}
                                            </span>
                                        )}
                                        {!notif.read_at && (
                                            <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {notif.message}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs text-gray-400">
                                            {new Date(notif.created_at).toLocaleString()}
                                        </span>
                                        {notif.related_case_id && (
                                            <Link
                                                href={`/manager/cases/${notif.related_case_id}`}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                View Case →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
