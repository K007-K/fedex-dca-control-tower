'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
    from?: Date;
    to?: Date;
    onSelect: (from: Date | undefined, to: Date | undefined) => void;
    className?: string;
}

export function DateRangePicker({ from, to, onSelect, className = '' }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [range, setRange] = useState<{ from?: Date; to?: Date }>({ from, to });

    const handleSelect = (selectedRange: { from?: Date; to?: Date } | undefined) => {
        if (selectedRange) {
            setRange(selectedRange);
            onSelect(selectedRange.from, selectedRange.to);
        }
    };

    const displayText = range.from && range.to
        ? `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`
        : range.from
            ? `${format(range.from, 'MMM dd, yyyy')} - ...`
            : 'Select date range';

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-10 px-3 py-2 text-sm text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
            >
                <span className="truncate">{displayText}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                        <DayPicker
                            mode="range"
                            selected={range}
                            onSelect={handleSelect}
                            numberOfMonths={2}
                            className="!m-0"
                        />
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => {
                                    setRange({});
                                    onSelect(undefined, undefined);
                                    setIsOpen(false);
                                }}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Clear
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
