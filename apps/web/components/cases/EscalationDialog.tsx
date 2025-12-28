'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui';

const escalationTypes = [
    { value: 'SLA_BREACH', label: 'SLA Breach' },
    { value: 'REPEATED_BREACH', label: 'Repeated Breach' },
    { value: 'NO_PROGRESS', label: 'No Progress' },
    { value: 'CUSTOMER_COMPLAINT', label: 'Customer Complaint' },
    { value: 'DCA_PERFORMANCE', label: 'DCA Performance Issue' },
    { value: 'HIGH_VALUE', label: 'High Value Case' },
    { value: 'FRAUD_SUSPECTED', label: 'Fraud Suspected' },
    { value: 'LEGAL_REQUIRED', label: 'Legal Action Required' },
    { value: 'MANUAL', label: 'Manual Escalation' },
];

const severityLevels = [
    { value: 'LOW', label: 'Low', color: 'text-gray-600' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600' },
    { value: 'CRITICAL', label: 'Critical', color: 'text-red-600' },
];

interface EscalationDialogProps {
    caseId: string;
    caseNumber: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EscalationDialog({
    caseId,
    caseNumber,
    isOpen,
    onClose,
    onSuccess,
}: EscalationDialogProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        escalation_type: 'MANUAL',
        severity: 'MEDIUM',
        title: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/escalations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    case_id: caseId,
                    ...formData,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create escalation');
            }

            toast.success('Escalation created successfully');
            onSuccess();
            onClose();

            // Reset form
            setFormData({
                escalation_type: 'MANUAL',
                severity: 'MEDIUM',
                title: '',
                description: '',
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create escalation');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Escalate Case</h2>
                    <p className="text-sm text-gray-500 mt-1">Case: {caseNumber}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Escalation Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Escalation Type *
                        </label>
                        <select
                            required
                            value={formData.escalation_type}
                            onChange={(e) => setFormData({ ...formData, escalation_type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            {escalationTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Severity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Severity *
                        </label>
                        <div className="flex gap-2">
                            {severityLevels.map((level) => (
                                <button
                                    key={level.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, severity: level.value })}
                                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.severity === level.value
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Brief description of the issue"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows={4}
                            placeholder="Detailed explanation of why this case needs escalation..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? 'Creating...' : 'Create Escalation'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
