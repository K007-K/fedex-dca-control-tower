'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRegion } from '@/lib/context/RegionContext';

interface PortfolioSummary {
    avgPriority: number;
    avgRecoveryRate: number;
    expectedRecovery: number;
    highRiskCount: number;
    caseCount: number;
    dataSource: 'real' | 'sample';
    currency: string;
}

export function MLInsightsPanel() {
    const [isLoading, setIsLoading] = useState(true);
    const [mlServiceStatus, setMlServiceStatus] = useState<'online' | 'offline'>('offline');
    const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { region } = useRegion();

    const fetchMLInsights = useCallback(async () => {
        try {
            // Use the dedicated ML insights endpoint (server-side auth)
            const regionParam = region !== 'ALL' ? `?region=${region}` : '';
            const response = await fetch(`/api/ml/insights${regionParam}`);

            if (response.ok) {
                const data = await response.json();
                setPortfolioSummary({
                    avgPriority: data.avgPriority || 0,
                    avgRecoveryRate: data.avgRecoveryRate || 0,
                    expectedRecovery: data.expectedRecovery || 0,
                    highRiskCount: data.highRiskCount || 0,
                    caseCount: data.caseCount || 0,
                    dataSource: data.dataSource || 'sample',
                    currency: data.currency || 'USD',
                });
                setMlServiceStatus('online');
            } else {
                // Fallback to sample data
                setPortfolioSummary({
                    avgPriority: 75,
                    avgRecoveryRate: 65,
                    expectedRecovery: 500000,
                    highRiskCount: 3,
                    caseCount: 0,
                    dataSource: 'sample',
                    currency: region === 'INDIA' ? 'INR' : 'USD',
                });
                setMlServiceStatus('offline');
            }
        } catch (e) {
            console.error('ML Insights error:', e);
            setError('Failed to load ML insights');
            setMlServiceStatus('offline');
        }
    }, [region]);

    useEffect(() => {
        const loadInsights = async () => {
            setIsLoading(true);
            setError(null);
            await fetchMLInsights();
            setIsLoading(false);
        };

        loadInsights();
    }, [fetchMLInsights]);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-[#1a1a1a] rounded w-48" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered Insights</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {portfolioSummary?.dataSource === 'real'
                                ? `Analyzing ${portfolioSummary.caseCount} cases`
                                : 'Sample data preview'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-purple-500 dark:text-purple-400 font-medium bg-purple-100 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                        Automated insight (ML-assisted)
                    </span>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 ${mlServiceStatus === 'online'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${mlServiceStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        {mlServiceStatus === 'online' ? 'Live' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* ML Automation Notice */}
            <div className="mb-4 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <span className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-medium">Automated insight (ML-assisted)</span>
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
                            <p className="text-xs text-gray-500 dark:text-gray-500">Expected Recovery</p>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {portfolioSummary.currency === 'INR' ? '₹' : '$'}
                            {portfolioSummary.expectedRecovery.toLocaleString()}
                        </p>
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
