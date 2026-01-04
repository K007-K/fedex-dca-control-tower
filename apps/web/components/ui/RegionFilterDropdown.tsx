'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Region {
    id: string;
    name: string;
    region_code: string;
}

interface RegionFilterDropdownProps {
    /** Current selected region from URL */
    currentRegion?: string;
    /** Whether to show "All Regions" option */
    showAllOption?: boolean;
    /** Label text */
    label?: string;
    /** Size variant */
    size?: 'sm' | 'md';
}

export function RegionFilterDropdown({
    currentRegion,
    showAllOption = true,
    label = 'Region',
    size = 'md',
}: RegionFilterDropdownProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [regions, setRegions] = useState<Region[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch regions on mount
    useEffect(() => {
        async function fetchRegions() {
            try {
                const res = await fetch('/api/regions');
                if (res.ok) {
                    const data = await res.json();
                    setRegions(data.regions || []);
                } else {
                    // Fallback regions
                    setRegions([
                        { id: 'INDIA', name: 'India', region_code: 'INDIA' },
                        { id: 'AMERICAS', name: 'Americas', region_code: 'AMERICAS' },
                        { id: 'EMEA', name: 'Europe, Middle East & Africa', region_code: 'EMEA' },
                        { id: 'APAC', name: 'Asia Pacific', region_code: 'APAC' },
                    ]);
                }
            } catch (error) {
                console.error('Failed to fetch regions:', error);
                // Fallback regions
                setRegions([
                    { id: 'INDIA', name: 'India', region_code: 'INDIA' },
                    { id: 'AMERICAS', name: 'Americas', region_code: 'AMERICAS' },
                    { id: 'EMEA', name: 'Europe, Middle East & Africa', region_code: 'EMEA' },
                    { id: 'APAC', name: 'Asia Pacific', region_code: 'APAC' },
                ]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRegions();
    }, []);

    // Handle region change - update URL params
    const handleRegionChange = (regionId: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (regionId === 'ALL' || !regionId) {
            params.delete('region');
        } else {
            params.set('region', regionId);
        }

        // Reset to page 1 when changing region
        params.delete('page');

        const queryString = params.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
    };

    const selectedRegion = currentRegion || searchParams.get('region') || 'ALL';

    const sizeClasses = size === 'sm'
        ? 'px-2 py-1 text-xs'
        : 'px-3 py-2 text-sm';

    if (isLoading) {
        return (
            <div className={`${sizeClasses} bg-gray-100 dark:bg-[#1a1a1a] rounded-lg animate-pulse w-32 h-8`} />
        );
    }

    return (
        <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}:
            </label>
            <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className={`${sizeClasses} bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer`}
            >
                {showAllOption && (
                    <option value="ALL">All Regions</option>
                )}
                {regions.map((region) => (
                    <option key={region.id} value={region.region_code || region.id}>
                        {region.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
