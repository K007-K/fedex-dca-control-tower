'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * DCA_ADMIN Overview Page
 * 
 * PURPOSE: Explain vendor responsibility & boundaries with guided demo
 * SCOPE: Only own DCA information
 * 
 * Per MASTER UI SPEC:
 * - "Your Role" - vendor ownership & performance
 * - "What You Can Do" - create managers & agents, monitor SLA
 * - "What You Cannot Do" - see other DCAs, change FedEx policies
 * - Guided Demo (read-only)
 */

const ADMIN_DEMO_STEPS = [
    {
        id: 1,
        title: 'DCA Performance Overview',
        description: 'See how your DCA is performing with key metrics and SLA compliance',
        highlight: 'dashboard',
    },
    {
        id: 2,
        title: 'User Management Flow',
        description: 'Learn how to create and manage DCA managers and agents',
        highlight: 'team',
    },
    {
        id: 3,
        title: 'How Escalations Reach You',
        description: 'Understand the escalation chain from agents to managers to you',
        highlight: 'escalations',
    },
    {
        id: 4,
        title: 'When FedEx Intervenes',
        description: 'Know when issues escalate beyond your control to FedEx',
        highlight: 'fedex',
    },
];

export default function AdminOverviewPage() {
    const [demoStep, setDemoStep] = useState(0);
    const [demoActive, setDemoActive] = useState(false);

    const startDemo = () => {
        setDemoActive(true);
        setDemoStep(1);
    };

    const nextStep = () => {
        if (demoStep < ADMIN_DEMO_STEPS.length) {
            setDemoStep(demoStep + 1);
        } else {
            setDemoActive(false);
            setDemoStep(0);
        }
    };

    const prevStep = () => {
        if (demoStep > 1) {
            setDemoStep(demoStep - 1);
        }
    };

    const endDemo = () => {
        setDemoActive(false);
        setDemoStep(0);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DCA Admin Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400">Your role, responsibilities, and boundaries</p>
                </div>
                {!demoActive && (
                    <button
                        onClick={startDemo}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <span>🎯</span>
                        Start Guided Demo
                    </button>
                )}
            </div>

            {/* Demo Step Indicator */}
            {demoActive && (
                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-primary font-medium">Guided Demo - Step {demoStep} of {ADMIN_DEMO_STEPS.length}</p>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {ADMIN_DEMO_STEPS[demoStep - 1]?.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {ADMIN_DEMO_STEPS[demoStep - 1]?.description}
                            </p>
                        </div>
                        <button onClick={endDemo} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {ADMIN_DEMO_STEPS.map((step) => (
                            <div
                                key={step.id}
                                className={`flex-1 h-2 rounded-full transition-colors ${step.id <= demoStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between mt-4">
                        <button
                            onClick={prevStep}
                            disabled={demoStep === 1}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 disabled:opacity-50"
                        >
                            ← Previous
                        </button>
                        <button
                            onClick={nextStep}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            {demoStep === ADMIN_DEMO_STEPS.length ? 'Finish' : 'Next →'}
                        </button>
                    </div>
                </div>
            )}

            {/* Your Role Section */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-xl">👤</span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Role</h2>
                </div>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                    <p>As a <strong className="text-gray-900 dark:text-white">DCA Admin</strong>, you are the Vendor Owner / Account Admin for your DCA.</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>You <strong className="text-primary">own the relationship</strong> between FedEx and your DCA</li>
                        <li>You <strong className="text-primary">manage internal users</strong> (Managers & Agents)</li>
                        <li>You <strong className="text-primary">monitor overall DCA performance</strong> & SLA adherence</li>
                        <li>You <strong className="text-primary">act as escalation receiver</strong> from DCA_MANAGER</li>
                    </ul>
                </div>
            </div>

            {/* What You Can Do Section */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-green-200 dark:border-green-900/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <span className="text-xl">✅</span>
                    </div>
                    <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">What You Can Do</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 mt-1">•</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Create Managers & Agents</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Add new users to your DCA team</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 mt-1">•</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Monitor SLA Adherence</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Track your DCA's SLA compliance</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 mt-1">•</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">View All DCA Cases</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">See all cases assigned to your DCA</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 mt-1">•</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Resolve Escalations</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Handle issues escalated by managers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* What You Cannot Do Section */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-red-200 dark:border-red-900/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <span className="text-xl">🚫</span>
                    </div>
                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">What You Cannot Do</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <span className="text-red-500 mt-1">×</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">See Other DCAs</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Your view is limited to your own DCA</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-red-500 mt-1">×</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Change FedEx Policies</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">SLA templates and policies are FedEx-managed</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-red-500 mt-1">×</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Modify SLA Templates</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">SLA rules are controlled by FedEx</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-red-500 mt-1">×</span>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Access Global Analytics</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cross-DCA analytics are FedEx-only</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/admin/dashboard"
                    className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 hover:border-primary/50 transition-colors group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📊</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Dashboard</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View your DCA performance metrics</p>
                </Link>
                <Link
                    href="/admin/team"
                    className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 hover:border-primary/50 transition-colors group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">👥</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Team</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your managers and agents</p>
                </Link>
                <Link
                    href="/admin/cases"
                    className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 hover:border-primary/50 transition-colors group"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📁</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Cases</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View all cases in your DCA</p>
                </Link>
            </div>
        </div>
    );
}
