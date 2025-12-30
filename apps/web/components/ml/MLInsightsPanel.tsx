'use client';

import { useEffect, useState } from 'react';

interface MLInsight {
    priority: {
        score: number;
        risk_level: string;
        recommendation: string;
    } | null;
    recovery: {
        probability: number;
        expected_amount: number;
        timeline: number;
    } | null;
}

interface PortfolioSummary {
    avgPriority: number;
    avgRecoveryRate: number;
    expectedRecovery: number;
    highRiskCount: number;
    caseCount: number;
    dataSource: 'real' | 'sample';
}

interface Case {
    id: string;
    outstanding_amount: number;
    customer_segment: string | null;
    created_at: string;
    due_date: string | null;
}

export function MLInsightsPanel() {
    const [isLoading, setIsLoading] = useState(true);
    const [mlServiceStatus, setMlServiceStatus] = useState<'online' | 'offline'>('offline');
    const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkMLService = async () => {
            try {
                const response = await fetch('http://localhost:8000/health');
                if (response.ok) {
                    setMlServiceStatus('online');
                    // P1-2 FIX: Get real cases from API instead of sample data
                    await generatePortfolioInsights();
                } else {
                    setMlServiceStatus('offline');
                }
            } catch {
                setMlServiceStatus('offline');
            } finally {
                setIsLoading(false);
            }
        };

        checkMLService();
    }, []);

    const generatePortfolioInsights = async () => {
        try {
            // P1-2 FIX: Fetch real cases from the API
            const casesResponse = await fetch('/api/cases?limit=10&status=PENDING_ALLOCATION,IN_PROGRESS,ALLOCATED');

            let casesToAnalyze: Array<{ amount: number; days: number; segment: string }> = [];
            let dataSource: 'real' | 'sample' = 'sample';

            if (casesResponse.ok) {
                const casesData = await casesResponse.json();
                const realCases = casesData.data || [];

                if (realCases.length > 0) {
                    dataSource = 'real';
                    casesToAnalyze = realCases.slice(0, 10).map((c: Case) => {
                        const createdAt = new Date(c.created_at);
                        const dueDate = c.due_date ? new Date(c.due_date) : new Date();
                        const daysPastDue = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

                        return {
                            amount: c.outstanding_amount || 0,
                            days: daysPastDue,
                            segment: c.customer_segment || 'MEDIUM',
                        };
                    });
                }
            }

            // Fallback to sample data only if no real cases available
            if (casesToAnalyze.length === 0) {
                casesToAnalyze = [
                    { amount: 50000, days: 45, segment: 'LARGE' },
                    { amount: 25000, days: 30, segment: 'MEDIUM' },
                    { amount: 75000, days: 60, segment: 'ENTERPRISE' },
                ];
                dataSource = 'sample';
            }

            let totalPriority = 0;
            let totalRecoveryRate = 0;
            let totalExpected = 0;
            let highRisk = 0;
            let successfulAnalyses = 0;

            for (const c of casesToAnalyze) {
                try {
                    const priorityRes = await fetch('http://localhost:8000/api/v1/priority/score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            outstanding_amount: c.amount,
                            days_past_due: c.days,
                            segment: c.segment,
                        }),
                    });

                    if (priorityRes.ok) {
                        const priority = await priorityRes.json();
                        totalPriority += priority.priority_score || 0;
                        if (priority.risk_level === 'HIGH' || priority.risk_level === 'CRITICAL') {
                            highRisk++;
                        }
                    }

                    const recoveryRes = await fetch('http://localhost:8000/api/v1/predict/recovery', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            outstanding_amount: c.amount,
                            days_past_due: c.days,
                            segment: c.segment,
                        }),
                    });

                    if (recoveryRes.ok) {
                        const recovery = await recoveryRes.json();
                        totalRecoveryRate += recovery.recovery_probability || 0;
                        totalExpected += recovery.expected_recovery_amount || 0;
                        successfulAnalyses++;
                    }
                } catch (e) {
                    console.error('Error analyzing case:', e);
                }
            }

            const count = successfulAnalyses || casesToAnalyze.length;

            setPortfolioSummary({
                avgPriority: Math.round(totalPriority / count),
                avgRecoveryRate: Math.round(totalRecoveryRate / count),
                expectedRecovery: Math.round(totalExpected),
                highRiskCount: highRisk,
                caseCount: casesToAnalyze.length,
                dataSource,
            });
        } catch (e) {
            console.error('Portfolio insights error:', e);
            setError('Failed to generate insights');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">AI-Powered Insights</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connecting to ML Service...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (mlServiceStatus === 'offline') {
        return (
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                            <span className="text-lg">🤖</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">AI-Powered Insights</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">ML service offline</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                        Offline
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">AI-Powered Insights</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {portfolioSummary?.dataSource === 'real'
                                ? `Analyzing ${portfolioSummary.caseCount} cases`
                                : 'Sample data preview'}
                        </p>
                    </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Live
                </span>
            </div>

            {/* Stats Grid */}
            {portfolioSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-500">Avg Priority</p>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{portfolioSummary.avgPriority}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">out of 100</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-500">High Risk</p>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{portfolioSummary.highRiskCount}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">cases need attention</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-500">Avg Recovery</p>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{portfolioSummary.avgRecoveryRate}%</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">predicted rate</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-500">Expected</p>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">${(portfolioSummary.expectedRecovery / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">recovery forecast</p>
                    </div>
                </div>
            )}

            {portfolioSummary?.dataSource === 'sample' && (
                <p className="mt-4 text-xs text-yellow-500/80">
                    ⚠️ Using sample data. Add cases to see real analysis.
                </p>
            )}

            {error && (
                <p className="mt-4 text-xs text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}
