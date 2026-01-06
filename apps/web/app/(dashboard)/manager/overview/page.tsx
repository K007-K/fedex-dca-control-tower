'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Manager Overview Page
 * 
 * MANDATORY per governance spec:
 * - Role purpose statement
 * - "What you CAN do" list
 * - "What you CANNOT do" list
 * - Start guided demo button
 */

export default function ManagerOverviewPage() {
    const [showDemo, setShowDemo] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Manager Workbench
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Supervise your team and manage case workload
                </p>
            </div>

            {/* Role Purpose */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-white text-xl flex-shrink-0">
                        👔
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Your Role: DCA Manager
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                            As a DCA Manager, you supervise agents within your DCA organization. Your primary
                            responsibilities are managing workload distribution, monitoring team performance,
                            and ensuring SLA compliance across your team.
                        </p>
                    </div>
                </div>
            </div>

            {/* Capabilities Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* What you CAN do */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm">✓</span>
                        What You CAN Do
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            View all cases assigned to agents in your DCA
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            Reassign cases between agents within your team
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            Escalate cases to DCA Admin when needed
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            Monitor team workload and SLA adherence
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            Work on cases directly (same actions as agents)
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            View agent operational metrics (cases, resolution)
                        </li>
                    </ul>
                </div>

                {/* What you CANNOT do */}
                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-sm">✗</span>
                        What You CANNOT Do
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            See cases from other DCAs
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            Access FedEx governance or analytics
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            Modify SLA templates or configurations
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            Create or manage user accounts
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            Override SLA deadlines
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            Rank agents or view incentive/commission data
                        </li>
                    </ul>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/manager/dashboard"
                        className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                        <span className="text-2xl mb-2">📊</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard</span>
                    </Link>
                    <Link
                        href="/manager/cases"
                        className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                        <span className="text-2xl mb-2">📁</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Cases</span>
                    </Link>
                    <Link
                        href="/manager/team"
                        className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                        <span className="text-2xl mb-2">👥</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">My Team</span>
                    </Link>
                    <Link
                        href="/manager/notifications"
                        className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                        <span className="text-2xl mb-2">🔔</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</span>
                    </Link>
                </div>
            </div>

            {/* Guided Demo */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">New to Manager Workbench?</h3>
                        <p className="text-yellow-100 mt-1">
                            Take a guided tour to learn how to supervise your team effectively
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDemo(true)}
                        className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-yellow-50 transition-colors flex items-center gap-2"
                    >
                        <span>🎯</span>
                        Start Demo
                    </button>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    How Manager Workbench Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xl mx-auto mb-3">
                            1
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Monitor Workload</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            View team cases, SLA status, and at-risk accounts
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xl mx-auto mb-3">
                            2
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Balance Team</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Reassign cases to balance workload across agents
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xl mx-auto mb-3">
                            3
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">Escalate Issues</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Escalate difficult cases to DCA Admin when needed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
