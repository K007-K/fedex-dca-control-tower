'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RegionFilterDropdown } from '@/components/ui/RegionFilterDropdown';

interface ReportsPageHeaderProps {
    userRole?: string;
    canExport?: boolean;
}

export function ReportsPageHeader({ userRole, canExport }: ReportsPageHeaderProps) {
    return (
        <Suspense fallback={<div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />}>
            <ReportsPageHeaderContent userRole={userRole} canExport={canExport} />
        </Suspense>
    );
}

function ReportsPageHeaderContent({ userRole, canExport }: ReportsPageHeaderProps) {
    const searchParams = useSearchParams();
    const currentRegion = searchParams.get('region') || 'ALL';

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
                <p className="text-gray-500 dark:text-gray-400">View SYSTEM-calculated metrics and generate reports</p>
            </div>
            <div className="flex items-center gap-3">
                {/* Region Filter */}
                <RegionFilterDropdown currentRegion={currentRegion} size="md" />
            </div>
        </div>
    );
}
