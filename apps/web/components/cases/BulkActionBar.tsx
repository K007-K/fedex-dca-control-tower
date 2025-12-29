'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { exportToCsv, CASE_EXPORT_COLUMNS } from '@/lib/export';

interface BulkActionBarProps {
    selectedIds: string[];
    onClear: () => void;
    dcas: Array<{ id: string; name: string }>;
}

const STATUS_OPTIONS = [
    { value: 'PENDING_ALLOCATION', label: 'Pending Allocation' },
    { value: 'ALLOCATED', label: 'Allocated' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ESCALATED', label: 'Escalated' },
    { value: 'CLOSED', label: 'Closed' },
];

export function BulkActionBar({ selectedIds, onClear, dcas }: BulkActionBarProps) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showDcaDropdown, setShowDcaDropdown] = useState(false);

    if (selectedIds.length === 0) return null;

    const handleBulkStatus = async (status: string) => {
        setLoading(true);
        setShowStatusDropdown(false);
        try {
            const res = await fetch('/api/cases/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    case_ids: selectedIds,
                    operation: 'update_status',
                    status,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(data.message);
            onClear();
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update cases');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAssign = async (dcaId: string, dcaName: string) => {
        setLoading(true);
        setShowDcaDropdown(false);
        try {
            const res = await fetch('/api/cases/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    case_ids: selectedIds,
                    operation: 'assign_dca',
                    dca_id: dcaId,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(`Assigned ${selectedIds.length} cases to ${dcaName}`);
            onClear();
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to assign cases');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cases/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    case_ids: selectedIds,
                    operation: 'export',
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            exportToCsv(data.data, 'cases_export', CASE_EXPORT_COLUMNS);
            toast.success(`Exported ${data.count} cases`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to export cases');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white text-sm font-bold px-2 py-1 rounded">
                        {selectedIds.length}
                    </span>
                    <span className="text-gray-300">selected</span>
                </div>

                <div className="h-6 w-px bg-gray-700" />

                {/* Status Dropdown */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowStatusDropdown(!showStatusDropdown);
                            setShowDcaDropdown(false);
                        }}
                        disabled={loading}
                        className="text-white hover:bg-gray-800"
                    >
                        📋 Change Status
                    </Button>
                    {showStatusDropdown && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleBulkStatus(opt.value)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* DCA Dropdown */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShowDcaDropdown(!showDcaDropdown);
                            setShowStatusDropdown(false);
                        }}
                        disabled={loading}
                        className="text-white hover:bg-gray-800"
                    >
                        🎯 Assign DCA
                    </Button>
                    {showDcaDropdown && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[200px] max-h-[200px] overflow-y-auto">
                            {dcas.length === 0 ? (
                                <div className="px-4 py-2 text-sm text-gray-500">No active DCAs</div>
                            ) : (
                                dcas.map(dca => (
                                    <button
                                        key={dca.id}
                                        onClick={() => handleBulkAssign(dca.id, dca.name)}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        {dca.name}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Export Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExport}
                    disabled={loading}
                    className="text-white hover:bg-gray-800"
                >
                    📥 Export CSV
                </Button>

                <div className="h-6 w-px bg-gray-700" />

                {/* Clear Selection */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    disabled={loading}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                >
                    ✕ Clear
                </Button>

                {loading && (
                    <span className="text-gray-400 text-sm">Processing...</span>
                )}
            </div>
        </div>
    );
}
