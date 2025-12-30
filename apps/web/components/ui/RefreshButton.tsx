'use client';

import { useState, useCallback } from 'react';

interface RefreshButtonProps {
    onRefresh: () => Promise<void>;
    label?: string;
    showTimestamp?: boolean;
    className?: string;
}

/**
 * Data Refresh Button
 * P3-7 and P3-6 FIX: Add refresh button and last updated timestamp
 */
export function RefreshButton({
    onRefresh,
    label = 'Refresh',
    showTimestamp = true,
    className = '',
}: RefreshButtonProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
            setLastUpdated(new Date());
        } finally {
            setIsRefreshing(false);
        }
    }, [onRefresh]);

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showTimestamp && (
                <span className="text-xs text-gray-500">
                    Updated {formatTimestamp(lastUpdated)}
                </span>
            )}
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                aria-label={label}
            >
                <svg
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
                {label}
            </button>
        </div>
    );
}

/**
 * Last Updated Display
 */
export function LastUpdated({
    timestamp,
    className = ''
}: {
    timestamp: Date | string;
    className?: string;
}) {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let relativeTime: string;
    if (seconds < 60) {
        relativeTime = 'Just now';
    } else if (minutes < 60) {
        relativeTime = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        relativeTime = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        relativeTime = `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        relativeTime = date.toLocaleDateString();
    }

    return (
        <span
            className={`text-xs text-gray-500 ${className}`}
            title={date.toLocaleString()}
        >
            Last updated: {relativeTime}
        </span>
    );
}

export default RefreshButton;
