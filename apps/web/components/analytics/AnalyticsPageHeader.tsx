'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RegionFilterDropdown } from '@/components/ui/RegionFilterDropdown';

interface AnalyticsPageHeaderProps {
    days: string;
}

export function AnalyticsPageHeader({ days }: AnalyticsPageHeaderProps) {
    return (
        <Suspense fallback={<div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />}>
            <AnalyticsPageHeaderContent days={days} />
        </Suspense>
    );
}

function AnalyticsPageHeaderContent({ days }: AnalyticsPageHeaderProps) {
    const searchParams = useSearchParams();
    const currentRegion = searchParams.get('region') || 'ALL';

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400">Track recovery trends and DCA performance metrics</p>
            </div>
            <div className="flex items-center gap-3">
                {/* Region Filter */}
                <RegionFilterDropdown currentRegion={currentRegion} size="md" />

                {/* Export CSV */}
                <a
                    href={`/api/reports/generate?format=csv&days=${days}&region=${currentRegion}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111] border border-gray-300 dark:border-[#222] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                </a>

                {/* Date Range Filter */}
                <DateRangeDropdown currentDays={days} currentRegion={currentRegion} />
            </div>
        </div>
    );
}

function DateRangeDropdown({ currentDays, currentRegion }: { currentDays: string; currentRegion: string }) {
    const dateRanges = [
        { value: '7', label: 'Last 7 days' },
        { value: '30', label: 'Last 30 days' },
        { value: '90', label: 'Last 90 days' },
        { value: 'all', label: 'All time' },
    ];

    return (
        <select
            defaultValue={currentDays}
            onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                params.set('days', e.target.value);
                if (currentRegion && currentRegion !== 'ALL') {
                    params.set('region', currentRegion);
                }
                window.location.href = `/analytics?${params.toString()}`;
            }}
            className="px-3 py-2 text-sm bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white"
        >
            {dateRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
            ))}
        </select>
    );
}
