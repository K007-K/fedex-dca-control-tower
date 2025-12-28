'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DCAData {
    id: string;
    name: string;
    code: string;
    status: string;
    capacity_limit: number;
    capacity_used: number;
    performance_score: number;
    recovery_rate: number;
    active_cases: number;
    total_recovered: number;
}

interface DCAComparisonProps {
    dcas: DCAData[];
}

export function DCAComparison({ dcas }: DCAComparisonProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showComparison, setShowComparison] = useState(false);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            }
            if (prev.length >= 4) {
                return prev; // Max 4 DCAs
            }
            return [...prev, id];
        });
    };

    const selectedDcas = dcas.filter(d => selectedIds.includes(d.id));

    const metrics = [
        { key: 'status', label: 'Status', format: (v: string) => v },
        { key: 'capacity', label: 'Capacity', format: (_: unknown, d: DCAData) => `${d.capacity_used}/${d.capacity_limit}` },
        { key: 'capacity_pct', label: 'Capacity %', format: (_: unknown, d: DCAData) => `${Math.round((d.capacity_used / d.capacity_limit) * 100)}%` },
        { key: 'performance_score', label: 'Performance', format: (v: number) => `${v?.toFixed(1) || 0}/100` },
        { key: 'recovery_rate', label: 'Recovery Rate', format: (v: number) => `${v?.toFixed(1) || 0}%` },
        { key: 'active_cases', label: 'Active Cases', format: (v: number) => v?.toLocaleString() || '0' },
        { key: 'total_recovered', label: 'Total Recovered', format: (v: number) => `$${v?.toLocaleString() || '0'}` },
    ];

    if (showComparison && selectedDcas.length >= 2) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">DCA Comparison</h2>
                    <Button variant="outline" onClick={() => setShowComparison(false)}>
                        ← Back to List
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">Metric</th>
                                {selectedDcas.map(dca => (
                                    <th key={dca.id} className="text-center py-3 px-4 font-semibold text-gray-900">
                                        {dca.name}
                                        <span className="block text-xs text-gray-500 font-normal">{dca.code}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map(metric => {
                                // Find best value for highlighting
                                const values = selectedDcas.map(d => {
                                    if (metric.key === 'capacity_pct') {
                                        return (d.capacity_used / d.capacity_limit) * 100;
                                    }
                                    return d[metric.key as keyof DCAData] as number;
                                });
                                const isBetterIfLower = metric.key === 'capacity_pct';
                                const bestValue = isBetterIfLower ? Math.min(...values) : Math.max(...values);

                                return (
                                    <tr key={metric.key} className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-gray-700 font-medium">{metric.label}</td>
                                        {selectedDcas.map((dca, idx) => {
                                            const isBest = values[idx] === bestValue && values.filter(v => v === bestValue).length === 1;
                                            return (
                                                <td
                                                    key={dca.id}
                                                    className={`py-3 px-4 text-center ${isBest ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600'}`}
                                                >
                                                    {metric.format(dca[metric.key as keyof DCAData] as never, dca)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-green-50 border border-green-200 rounded"></span>
                    Best value highlighted in green
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Compare DCAs</h2>
                    <p className="text-sm text-gray-500">Select 2-4 DCAs to compare side by side</p>
                </div>
                {selectedIds.length >= 2 && (
                    <Button onClick={() => setShowComparison(true)}>
                        Compare {selectedIds.length} DCAs →
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dcas.map(dca => {
                    const isSelected = selectedIds.includes(dca.id);
                    const capacityPct = Math.round((dca.capacity_used / dca.capacity_limit) * 100);

                    return (
                        <div
                            key={dca.id}
                            onClick={() => toggleSelect(dca.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                ? 'border-primary bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-900">{dca.name}</h3>
                                    <p className="text-xs text-gray-500">{dca.code}</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => { }}
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-500">Capacity:</span>
                                    <span className="ml-1 font-medium">{capacityPct}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Score:</span>
                                    <span className="ml-1 font-medium">{dca.performance_score?.toFixed(0) || 0}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedIds.length > 0 && selectedIds.length < 2 && (
                <p className="mt-4 text-sm text-amber-600">Select at least 2 DCAs to compare</p>
            )}
        </div>
    );
}
