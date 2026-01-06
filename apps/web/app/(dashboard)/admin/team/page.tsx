'use client';

import { useEffect, useState } from 'react';

/**
 * DCA_ADMIN Team Page
 * 
 * PURPOSE: Full internal DCA user lifecycle management
 * SCOPE: Only users in current_user.dca_id
 * 
 * Per MASTER UI SPEC:
 * - Create DCA_MANAGER, DCA_AGENT
 * - Disable users
 * - Reset passwords
 * - Assign roles
 */

interface TeamMember {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    last_login?: string;
    cases_assigned?: number;
}

export default function AdminTeamPage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const response = await fetch('/api/admin/team');
                if (response.ok) {
                    const data = await response.json();
                    setTeam(data.members || []);
                }
            } catch (e) {
                console.error('Failed to fetch team:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeam();
    }, []);

    const getRoleBadge = (role: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            'DCA_ADMIN': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
            'DCA_MANAGER': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Manager' },
            'DCA_AGENT': { bg: 'bg-green-100', text: 'text-green-700', label: 'Agent' },
        };
        const badge = badges[role] || { bg: 'bg-gray-100', text: 'text-gray-700', label: role };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>;
    };

    const managers = team.filter(m => m.role === 'DCA_MANAGER');
    const agents = team.filter(m => m.role === 'DCA_AGENT');
    const admins = team.filter(m => m.role === 'DCA_ADMIN');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your DCA's managers and agents</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <span>+</span>
                    Add Team Member
                </button>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <span className="text-purple-600">👑</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{admins.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Admins</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-blue-600">👔</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{managers.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Managers</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <span className="text-green-600">👤</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{agents.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Agents</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team List */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-[#222]">
                    <h3 className="font-semibold text-gray-900 dark:text-white">All Team Members</h3>
                </div>
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Loading team...</p>
                    </div>
                ) : team.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">👥</div>
                        <p className="text-gray-500 dark:text-gray-400">No team members found</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            Add First Team Member
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#222]">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cases</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                            {team.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-primary font-medium text-sm">
                                                    {member.full_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-white">{member.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{member.email}</td>
                                    <td className="px-5 py-4">{getRoleBadge(member.role)}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                                        {member.cases_assigned ?? '-'}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-2">
                                            <button className="text-sm text-primary hover:underline">Edit</button>
                                            {member.role !== 'DCA_ADMIN' && (
                                                <button className="text-sm text-red-500 hover:underline">
                                                    {member.is_active ? 'Disable' : 'Enable'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#111] rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Team Member</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Create a new DCA Manager or Agent for your team.
                        </p>
                        <div className="text-center py-8 text-gray-400">
                            User creation form coming soon...
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
