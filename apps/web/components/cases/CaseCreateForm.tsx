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
        assigned_dca_id: '',
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

        startTransition(async () => {
            try {
                const response = await fetch('/api/cases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name: formData.customer_name.trim(),
                        customer_id: formData.customer_id.trim() || null,
                        customer_email: formData.customer_email.trim() || null,
                        customer_phone: formData.customer_phone.trim() || null,
                        original_amount: parseFloat(formData.original_amount),
                        outstanding_amount: parseFloat(formData.original_amount),
                        priority: formData.priority,
                        assigned_dca_id: formData.assigned_dca_id || null,
                        notes: formData.notes.trim() || null,
                        status: formData.assigned_dca_id ? 'ALLOCATED' : 'PENDING_ALLOCATION',
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
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    Case created successfully! Redirecting...
                </div>
            )}

            {/* Customer Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                            Customer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="customer_name"
                            name="customer_name"
                            value={formData.customer_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Enter customer name"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-2">
                            Customer ID
                        </label>
                        <input
                            type="text"
                            id="customer_id"
                            name="customer_id"
                            value={formData.customer_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="e.g., CUST-001"
                        />
                    </div>

                    <div>
                        <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="customer_email"
                            name="customer_email"
                            value={formData.customer_email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="customer@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                        </label>
                        <input
                            type="tel"
                            id="customer_phone"
                            name="customer_phone"
                            value={formData.customer_phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>
            </div>

            {/* Case Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="original_amount" className="block text-sm font-medium text-gray-700 mb-2">
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
                                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            {PRIORITY_OPTIONS.map(priority => (
                                <option key={priority} value={priority}>
                                    {priority}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="assigned_dca_id" className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to DCA (Optional)
                        </label>
                        <select
                            id="assigned_dca_id"
                            name="assigned_dca_id"
                            value={formData.assigned_dca_id}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                            <option value="">Leave Unassigned</option>
                            {dcas.map(dca => (
                                <option key={dca.id} value={dca.id}>
                                    {dca.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notes */}
                <div className="mt-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Add any relevant notes about this case..."
                    />
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
