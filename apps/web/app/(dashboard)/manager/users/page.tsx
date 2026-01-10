'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Users, Mail, Phone, Calendar, MoreVertical, Shield } from 'lucide-react';
import { CreateAgentModal } from '@/components/manager/CreateAgentModal';

interface Agent {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    state_code: string | null;
    is_active: boolean;
    created_at: string;
}

interface ManagerProfile {
    can_create_agents: boolean;
    state_code: string | null;
}

export default function ManagerUsersPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<ManagerProfile | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchAgents = useCallback(async () => {
        try {
            const res = await fetch('/api/manager/team');
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to load agents');
            }
            const data = await res.json();
            // Transform team data to agents format
            setAgents(data.team?.map((member: { id: string; name: string; email: string; phone: string | null; joinedAt: string }) => ({
                id: member.id,
                full_name: member.name,
                email: member.email,
                phone: member.phone,
                state_code: null, // Team API doesn't return this yet
                is_active: true,
                created_at: member.joinedAt,
            })) || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents();

        // Fetch manager profile
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/settings/profile');
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        can_create_agents: data.can_create_agents === true,
                        state_code: data.state_code,
                    });
                }
            } catch {
                // Ignore
            }
        };
        fetchProfile();
    }, [fetchAgents]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
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
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6" />
                        Users
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Create and manage agents in your team
                    </p>
                </div>
                {profile?.can_create_agents && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Create Agent
                    </button>
                )}
            </div>

            {/* Permission Notice */}
            {!profile?.can_create_agents && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                        <Shield className="w-5 h-5" />
                        <p className="text-sm">
                            <strong>Permission Required:</strong> You don't have permission to create agents.
                            Contact your DCA Admin to enable agent creation rights.
                        </p>
                    </div>
                </div>
            )}

            {/* State Info */}
            {profile?.state_code && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Your State Assignment:</strong> {profile.state_code} —
                        New agents will inherit this state assignment.
                    </p>
                </div>
            )}

            {/* Agents Grid */}
            {agents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-primary font-semibold">
                                            {agent.full_name?.charAt(0) || 'A'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                            {agent.full_name}
                                        </h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${agent.is_active
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {agent.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#222] rounded">
                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Mail className="w-4 h-4" />
                                    <span className="truncate">{agent.email}</span>
                                </div>
                                {agent.phone && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Phone className="w-4 h-4" />
                                        <span>{agent.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>Joined {new Date(agent.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Agents Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {profile?.can_create_agents
                            ? 'Create your first agent to start building your team.'
                            : 'No agents are assigned to your team yet.'}
                    </p>
                    {profile?.can_create_agents && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            Create First Agent
                        </button>
                    )}
                </div>
            )}

            {/* Create Agent Modal */}
            <CreateAgentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    fetchAgents();
                }}
            />
        </div>
    );
}
