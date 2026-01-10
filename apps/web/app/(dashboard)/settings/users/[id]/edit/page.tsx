'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useConfirm } from '@/components/ui';

// Lock icon for immutable fields
const LockIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

// Roles that have users:delete permission
const ROLES_WITH_DELETE = ['SUPER_ADMIN', 'FEDEX_ADMIN', 'DCA_ADMIN', 'DCA_MANAGER'];

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    phone: string | null;
    dca_id: string | null;
    dca?: { name: string } | null;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userId, setUserId] = useState<string>('');
    const [canDelete, setCanDelete] = useState(false);
    const confirm = useConfirm();

    useEffect(() => {
        async function loadData() {
            const { id } = await params;
            setUserId(id);
            try {
                // Fetch current user's info for permission check
                const [userRes, meRes] = await Promise.all([
                    fetch(`/api/users/${id}`),
                    fetch('/api/me')
                ]);

                const userData = await userRes.json();
                if (userRes.ok && userData.data) {
                    setUser(userData.data);
                } else {
                    setError('User not found');
                }

                // Check if current user can delete
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setCanDelete(ROLES_WITH_DELETE.includes(meData.data?.role));
                }
            } catch {
                setError('Failed to load user');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [params]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // GOVERNANCE: Only send ALLOWED fields
            // NEVER send: role, email, dca_id (immutable)
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: user.full_name,
                    is_active: user.is_active,
                    phone: user.phone,
                    // DO NOT INCLUDE: role, email, dca_id
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess('User updated successfully!');
                setTimeout(() => router.push('/settings/users'), 1500);
            } else {
                // Handle error object with {code, message, ...} structure
                const errorMsg = typeof data.error === 'string'
                    ? data.error
                    : data.error?.message || 'Failed to update user';
                setError(errorMsg);
            }
        } catch {
            setError('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirm.confirm({
            title: 'Delete User',
            message: `Are you sure you want to permanently delete ${user?.full_name}? This action cannot be undone.`,
            confirmText: 'Yes, Delete User',
            cancelText: 'Cancel',
            variant: 'danger',
        });

        if (!confirmed) return;

        setDeleting(true);
        setError('');

        try {
            const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();

            if (res.ok) {
                router.push('/settings/users');
            } else {
                // Handle error object with {code, message, ...} structure
                const errorMsg = typeof data.error === 'string'
                    ? data.error
                    : data.error?.message || 'Failed to delete user';
                setError(errorMsg);
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };

    const toggleActive = () => {
        if (user) {
            setUser({ ...user, is_active: !user.is_active });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-red-500">{error || 'User not found'}</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link href="/settings" className="hover:text-gray-700 dark:hover:text-gray-300">Settings</Link>
                    <span className="mx-2">/</span>
                    <Link href="/settings/users" className="hover:text-gray-700 dark:hover:text-gray-300">Users</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">Edit User</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User</h1>
                <p className="text-gray-500 dark:text-gray-400">Update user details or deactivate the account</p>
            </div>

            {/* Governance Notice */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <LockIcon />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Governance Protected
                    </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Email, role, and DCA assignment are immutable after user creation.
                </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg text-green-600 dark:text-green-400">
                    {success}
                </div>
            )}

            {/* User Info Card */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-[#222]">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-primary font-bold">
                            {user.full_name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.full_name}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                </div>

                {/* IMMUTABLE Fields Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <LockIcon /> Immutable Fields
                    </h3>

                    {/* Email - READ ONLY */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Email
                        </label>
                        <div className="px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300 flex items-center justify-between">
                            <span>{user.email}</span>
                            <LockIcon />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed after user creation</p>
                    </div>

                    {/* Role - READ ONLY */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Role
                        </label>
                        <div className="px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300 flex items-center justify-between">
                            <span>{user.role.replace(/_/g, ' ')}</span>
                            <LockIcon />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Role cannot be changed after user creation</p>
                    </div>

                    {/* DCA - READ ONLY (if applicable) */}
                    {user.dca_id && (
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                DCA Assignment
                            </label>
                            <div className="px-4 py-2 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg text-gray-700 dark:text-gray-300 flex items-center justify-between">
                                <span>{user.dca?.name || user.dca_id}</span>
                                <LockIcon />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">DCA assignment is immutable</p>
                        </div>
                    )}
                </div>

                {/* EDITABLE Fields Section */}
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#222]">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Editable Fields
                    </h3>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={user.full_name}
                            onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone (optional)
                        </label>
                        <input
                            type="tel"
                            value={user.phone || ''}
                            onChange={(e) => setUser({ ...user, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-[#333] rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Account Status</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.is_active ? 'User can log in and access the system' : 'User is blocked from accessing the system'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={toggleActive}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${user.is_active
                                ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                                }`}
                        >
                            {user.is_active ? '✓ Active' : '✕ Inactive'}
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#222]">
                    {canDelete ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50"
                        >
                            {deleting ? 'Deleting...' : '🗑️ Delete User'}
                        </button>
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            💡 Use the status toggle above to deactivate users
                        </div>
                    )}
                    <div className="flex gap-3">
                        <Link
                            href="/settings/users"
                            className="px-4 py-2 bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-[#333]"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
