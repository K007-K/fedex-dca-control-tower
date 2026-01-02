'use client';

import { useRegion } from '@/lib/context/RegionContext';
import { useEffect, useState } from 'react';

interface DashboardData {
    metrics: {
        totalCases: number;
        activeDCAs: number;
        recoveryRate: number;
        slaCompliance: number;
        pendingCases: number;
        totalRecovered: number;
        totalOutstanding: number;
        trends: {
            casesTrend: number;
            dcasTrend: number;
            recoveryTrend: number;
            slaTrend: number;
        };
    };
    recentCases: Array<{
        id: string;
        case_number: string;
        customer_name: string;
        outstanding_amount: number;
        status: string;
        priority: string;
        created_at: string;
        currency?: string;
    }>;
    currency: 'USD' | 'INR';
}

export function useDashboardData() {
    const { region } = useRegion();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const regionParam = region !== 'ALL' ? `?region=${region}` : '';
                const response = await fetch(`/api/dashboard${regionParam}`);

                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                } else {
                    setError('Failed to fetch dashboard data');
                }
            } catch (e) {
                console.error('Dashboard data error:', e);
                setError('Failed to fetch dashboard data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [region]);

    const currencySymbol = data?.currency === 'INR' ? '₹' : '$';

    return { data, isLoading, error, currencySymbol, region };
}

export function formatCurrency(amount: number, currency: 'USD' | 'INR' = 'USD'): string {
    const symbol = currency === 'INR' ? '₹' : '$';
    if (amount >= 1000000) {
        return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toLocaleString()}`;
}
