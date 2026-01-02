'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui';

interface Region {
    id: string;
    region_code: string;
    name: string;
    country_codes: string[];
    status: string;
    default_currency: string;
    timezone: string;
}

interface AuditEntry {
    id: string;
    entity_type: string;
    action: string;
    performed_by: string;
    performed_at: string;
    performed_by_role: string;
}

export default function GovernancePage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [regions, setRegions] = useState<Region[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'regions' | 'flags' | 'audit'>('regions');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch regions
                const regionsRes = await fetch('/api/regions');
                if (regionsRes.ok) {
                    const regionsData = await regionsRes.json();
                    setRegions(regionsData.data || []);
                }

                // Fetch recent audit logs
                const auditRes = await fetch('/api/audit?limit=10');
                if (auditRes.ok) {
                    const auditData = await auditRes.json();
                    setAuditLogs(auditData.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch governance data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="h-64 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <nav className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <Link href="/settings" className="hover:text-primary">Settings</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 dark:text-white">Platform Governance</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Governance</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage regions, feature flags, and review audit logs
                    </p>
                </div>
            </div>

            {/* Governance Notice */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="text-purple-600 dark:text-purple-400 text-xl">🏛️</div>
                    <div>
                        <h3 className="font-medium text-purple-900 dark:text-purple-100">
                            SUPER_ADMIN Governance Panel
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                            This section provides global oversight and control over platform-wide settings.
                            All changes are logged for audit compliance.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-[#222]">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('regions')}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'regions'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        🌍 Regions ({regions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('flags')}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'flags'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        🚩 Feature Flags
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'audit'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        📋 Audit Log
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'regions' && (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-[#222] flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Region Management</h3>
                        <button
                            onClick={() => toast.info('Region creation UI coming soon')}
                            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            + Add Region
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Countries</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Currency</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timezone</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                                {regions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No regions configured yet
                                        </td>
                                    </tr>
                                ) : (
                                    regions.map((region) => (
                                        <tr key={region.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0a0a]">
                                            <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                                                {region.region_code}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                {region.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {region.country_codes?.join(', ') || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {region.default_currency}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {region.timezone}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${region.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {region.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'flags' && (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Feature Flags</h3>
                    <div className="space-y-4">
                        {/* Feature flags will be environment-based for now */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">ML Predictions</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Enable AI-powered priority scoring and recovery predictions</p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                                ENABLED
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Region-Based RBAC</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Enforce region-based access control for all users</p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                                ENABLED
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">MFA Enforcement</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Require multi-factor authentication for all users</p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                                DISABLED
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Bulk Case Operations</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Allow bulk assignment and status changes</p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                                ENABLED
                            </span>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                        Feature flags are currently managed via environment variables. Contact DevOps to modify.
                    </p>
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-[#222]">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Audit Events</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last 10 system events</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Time</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entity</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Performed By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                                {auditLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No recent audit events
                                        </td>
                                    </tr>
                                ) : (
                                    auditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0a0a]">
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(log.performed_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                {log.entity_type}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.action === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            log.action === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {log.performed_by_role}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
