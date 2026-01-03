'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tooltip } from '@/components/ui/Tooltip';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useNotificationsRealtime } from '@/lib/realtime';
import { useConfirm } from '@/components/ui';

interface HeaderProps {
    userEmail?: string;
    userAvatarUrl?: string;
    userRole?: string;
    pageTitle?: string;
    breadcrumbs?: { name: string; href: string }[];
}

interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    notification_type: string;
}

export function Header({ userEmail, userAvatarUrl, userRole, pageTitle = 'Dashboard', breadcrumbs }: HeaderProps) {
    const router = useRouter();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const confirmDialog = useConfirm();

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        setLoadingNotifications(true);
        try {
            const res = await fetch('/api/notifications?limit=5');
            const data = await res.json();
            setNotifications(data.data || []);
            // Store user ID for real-time subscription
            if (data.userId) {
                setUserId(data.userId);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoadingNotifications(false);
        }
    }, []);

    // Fetch notifications on mount for badge count
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Real-time subscription - updates notifications when changes occur
    useNotificationsRealtime(userId || '', fetchNotifications);

    // Fetch when dropdown opens
    useEffect(() => {
        if (notificationsOpen) {
            fetchNotifications();
        }
    }, [notificationsOpen, fetchNotifications]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle search submission
    const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/cases?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    // Format relative time
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    // Get notification type color
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'SLA_WARNING': return 'bg-yellow-500';
            case 'CASE_RESOLVED':
            case 'CASE_CLOSED': return 'bg-green-500';
            case 'ESCALATION_CREATED': return 'bg-red-500';
            default: return 'bg-blue-500';
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black px-6">
            {/* Left: Title and Breadcrumbs */}
            <div>
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {breadcrumbs.map((crumb, idx) => (
                            <span key={crumb.href} className="flex items-center">
                                {idx > 0 && <span className="mx-2">/</span>}
                                <Link href={crumb.href} className="hover:text-primary transition-colors">
                                    {crumb.name}
                                </Link>
                            </span>
                        ))}
                    </nav>
                )}
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
            </div>

            {/* Right: Search, Notifications, User */}
            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="hidden md:flex items-center">
                    <form onSubmit={handleSearch} className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search cases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                            className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                    </form>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <div ref={notificationsRef} className="relative">
                    <Tooltip content="Notifications" position="bottom">
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Open notifications"
                            aria-expanded={notificationsOpen}
                        >
                            <BellIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            {notifications.filter(n => !n.is_read).length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse" aria-hidden="true" />
                            )}
                        </button>
                    </Tooltip>

                    {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-elevated border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-down">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {loadingNotifications ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 mt-2 rounded-full ${getTypeColor(notif.notification_type)}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium text-sm ${notif.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTime(notif.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                                <Link href="/notifications" className="text-sm text-primary font-medium hover:underline">
                                    View all notifications
                                </Link>
                                <button
                                    onClick={async () => {
                                        const confirmed = await confirmDialog.confirm({
                                            title: 'Clear All Notifications',
                                            message: 'Delete all notifications? This cannot be undone.',
                                            confirmText: 'Clear All',
                                            cancelText: 'Cancel',
                                            variant: 'danger',
                                        });
                                        if (confirmed) {
                                            await fetch('/api/notifications/delete-all', { method: 'DELETE' });
                                            setNotificationsOpen(false);
                                            fetchNotifications();
                                        }
                                    }}
                                    className="text-sm text-red-500 hover:text-red-600 font-medium"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div ref={userMenuRef} className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Open user menu"
                        aria-expanded={userMenuOpen}
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                            {userAvatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={userAvatarUrl} alt="Avatar" className="h-8 w-8 object-cover" />
                            ) : (
                                <span className="text-primary font-medium text-sm">
                                    {userEmail?.charAt(0).toUpperCase() ?? 'U'}
                                </span>
                            )}
                        </div>
                        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-elevated border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-down">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{userEmail}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{userRole || 'User'}</p>
                            </div>
                            <div className="py-2">
                                <Link href="/settings/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <UserIcon className="w-4 h-4 mr-3 text-gray-400" aria-hidden="true" />
                                    Profile Settings
                                </Link>
                                <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <SettingsIcon className="w-4 h-4 mr-3 text-gray-400" aria-hidden="true" />
                                    Settings
                                </Link>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 py-2">
                                <form action="/auth/signout" method="post">
                                    <button
                                        type="submit"
                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <LogoutIcon className="w-4 h-4 mr-3" />
                                        Sign out
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function NotificationItem({
    title,
    message,
    time,
    type,
}: {
    title: string;
    message: string;
    time: string;
    type: 'warning' | 'success' | 'info';
}) {
    const colors = {
        warning: 'bg-warning/10 text-warning',
        success: 'bg-success/10 text-success',
        info: 'bg-info/10 text-info',
    };

    return (
        <div className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0">
            <div className="flex items-start space-x-3">
                <div className={`w-2 h-2 mt-2 rounded-full ${colors[type].replace('/10', '')}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 truncate">{message}</p>
                    <p className="text-xs text-gray-400 mt-1">{time}</p>
                </div>
            </div>
        </div>
    );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    );
}

function BellIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );
}

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function LogoutIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    );
}

export default Header;
