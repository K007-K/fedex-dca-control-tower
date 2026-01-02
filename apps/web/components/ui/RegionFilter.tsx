'use client';

import { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

export type Region = 'ALL' | 'INDIA' | 'AMERICAS' | 'EMEA' | 'APAC';

interface RegionOption {
    value: Region;
    label: string;
    flag: string;
    currency?: string;
}

const REGIONS: RegionOption[] = [
    { value: 'ALL', label: 'All Regions', flag: '🌍' },
    { value: 'INDIA', label: 'India', flag: '🇮🇳', currency: 'INR' },
    { value: 'AMERICAS', label: 'Americas', flag: '🇺🇸', currency: 'USD' },
    { value: 'EMEA', label: 'Europe/ME/Africa', flag: '🇪🇺', currency: 'EUR' },
    { value: 'APAC', label: 'Asia Pacific', flag: '🌏', currency: 'USD' },
];

interface RegionFilterProps {
    value: Region;
    onChange: (region: Region) => void;
    showAllOption?: boolean;
    disabled?: boolean;
    className?: string;
}

export function RegionFilter({
    value,
    onChange,
    showAllOption = true,
    disabled = false,
    className = '',
}: RegionFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    const options = showAllOption ? REGIONS : REGIONS.filter(r => r.value !== 'ALL');
    const selectedRegion = REGIONS.find(r => r.value === value) || REGIONS[0];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.region-filter')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className={`region-filter relative ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border
          bg-white dark:bg-gray-800
          border-gray-200 dark:border-gray-700
          hover:bg-gray-50 dark:hover:bg-gray-700
          transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="text-lg">{selectedRegion.flag}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {selectedRegion.label}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {options.map((region) => (
                        <button
                            key={region.value}
                            onClick={() => {
                                onChange(region.value);
                                setIsOpen(false);
                            }}
                            className={`
                w-full flex items-center gap-3 px-3 py-2 text-left
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors duration-150
                ${value === region.value ? 'bg-purple-50 dark:bg-purple-900/20' : ''}
              `}
                        >
                            <span className="text-lg">{region.flag}</span>
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-200">
                                {region.label}
                            </span>
                            {value === region.value && (
                                <Check className="h-4 w-4 text-purple-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Currency formatting helper
export function formatCurrency(amount: number, region: Region | string): string {
    const currencyMap: Record<string, { locale: string; currency: string; symbol: string }> = {
        INDIA: { locale: 'en-IN', currency: 'INR', symbol: '₹' },
        AMERICA: { locale: 'en-US', currency: 'USD', symbol: '$' },
        EUROPE: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
        APAC: { locale: 'en-SG', currency: 'SGD', symbol: 'S$' },
    };

    const config = currencyMap[region] || currencyMap.AMERICA;

    try {
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${config.symbol}${amount.toLocaleString()}`;
    }
}

// Region badge component
export function RegionBadge({ region }: { region: string }) {
    const regionData = REGIONS.find(r => r.value === region);

    if (!regionData) return null;

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <span>{regionData.flag}</span>
            <span>{regionData.label}</span>
        </span>
    );
}

export { REGIONS };
