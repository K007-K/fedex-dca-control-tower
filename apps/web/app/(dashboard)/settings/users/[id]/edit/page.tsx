'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useToast, useConfirm } from '@/components/ui';
import { Button } from '@/components/ui/button';

const roles = [
    { value: 'READONLY', label: 'Read Only' },
    { value: 'DCA_AGENT', label: 'DCA Agent' },
    { value: 'DCA_MANAGER', label: 'DCA Manager' },
    { value: 'DCA_ADMIN', label: 'DCA Admin' },
    { value: 'FEDEX_ANALYST', label: 'FedEx Analyst' },
    { value: 'FEDEX_MANAGER', label: 'FedEx Manager' },
    { value: 'FEDEX_ADMIN', label: 'FedEx Admin' },
    { value: 'AUDITOR', label: 'Auditor' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

export default function EditUserPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const toast = useToast();
    const { confirm } = useConfirm();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'READONLY',
        phone: '',
        is_active: true,
    });

    useEffect(() => {
        async function loadUser() {
            try {
                const response = await fetch(`/api/users/${id}`);
                if (!response.ok) throw new Error('Failed to load user');
                const { data } = await response.json();
                setFormData({
                    full_name: data.full_name ?? '',
                    email: data.email ?? '',
                    role: data.role ?? 'READONLY',
                    phone: data.phone ?? '',
                    is_active: data.is_active ?? true,
                });
            } catch (err) {
                toast.error('Error', 'Failed to load user data');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        loadUser();
    }, [id, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    role: formData.role,
                    phone: formData.phone || null,
                    is_active: formData.is_active,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update user');
            }

            toast.success('User Updated', 'Changes have been saved successfully.');
            router.push('/settings/users');
            router.refresh();
        } catch (err) {
            toast.error('Error', err instanceof Error ? err.message : 'Failed to update user');
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = async () => {
        const confirmed = await confirm({
            title: 'Deactivate User',
            message: `Are you sure you want to deactivate ${formData.full_name}? They will no longer be able to login.`,
            confirmText: 'Deactivate',
            cancelText: 'Cancel',
            variant: 'danger',
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to deactivate user');

            toast.success('User Deactivated', `${formData.full_name} has been deactivated.`);
            router.push('/settings/users');
            router.refresh();
        } catch (err) {
            toast.error('Error', err instanceof Error ? err.message : 'Failed to deactivate user');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 mb-2">
                    <Link href="/settings" className="hover:text-primary">Settings</Link>
                    <span className="mx-2">/</span>
                    <Link href="/settings/users" className="hover:text-primary">Users</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">Edit User</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                <p className="text-gray-500">{formData.email}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        />
                        <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                            Account Active
                        </label>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Link href="/settings/users">
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                    </div>
                    {formData.is_active && (
                        <button
                            type="button"
                            onClick={handleDeactivate}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                            Deactivate User
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
