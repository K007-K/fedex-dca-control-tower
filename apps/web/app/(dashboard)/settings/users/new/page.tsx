'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';

const roles = [
    { value: 'READONLY', label: 'Read Only', org: 'any' },
    { value: 'DCA_AGENT', label: 'DCA Agent', org: 'dca' },
    { value: 'DCA_MANAGER', label: 'DCA Manager', org: 'dca' },
    { value: 'DCA_ADMIN', label: 'DCA Admin', org: 'dca' },
    { value: 'FEDEX_ANALYST', label: 'FedEx Analyst', org: 'fedex' },
    { value: 'FEDEX_MANAGER', label: 'FedEx Manager', org: 'fedex' },
    { value: 'FEDEX_ADMIN', label: 'FedEx Admin', org: 'fedex' },
    { value: 'AUDITOR', label: 'Auditor', org: 'any' },
];

interface DCA {
    id: string;
    name: string;
}

interface CreatedUserResult {
    email: string;
    tempPassword: string;
    fullName: string;
}

export default function CreateUserPage() {
    const router = useRouter();
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dcas, setDcas] = useState<DCA[]>([]);
    const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        personalEmail: '',
        role: 'READONLY',
        dcaId: '',
        phone: '',
    });

    // Generate work email preview
    const generatedWorkEmail = formData.firstName && formData.lastName
        ? `${formData.firstName.toLowerCase().replace(/\s+/g, '')}.${formData.lastName.toLowerCase().replace(/\s+/g, '')}@fedex-dca.com`
        : '';

    // Fetch DCAs for dropdown
    useEffect(() => {
        async function fetchDcas() {
            try {
                const response = await fetch('/api/dcas');
                if (response.ok) {
                    const data = await response.json();
                    setDcas(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch DCAs:', error);
            }
        }
        fetchDcas();
    }, []);

    const isDCARole = roles.find(r => r.value === formData.role)?.org === 'dca';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: generatedWorkEmail,
                    full_name: fullName,
                    role: formData.role,
                    dca_id: isDCARole ? formData.dcaId : null,
                    phone: formData.phone || null,
                    personal_email: formData.personalEmail || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create user');
            }

            // Show credentials modal
            setCreatedUser({
                email: generatedWorkEmail,
                tempPassword: data.tempPassword,
                fullName: fullName,
            });

            toast.success('User Created', `Account created for ${fullName}`);

        } catch (err) {
            toast.error('Error', err instanceof Error ? err.message : 'Failed to create user');
            setIsSubmitting(false);
        }
    };

    const handleCloseCredentials = () => {
        setCreatedUser(null);
        router.push('/settings/users');
        router.refresh();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied!', 'Credentials copied to clipboard');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <Link href="/settings" className="hover:text-primary">Settings</Link>
                    <span className="mx-2">/</span>
                    <Link href="/settings/users" className="hover:text-primary">Users</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">New User</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New User</h1>
                <p className="text-gray-500 dark:text-gray-400">Add a new employee to the system</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 max-w-2xl">
                <div className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="John"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Doe"
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Auto-generated Work Email Preview */}
                    {generatedWorkEmail && (
                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-[#333]">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Work Email (auto-generated)
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-primary font-mono text-lg">{generatedWorkEmail}</span>
                                <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">Auto-generated</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                This email will be used for login. A password will be auto-generated.
                            </p>
                        </div>
                    )}

                    {/* Personal Email (for sending credentials) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Personal Email <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="email"
                            value={formData.personalEmail}
                            onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                            placeholder="personal@gmail.com"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                📧 <strong>Email Delivery:</strong> After creation, credentials will be displayed in a popup.
                                To enable automatic email delivery, configure SMTP in your Supabase project settings.
                            </p>
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DCA Selection (only for DCA roles) */}
                    {isDCARole && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Assign to DCA <span className="text-red-500">*</span>
                            </label>
                            <select
                                required={isDCARole}
                                value={formData.dcaId}
                                onChange={(e) => setFormData({ ...formData, dcaId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                            >
                                <option value="">Select a DCA...</option>
                                {dcas.map((dca) => (
                                    <option key={dca.id} value={dca.id}>
                                        {dca.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Phone <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full px-4 py-2 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#222] flex items-center gap-3">
                    <Button type="submit" disabled={isSubmitting || !generatedWorkEmail}>
                        {isSubmitting ? 'Creating...' : 'Create User'}
                    </Button>
                    <Link href="/settings/users">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                </div>
            </form>

            {/* Credentials Modal */}
            {createdUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#111] rounded-xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-[#222]">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Created Successfully!</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{createdUser.fullName}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-4 space-y-3 border border-gray-200 dark:border-[#333]">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Login Email</label>
                                <p className="font-mono text-primary font-medium">{createdUser.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Temporary Password</label>
                                <p className="font-mono text-gray-900 dark:text-white font-medium">{createdUser.tempPassword}</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/30">
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                ⚠️ Save these credentials! Share them securely with the user. They should change their password after first login.
                            </p>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button
                                onClick={() => copyToClipboard(`Email: ${createdUser.email}\nPassword: ${createdUser.tempPassword}`)}
                                variant="outline"
                                className="flex-1"
                            >
                                📋 Copy Credentials
                            </Button>
                            <Button onClick={handleCloseCredentials} className="flex-1">
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
