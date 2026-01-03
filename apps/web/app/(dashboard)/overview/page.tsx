'use client';

/**
 * Control Tower Overview Page
 * 
 * Orients non-technical users and clients before they interact with data.
 * Read-only page - no backend mutations, no fake data.
 */

import {
    Bot,
    Users,
    ShieldCheck,
    FileText,
    ArrowRight,
    AlertTriangle,
    CheckCircle,
    Lock,
    ClipboardCheck,
    Building2,
    UserCheck,
    Eye,
} from 'lucide-react';
import { DemoPageMessage } from '@/components/demo/DemoModeComponents';

export default function OverviewPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            {/* Demo Mode Message */}
            <DemoPageMessage
                step={1}
                message="This page explains the system's governance-first design. SYSTEM handles automation, humans operate within governed workflows."
            />

            {/* Header */}
            <div className="bg-white dark:bg-[#111] border-b border-gray-200 dark:border-[#222] px-8 py-12">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
                        <ShieldCheck className="w-4 h-4" />
                        Governance-First Platform
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        FedEx DCA Control Tower
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                        A centralized command center that governs case creation, allocation,
                        workflows, and SLA enforcement across regions and debt collection partners.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-12 space-y-16">
                {/* Section 1: What This System Is */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            What This System Is
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-[#111] rounded-2xl p-8 border border-gray-200 dark:border-[#222] shadow-sm">
                        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                            This is a <strong className="text-slate-900 dark:text-white">FedEx Debt Collection Control Tower</strong>.
                            It governs case creation, allocation, workflows, and SLA enforcement
                            across regions and partners.
                        </p>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-slate-700 dark:text-slate-300">Automated case routing</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-slate-700 dark:text-slate-300">Region-aware SLA tracking</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-slate-700 dark:text-slate-300">Complete audit trail</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Who Does What */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Who Does What
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* SYSTEM Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">SYSTEM</h3>
                            </div>
                            <p className="text-blue-100 text-sm mb-4">Automated (Non-Human)</p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-200" />
                                    <span>Creates cases from ERP</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-200" />
                                    <span>Assigns DCAs automatically</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-200" />
                                    <span>Enforces SLA rules</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-200" />
                                    <span>Triggers escalations</span>
                                </li>
                            </ul>
                        </div>

                        {/* FedEx Card */}
                        <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-200 dark:border-[#222] shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Building2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">FedEx</h3>
                            </div>
                            <p className="text-slate-500 text-sm mb-4">Oversight & Exceptions</p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    <span>Monitor global performance</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    <span>Handle manual exceptions</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    <span>Review escalations</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    <span>Close resolved cases</span>
                                </li>
                            </ul>
                        </div>

                        {/* DCA Card */}
                        <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-200 dark:border-[#222] shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">DCA Partners</h3>
                            </div>
                            <p className="text-slate-500 text-sm mb-4">Execution via Workflow</p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <ClipboardCheck className="w-4 h-4 text-slate-400" />
                                    <span>Work assigned cases</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <ClipboardCheck className="w-4 h-4 text-slate-400" />
                                    <span>Update case status</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <ClipboardCheck className="w-4 h-4 text-slate-400" />
                                    <span>Contact customers</span>
                                </li>
                                <li className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                    <ClipboardCheck className="w-4 h-4 text-slate-400" />
                                    <span>Record recovery</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* SUPER_ADMIN Note */}
                    <div className="mt-6 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl p-4 flex items-center gap-4">
                        <div className="p-2 bg-gray-200 dark:bg-[#222] rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                            <span className="font-semibold text-slate-900 dark:text-white">SUPER_ADMIN</span>
                            <span className="text-slate-600 dark:text-slate-400"> — Governance only. Read-only global visibility, security settings, no operational powers.</span>
                        </div>
                    </div>
                </section>

                {/* Section 3: How a Case Flows */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ArrowRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            How a Case Flows
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-[#111] rounded-2xl p-8 border border-gray-200 dark:border-[#222] shadow-sm">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            {/* Step 1 */}
                            <div className="flex-1 text-center">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                                </div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Case Created</h4>
                                <p className="text-sm text-slate-500">by SYSTEM (ERP)</p>
                            </div>
                            <ArrowRight className="hidden md:block w-6 h-6 text-slate-300" />
                            {/* Step 2 */}
                            <div className="flex-1 text-center">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
                                </div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Auto-Assigned</h4>
                                <p className="text-sm text-slate-500">to best DCA</p>
                            </div>
                            <ArrowRight className="hidden md:block w-6 h-6 text-slate-300" />
                            {/* Step 3 */}
                            <div className="flex-1 text-center">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-orange-600 dark:text-orange-400 font-bold">3</span>
                                </div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Worked</h4>
                                <p className="text-sm text-slate-500">via governed workflow</p>
                            </div>
                            <ArrowRight className="hidden md:block w-6 h-6 text-slate-300" />
                            {/* Step 4 */}
                            <div className="flex-1 text-center">
                                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">4</span>
                                </div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">SLA Monitored</h4>
                                <p className="text-sm text-slate-500">automatically</p>
                            </div>
                            <ArrowRight className="hidden md:block w-6 h-6 text-slate-300" />
                            {/* Step 5 */}
                            <div className="flex-1 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-green-600 dark:text-green-400 font-bold">5</span>
                                </div>
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Resolved</h4>
                                <p className="text-sm text-slate-500">or escalated</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: System Trust Signals */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            System Trust Signals
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#111] rounded-xl p-6 border border-gray-200 dark:border-[#222] text-center">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">All Actions Audited</h4>
                            <p className="text-sm text-slate-500">Every operation is logged with actor, timestamp, and details</p>
                        </div>
                        <div className="bg-white dark:bg-[#111] rounded-xl p-6 border border-gray-200 dark:border-[#222] text-center">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Financial Data Immutable</h4>
                            <p className="text-sm text-slate-500">Core amounts and currency cannot be changed after creation</p>
                        </div>
                        <div className="bg-white dark:bg-[#111] rounded-xl p-6 border border-gray-200 dark:border-[#222] text-center">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">No Manual Assignment</h4>
                            <p className="text-sm text-slate-500">DCA allocation is automated and algorithm-driven</p>
                        </div>
                        <div className="bg-white dark:bg-[#111] rounded-xl p-6 border border-gray-200 dark:border-[#222] text-center">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">SLA System-Enforced</h4>
                            <p className="text-sm text-slate-500">Breach detection runs automatically with escalation triggers</p>
                        </div>
                    </div>
                </section>

                {/* Footer Note */}
                <div className="text-center text-slate-500 dark:text-slate-400 text-sm pt-8 border-t border-gray-200 dark:border-[#222]">
                    <p>This is a read-only overview page. Navigate to specific sections for detailed information.</p>
                </div>
            </div>
        </div>
    );
}
