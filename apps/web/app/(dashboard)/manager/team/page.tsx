'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    joinedAt: string;
    metrics: {
        activeCases: number;
        resolvedCases: number;
        slaBreaches30d: number;
    };
}

interface TeamData {
    dcaName: string;
    team: TeamMember[];
    summary: {
        totalAgents: number;
        activeAgents: number;
        totalActiveCases: number;
        totalResolved: number;
    };
}

export default function ManagerTeamPage() {
    const [data, setData] = useState<TeamData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch('/api/manager/team');
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to load team');
                }
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-32 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Team
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {data?.dcaName} — Agents and operational metrics
                </p>
            </div>

            {/* Notice about metrics */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
                <p>
                    <strong>Note:</strong> Agent metrics shown are for operational visibility only.
                    These are informational and should not be used for ranking or performance evaluation.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Agents</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data?.summary.totalAgents ?? 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Agents</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {data?.summary.activeAgents ?? 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Cases</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data?.summary.totalActiveCases ?? 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Resolved</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {data?.summary.totalResolved ?? 0}
                    </p>
                </div>
            </div>

            {/* Team List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                {data?.team && data.team.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-[#0a0a0a]">
                                <tr>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Agent</th>
                                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Contact</th>
                                    <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Active Cases</th>
                                    <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Resolved</th>
                                    <th className="text-center py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">SLA Issues (30d)</th>
                                    <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                                {data.team.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-[#0a0a0a]">
                                        <td className="py-3 px-4">
                                            <Link href={`/manager/team/${member.id}`} className="flex items-center gap-3 hover:opacity-80">
                                                <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-yellow-600">
                                                        {member.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white hover:text-primary">
                                                    {member.name}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-gray-600 dark:text-gray-400">{member.email}</p>
                                            {member.phone && (
                                                <p className="text-xs text-gray-400">{member.phone}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium text-gray-900 dark:text-white">
                                            {member.metrics.activeCases}
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                                            {member.metrics.resolvedCases}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`${member.metrics.slaBreaches30d > 5
                                                ? 'text-red-600 dark:text-red-400'
                                                : member.metrics.slaBreaches30d > 0
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-green-600 dark:text-green-400'
                                                }`}>
                                                {member.metrics.slaBreaches30d}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right space-x-2">
                                            <Link
                                                href={`/manager/team/${member.id}`}
                                                className="text-primary hover:underline text-xs"
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                href={`/manager/cases?agent_id=${member.id}`}
                                                className="text-primary hover:underline text-xs"
                                            >
                                                Cases
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No agents in your DCA
                    </div>
                )}
            </div>
        </div>
    );
}
