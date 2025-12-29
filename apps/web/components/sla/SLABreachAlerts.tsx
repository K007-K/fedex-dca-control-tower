'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SLABreachCase {
    id: string;
    case_number: string;
    customer_name: string;
    sla_due_at: string;
    status: string;
    hoursUntilBreach: number;
}

export function SLABreachAlerts() {
    const [breachCases, setBreachCases] = useState<SLABreachCase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkBreaches = async () => {
            try {
                const res = await fetch('/api/sla/breach-check');
                if (res.ok) {
                    const data = await res.json();
                    setBreachCases(data.atRiskCases || []);
                }
            } catch (error) {
                console.error('Failed to check SLA breaches:', error);
            } finally {
                setLoading(false);
            }
        };

        checkBreaches();
        // Check every 5 minutes
        const interval = setInterval(checkBreaches, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading || breachCases.length === 0) {
        return null;
    }

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div className="flex-1">
                    <h3 className="font-semibold text-red-800">SLA Breach Alert</h3>
                    <p className="text-sm text-red-700 mb-3">
                        {breachCases.length} case{breachCases.length > 1 ? 's' : ''} at risk of SLA breach
                    </p>
                    <div className="space-y-2">
                        {breachCases.slice(0, 5).map(c => (
                            <Link
                                key={c.id}
                                href={`/cases/${c.id}`}
                                className="flex items-center justify-between p-2 bg-white rounded border border-red-100 hover:border-red-300 transition-colors"
                            >
                                <div>
                                    <span className="font-medium text-gray-900">{c.case_number}</span>
                                    <span className="text-sm text-gray-500 ml-2">{c.customer_name}</span>
                                </div>
                                <span className={`text-sm font-medium ${c.hoursUntilBreach <= 0 ? 'text-red-600' :
                                        c.hoursUntilBreach <= 2 ? 'text-orange-600' : 'text-yellow-600'
                                    }`}>
                                    {c.hoursUntilBreach <= 0 ? 'BREACHED' :
                                        c.hoursUntilBreach < 1 ? `${Math.round(c.hoursUntilBreach * 60)}m left` :
                                            `${Math.round(c.hoursUntilBreach)}h left`}
                                </span>
                            </Link>
                        ))}
                    </div>
                    {breachCases.length > 5 && (
                        <Link href="/cases?status=SLA_AT_RISK" className="text-sm text-red-700 hover:underline mt-2 inline-block">
                            View all {breachCases.length} at-risk cases →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
