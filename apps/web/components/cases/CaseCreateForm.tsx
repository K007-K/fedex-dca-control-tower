'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';

interface CaseCreateFormProps {
    dcas: Array<{ id: string; name: string }>;
}

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function CaseCreateForm({ dcas }: CaseCreateFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_id: '',
        customer_email: '',
        customer_phone: '',
        original_amount: '',
        priority: 'MEDIUM',
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validation
        if (!formData.customer_name.trim()) {
            setError('Customer name is required');
            return;
        }
        if (!formData.original_amount || parseFloat(formData.original_amount) <= 0) {
            setError('Valid original amount is required');
            return;
        }
        if (!formData.notes.trim()) {
            setError('Justification notes are required for manual case creation');
            return;
        }

        startTransition(async () => {
            try {
                // GOVERNANCE: DO NOT send assigned_dca_id or assigned_agent_id
                // These are SYSTEM-controlled fields
                const response = await fetch('/api/cases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name: formData.customer_name.trim(),
                        customer_id: formData.customer_id.trim() || null,
                        customer_email: formData.customer_email.trim() || null,
                        customer_phone: formData.customer_phone.trim() || null,
                        original_amount: parseFloat(formData.original_amount),
                        priority: formData.priority,
                        notes: formData.notes.trim(),
                        // NEVER SEND: assigned_dca_id, assigned_agent_id
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error?.message || 'Failed to create case');
                }

                const { data } = await response.json();
                setSuccess(true);
                setTimeout(() => {
                    router.push(`/cases/${data.id}`);
                    router.refresh();
                }, 1500);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* GOVERNANCE BANNER */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Manual Case Creation</h3>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Manual case creation is intended only for exceptional scenarios when upstream systems
                            are unavailable or delayed. All DCA and agent assignments are handled automatically by SYSTEM.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    Case created successfully! DCA assignment will be performed automatically. Redirecting...
                </div>
            )}

            {/* Customer Information */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Customer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="customer_name"
                            name="customer_name"
                            value={formData.customer_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                            placeholder="Enter customer name"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Customer ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="customer_id"
                            name="customer_id"
                            value={formData.customer_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                            placeholder="e.g., CUST-001"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="customer_email"
                            name="customer_email"
                            value={formData.customer_email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                            placeholder="customer@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone
                        </label>
                        <input
                            type="tel"
                            id="customer_phone"
                            name="customer_phone"
                            value={formData.customer_phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>
            </div>

            {/* Case Details */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Case Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="original_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Original Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                id="original_amount"
                                name="original_amount"
                                value={formData.original_amount}
                                onChange={handleChange}
                                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Priority (Hint)
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                        >
                            {PRIORITY_OPTIONS.map(priority => (
                                <option key={priority} value={priority}>
                                    {priority}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            SYSTEM may override based on AI analysis
                        </p>
                    </div>

                    {/* DCA Assignment - DISABLED / READ-ONLY */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            DCA Assignment
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 cursor-not-allowed">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                <span>Automatic — Assigned by SYSTEM</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            DCA and agent assignment are performed automatically by SYSTEM based on capacity,
                            performance, and SLA rules.
                        </p>
                    </div>
                </div>

                {/* Notes - REQUIRED for justification */}
                <div className="mt-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Justification Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                        placeholder="Explain why this case is being created manually (e.g., upstream system outage, delayed data feed)..."
                        required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Required: Provide justification for creating this case manually instead of via SYSTEM integration.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Case'}
                </Button>
            </div>
        </form>
    );
}

