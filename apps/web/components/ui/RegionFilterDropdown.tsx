'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Region {
    id: string;
    name: string;
    region_code: string;
    enum_value?: string;
}

interface RegionFilterDropdownProps {
    currentRegion?: string;
    showAllOption?: boolean;
    label?: string;
    size?: 'sm' | 'md';
}

// Map region names to database ENUM values (region_type in database)
const REGION_ENUM_MAP: Record<string, string> = {
    'India': 'INDIA',
    'America': 'AMERICA',
    'Europe': 'EUROPE',
    'Asia Pacific': 'APAC',
    'Latin America': 'LATAM',
    'Middle East': 'MIDDLE_EAST',
    'Africa': 'AFRICA',
};

// Fallback regions with correct ENUM values for database filtering
const FALLBACK_REGIONS: Region[] = [
    { id: 'INDIA', name: 'India', region_code: 'IN-ALL', enum_value: 'INDIA' },
    { id: 'AMERICA', name: 'America', region_code: 'US-ALL', enum_value: 'AMERICA' },
    { id: 'EUROPE', name: 'Europe', region_code: 'EU-ALL', enum_value: 'EUROPE' },
    { id: 'APAC', name: 'Asia Pacific', region_code: 'APAC', enum_value: 'APAC' },
    { id: 'LATAM', name: 'Latin America', region_code: 'LATAM', enum_value: 'LATAM' },
    { id: 'MIDDLE_EAST', name: 'Middle East', region_code: 'ME-ALL', enum_value: 'MIDDLE_EAST' },
    { id: 'AFRICA', name: 'Africa', region_code: 'AF-ALL', enum_value: 'AFRICA' },
];

export function RegionFilterDropdown({
    currentRegion,
    showAllOption = true,
    label = 'Region',
    size = 'md',
}: RegionFilterDropdownProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [regions, setRegions] = useState<Region[]>(FALLBACK_REGIONS);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRegions() {
            try {
                const res = await fetch('/api/regions');
                if (res.ok) {
                    const data = await res.json();
                    const apiRegions = data.data || data.regions || [];

                    if (apiRegions.length > 0) {
                        const mappedRegions = apiRegions.map((r: Region) => ({
                            ...r,
                            enum_value: REGION_ENUM_MAP[r.name] || r.name.toUpperCase().replace(/\s+/g, '_'),
                        }));
                        setRegions(mappedRegions);
                    } else {
                        setRegions(FALLBACK_REGIONS);
                    }
                } else {
                    setRegions(FALLBACK_REGIONS);
                }
            } catch (error) {
                console.error('Failed to fetch regions:', error);
                setRegions(FALLBACK_REGIONS);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRegions();
    }, []);

    const handleRegionChange = (enumValue: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (enumValue === 'ALL' || !enumValue) {
            params.delete('region');
        } else {
            params.set('region', enumValue);
        }

        params.delete('page');
        const queryString = params.toString();
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
    };

    const selectedRegion = currentRegion || searchParams.get('region') || 'ALL';
    const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';

    if (isLoading) {
        return <div className={`${sizeClasses} bg-gray-100 dark:bg-[#1a1a1a] rounded-lg animate-pulse w-32 h-8`} />;
    }

    return (
        <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}:</label>
            <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className={`${sizeClasses} bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer`}
            >
                {showAllOption && <option value="ALL">All Regions</option>}
                {regions.map((region) => (
                    <option key={region.id} value={region.enum_value || region.id}>
                        {region.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
