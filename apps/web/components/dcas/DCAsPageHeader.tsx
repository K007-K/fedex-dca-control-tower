'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RegionFilterDropdown } from '@/components/ui/RegionFilterDropdown';

interface DCAsPageHeaderProps {
    canManageDCAs: boolean;
}

export function DCAsPageHeader({ canManageDCAs }: DCAsPageHeaderProps) {
    return (
        <Suspense fallback={<div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />}>
            <DCAsPageHeaderContent canManageDCAs={canManageDCAs} />
        </Suspense>
    );
}

function DCAsPageHeaderContent({ canManageDCAs }: DCAsPageHeaderProps) {
    const searchParams = useSearchParams();
    const currentRegion = searchParams.get('region') || 'ALL';

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DCAs</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage debt collection agencies and their performance</p>
            </div>
            <div className="flex items-center gap-3">
                {/* Region Filter */}
                <RegionFilterDropdown currentRegion={currentRegion} size="md" />

                <a
                    href="/dcas/compare"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111] border border-gray-300 dark:border-[#333] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition"
                >
                    📊 Compare
                </a>

                {canManageDCAs && (
                    <a
                        href="/dcas/new"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition"
                    >
                        + Add DCA
                    </a>
                )}
            </div>
        </div>
    );
}
