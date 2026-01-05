'use client';

/**
 * Agent Overview Page
 * 
 * PURPOSE: Orients the DCA Agent to their personal workbench
 * SCOPE: Personal - only information relevant to the agent's work
 * 
 * NO governance, NO analytics, NO system-wide metrics
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    FileText,
    Clock,
    AlertTriangle,
    CheckCircle,
    Phone,
    ArrowRight,
} from 'lucide-react';

interface AgentStats {
    assignedCases: number;
    dueToday: number;
    overdueCases: number;
    completedThisWeek: number;
}

export default function AgentOverviewPage() {
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [agentName, setAgentName] = useState('Agent');

    useEffect(() => {
        async function fetchData() {
            try {
                // Get agent profile
                const profileRes = await fetch('/api/settings/profile');
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    setAgentName(profile.name || profile.email?.split('@')[0] || 'Agent');
                }

                // Get dashboard stats
                const dashRes = await fetch('/api/agent/dashboard');
                if (dashRes.ok) {
                    const data = await dashRes.json();
                    setStats({
                        assignedCases: data.workload?.assignedCases || 0,
                        dueToday: data.workload?.dueToday || 0,
                        overdueCases: data.workload?.overdueCases || 0,
                        completedThisWeek: 0, // TODO: Fetch from completed cases
                    });
                }
            } catch (e) {
                console.error('Overview fetch error:', e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Welcome Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Welcome, {agentName}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Your personal workbench for debt recovery
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <StatCard
                        icon={<FileText className="w-5 h-5" />}
                        label="Assigned Cases"
                        value={stats?.assignedCases || 0}
                        color="blue"
                    />
                    <StatCard
                        icon={<Clock className="w-5 h-5" />}
                        label="Due Today"
                        value={stats?.dueToday || 0}
                        color="yellow"
                    />
                    <StatCard
                        icon={<AlertTriangle className="w-5 h-5" />}
                        label="Overdue"
                        value={stats?.overdueCases || 0}
                        color="red"
                    />
                    <StatCard
                        icon={<CheckCircle className="w-5 h-5" />}
                        label="Completed"
                        value={stats?.completedThisWeek || 0}
                        color="green"
                    />
                </div>

                {/* How It Works */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        How Your Workbench Works
                    </h2>
                    <div className="space-y-4">
                        <WorkflowStep
                            number={1}
                            title="Cases Are Assigned To You"
                            description="Your manager assigns cases to you based on your expertise and workload."
                        />
                        <WorkflowStep
                            number={2}
                            title="Contact Customers"
                            description="Reach out to customers via phone or email to discuss their outstanding balance."
                        />
                        <WorkflowStep
                            number={3}
                            title="Update Case Status"
                            description="Log your contact attempts and update the case status as you make progress."
                        />
                        <WorkflowStep
                            number={4}
                            title="Record Payments"
                            description="When payments are made, record them to move cases toward resolution."
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <QuickAction
                            href="/agent/dashboard"
                            icon={<FileText className="w-5 h-5" />}
                            title="My Dashboard"
                            description="View your workload and pending actions"
                        />
                        <QuickAction
                            href="/agent/cases"
                            icon={<Phone className="w-5 h-5" />}
                            title="My Cases"
                            description="Work on your assigned cases"
                        />
                    </div>
                </div>

                {/* SLA Info */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        ⏰ About SLA Deadlines
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        Each case has an SLA deadline that you need to meet. The system automatically tracks
                        your progress and will show you which cases need attention first. Cases approaching
                        their deadline will appear in your "SLA Due Soon" list.
                    </p>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'blue' | 'yellow' | 'red' | 'green';
}) {
    const colors = {
        blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
        red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    };

    return (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 text-center">
            <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mx-auto mb-2`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );
}

function WorkflowStep({ number, title, description }: {
    number: number;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {number}
            </div>
            <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
    );
}

function QuickAction({ href, icon, title, description }: {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#222] transition-colors group"
        >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
        </Link>
    );
}
