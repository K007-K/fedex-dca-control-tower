'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const roleColors: Record<string, { bg: string; text: string }> = {
    SUPER_ADMIN: { bg: 'bg-purple-500/20 border border-purple-500/30', text: 'text-purple-400' },
    FEDEX_ADMIN: { bg: 'bg-blue-500/20 border border-blue-500/30', text: 'text-blue-400' },
    FEDEX_MANAGER: { bg: 'bg-indigo-500/20 border border-indigo-500/30', text: 'text-indigo-400' },
    FEDEX_ANALYST: { bg: 'bg-cyan-500/20 border border-cyan-500/30', text: 'text-cyan-400' },
    DCA_ADMIN: { bg: 'bg-orange-500/20 border border-orange-500/30', text: 'text-orange-400' },
    DCA_MANAGER: { bg: 'bg-yellow-500/20 border border-yellow-500/30', text: 'text-yellow-400' },
    DCA_AGENT: { bg: 'bg-green-500/20 border border-green-500/30', text: 'text-green-400' },
    AUDITOR: { bg: 'bg-gray-500/20 border border-gray-500/30', text: 'text-gray-400' },
    READONLY: { bg: 'bg-gray-500/20 border border-gray-500/30', text: 'text-gray-400' },
};

const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    FEDEX_ADMIN: 'FedEx Admin',
    FEDEX_MANAGER: 'FedEx Manager',
    FEDEX_ANALYST: 'FedEx Analyst',
    DCA_ADMIN: 'DCA Admin',
    DCA_MANAGER: 'DCA Manager',
    DCA_AGENT: 'DCA Agent',
    AUDITOR: 'Auditor',
    READONLY: 'Read Only',
};

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    last_login_at: string | null;
    organization?: { name: string } | null;
    dca?: { name: string } | null;
}

export default function UsersSettingsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                setUsers(data.data || []);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    // Filter users based on search
    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
            user.full_name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <Link href="/settings" className="hover:text-gray-700 dark:hover:text-gray-300">Settings</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 dark:text-white">User Management</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage users and assign roles</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search Box */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    {/* Add User Button */}
                    <Link
                        href="/settings/users/new"
                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        + Add User
                    </Link>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        Loading users...
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#222]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Organization</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#222]">
                            {filteredUsers.map((user) => {
                                const roleColor = roleColors[user.role] ?? { bg: 'bg-gray-500/20 border border-gray-500/30', text: 'text-gray-400' };
                                const roleLabel = roleLabels[user.role] ?? user.role;
                                const orgName = user.organization?.name ?? user.dca?.name ?? '—';

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColor.bg} ${roleColor.text}`}>
                                                {roleLabel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {orgName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${user.is_active
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {user.last_login_at
                                                ? new Date(user.last_login_at).toLocaleDateString()
                                                : 'Never'
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/settings/users/${user.id}/edit`}
                                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {searchQuery ? `No users match "${searchQuery}"` : 'No users found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
