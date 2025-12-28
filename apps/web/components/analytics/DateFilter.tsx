'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface DateFilterProps {
    currentRange?: string;
}

const DATE_RANGES = [
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '180', label: 'Last 6 months' },
    { value: '365', label: 'This year' },
    { value: 'all', label: 'All time' },
];

export function DateFilter({ currentRange = '30' }: DateFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString());
        const value = e.target.value;

        if (value === 'all') {
            params.delete('days');
        } else {
            params.set('days', value);
        }

        router.push(`?${params.toString()}`);
        router.refresh();
    }, [router, searchParams]);

    return (
        <select
            value={currentRange}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
            {DATE_RANGES.map(range => (
                <option key={range.value} value={range.value}>
                    {range.label}
                </option>
            ))}
        </select>
    );
}
