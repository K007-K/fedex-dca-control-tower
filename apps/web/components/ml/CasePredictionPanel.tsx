'use client';

import { useEffect, useState } from 'react';

interface CasePredictionProps {
    caseId: string;
    outstandingAmount: number;
    daysPastDue: number;
    segment: string;
}

interface PredictionData {
    priority: {
        score: number;
        risk_level: string;
        recommendation: string;
    };
    recovery: {
        probability: number;
        expected_amount: number;
        timeline_days: number;
        confidence: string;
        strategy: string;
        risk_factors: string[];
        positive_factors: string[];
    };
    roe: {
        score: number;
        top_dca: {
            name: string;
            match_score: number;
            reasons: string[];
        } | null;
        actions: Array<{
            action: string;
            priority: string;
            timeline: string;
        }>;
        escalation: string;
    };
}

export function CasePredictionPanel({
    caseId,
    outstandingAmount,
    daysPastDue,
    segment,
}: CasePredictionProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [prediction, setPrediction] = useState<PredictionData | null>(null);
    const [mlStatus, setMlStatus] = useState<'online' | 'offline'>('offline');

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                // Check ML service health
                const healthRes = await fetch('http://localhost:8000/health');
                if (!healthRes.ok) {
                    setMlStatus('offline');
                    setIsLoading(false);
                    return;
                }
                setMlStatus('online');

                // Fetch all predictions in parallel
                const [priorityRes, recoveryRes, roeRes] = await Promise.all([
                    fetch('http://localhost:8000/api/v1/priority/score', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            case_id: caseId,
                            outstanding_amount: outstandingAmount,
                            days_past_due: daysPastDue,
                            segment: segment,
                        }),
                    }),
                    fetch('http://localhost:8000/api/v1/predict/recovery', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            case_id: caseId,
                            outstanding_amount: outstandingAmount,
                            days_past_due: daysPastDue,
                            segment: segment,
                        }),
                    }),
                    fetch('http://localhost:8000/api/v1/recommend/roe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            case_id: caseId,
                            outstanding_amount: outstandingAmount,
                            days_past_due: daysPastDue,
                            segment: segment,
                        }),
                    }),
                ]);

                const priority = await priorityRes.json();
                const recovery = await recoveryRes.json();
                const roe = await roeRes.json();

                setPrediction({
                    priority: {
                        score: priority.priority_score,
                        risk_level: priority.risk_level,
                        recommendation: priority.recommendation,
                    },
                    recovery: {
                        probability: recovery.recovery_probability,
                        expected_amount: recovery.expected_recovery_amount,
                        timeline_days: recovery.expected_timeline_days,
                        confidence: recovery.confidence_level,
                        strategy: recovery.recommended_strategy,
                        risk_factors: recovery.risk_factors,
                        positive_factors: recovery.positive_factors,
                    },
                    roe: {
                        score: roe.roe_score,
                        top_dca: roe.recommended_dcas?.[0] ? {
                            name: roe.recommended_dcas[0].dca_name,
                            match_score: roe.recommended_dcas[0].match_score,
                            reasons: roe.recommended_dcas[0].match_reasons,
                        } : null,
                        actions: roe.recommended_actions?.slice(0, 3) || [],
                        escalation: roe.escalation_timeline,
                    },
                });
            } catch (error) {
                console.error('Failed to fetch predictions:', error);
                setMlStatus('offline');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPredictions();
    }, [caseId, outstandingAmount, daysPastDue, segment]);

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-indigo-200 rounded w-1/4"></div>
                    <div className="h-24 bg-indigo-100 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (mlStatus === 'offline') {
        return (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <span>🤖</span>
                    <span className="text-sm">AI predictions unavailable - ML service offline</span>
                </div>
            </div>
        );
    }

    if (!prediction) return null;

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'text-red-600 bg-red-100';
            case 'HIGH': return 'text-orange-600 bg-orange-100';
            case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
            case 'LOW': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <h3 className="text-lg font-bold text-gray-800">AI Predictions</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">● Live</span>
                </div>
            </div>

            {/* Priority & Recovery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority Score */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">Priority Score</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getRiskColor(prediction.priority.risk_level)}`}>
                            {prediction.priority.risk_level}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-indigo-600">{prediction.priority.score}</p>
                    <p className="text-xs text-gray-500 mt-1">out of 100</p>
                </div>

                {/* Recovery Probability */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">Recovery Rate</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {prediction.recovery.confidence}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{prediction.recovery.probability}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                        ~{prediction.recovery.timeline_days} days
                    </p>
                </div>

                {/* Expected Amount */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">Expected Recovery</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                        ${prediction.recovery.expected_amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">forecasted amount</p>
                </div>
            </div>

            {/* Strategy & Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recommended Strategy */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Recommended Strategy</h4>
                    <p className="text-sm text-gray-600">{prediction.recovery.strategy}</p>

                    {prediction.roe.top_dca && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Best DCA Match:</p>
                            <p className="text-sm font-medium text-indigo-600">
                                {prediction.roe.top_dca.name} ({prediction.roe.top_dca.match_score}% match)
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Items */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">📋 Recommended Actions</h4>
                    <ul className="space-y-2">
                        {prediction.roe.actions.map((action, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${action.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                        action.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {action.priority}
                                </span>
                                <span className="text-gray-600">{action.action}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Factors */}
            {(prediction.recovery.risk_factors.length > 0 || prediction.recovery.positive_factors.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {prediction.recovery.positive_factors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {prediction.recovery.positive_factors.map((f, i) => (
                                <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                                    ✓ {f}
                                </span>
                            ))}
                        </div>
                    )}
                    {prediction.recovery.risk_factors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {prediction.recovery.risk_factors.map((f, i) => (
                                <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs">
                                    ⚠ {f}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
