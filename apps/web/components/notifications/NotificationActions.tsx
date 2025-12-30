'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationActionsProps {
    hasNotifications: boolean;
}

export function NotificationActions({ hasNotifications }: NotificationActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleMarkAllRead = async () => {
        setLoading('markRead');
        try {
            await fetch('/api/notifications/mark-all-read', { method: 'POST' });
            router.refresh();
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
            return;
        }
        setLoading('deleteAll');
        try {
            await fetch('/api/notifications/delete-all', { method: 'DELETE' });
            router.refresh();
        } catch (err) {
            console.error('Failed to delete notifications:', err);
        } finally {
            setLoading(null);
        }
    };

    if (!hasNotifications) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleMarkAllRead}
                disabled={!!loading}
                className="px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
            >
                {loading === 'markRead' ? '...' : '✓ Mark All Read'}
            </button>
            <button
                onClick={handleDeleteAll}
                disabled={!!loading}
                className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
                {loading === 'deleteAll' ? '...' : '🗑️ Delete All'}
            </button>
        </div>
    );
}
