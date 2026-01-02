'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// Using Photon API (OpenStreetMap) - FREE, no API key needed
// Supports worldwide addresses including streets, districts, colonies

interface PhotonFeature {
    properties: {
        name?: string;
        street?: string;
        housenumber?: string;
        city?: string;
        state?: string;
        country?: string;
        postcode?: string;
        district?: string;
        locality?: string;
        county?: string;
    };
    geometry: {
        type: string;
        coordinates: [number, number];
    };
}

interface LocationSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

// Format the address from Photon properties
function formatAddress(props: PhotonFeature['properties']): string {
    const parts: string[] = [];

    if (props.name) parts.push(props.name);
    if (props.street) {
        const street = props.housenumber
            ? `${props.housenumber} ${props.street}`
            : props.street;
        if (!parts.includes(street)) parts.push(street);
    }
    if (props.locality && !parts.includes(props.locality)) parts.push(props.locality);
    if (props.district && !parts.includes(props.district)) parts.push(props.district);
    if (props.city && !parts.includes(props.city)) parts.push(props.city);
    if (props.state && !parts.includes(props.state)) parts.push(props.state);
    if (props.country) parts.push(props.country);

    return parts.join(', ');
}

// Get short display text
function getDisplayText(props: PhotonFeature['properties']): { main: string; secondary: string } {
    const main = props.name || props.street || props.city || props.state || 'Unknown';

    const secondaryParts: string[] = [];
    if (props.district) secondaryParts.push(props.district);
    if (props.city && props.city !== main) secondaryParts.push(props.city);
    if (props.state && props.state !== main) secondaryParts.push(props.state);
    if (props.country) secondaryParts.push(props.country);

    return {
        main,
        secondary: secondaryParts.join(', ')
    };
}

export function LocationSearch({ value, onChange, placeholder = 'Search any location...', disabled = false }: LocationSearchProps) {
    const [inputValue, setInputValue] = useState(value);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const debouncedSearch = useDebounce(inputValue, 300);

    // Update input when value prop changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Fetch suggestions from Photon API (OpenStreetMap - FREE)
    const fetchSuggestions = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim() || searchTerm.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Photon API - completely free, no API key needed
            const response = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(searchTerm)}&limit=10`
            );

            if (response.ok) {
                const data = await response.json();
                setSuggestions(data.features || []);
            }
        } catch (error) {
            console.error('Failed to fetch location suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Trigger search when debounced value changes
    useEffect(() => {
        if (debouncedSearch && debouncedSearch.length >= 2) {
            fetchSuggestions(debouncedSearch);
        } else {
            setSuggestions([]);
        }
    }, [debouncedSearch, fetchSuggestions]);

    // Handle click outside to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setShowSuggestions(true);
    };

    const handleSuggestionClick = (feature: PhotonFeature) => {
        const selectedValue = formatAddress(feature.properties);
        setInputValue(selectedValue);
        onChange(selectedValue);
        setShowSuggestions(false);
    };

    const handleFocus = () => {
        setShowSuggestions(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={placeholder}
                className={`w-full px-4 py-2 pr-10 border border-gray-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            />

            {/* Search/Loading icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((feature, index) => {
                        const display = getDisplayText(feature.properties);
                        return (
                            <button
                                key={`${feature.geometry.coordinates.join(',')}-${index}`}
                                type="button"
                                onClick={() => handleSuggestionClick(feature)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#222] flex flex-col border-b border-gray-100 dark:border-[#333] last:border-b-0"
                            >
                                <span className="text-gray-900 dark:text-white font-medium">
                                    {display.main}
                                </span>
                                {display.secondary && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {display.secondary}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Helper text when typing */}
            {showSuggestions && inputValue.length > 0 && inputValue.length < 2 && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Type at least 2 characters to search...
                    </p>
                </div>
            )}

            {/* No results message */}
            {showSuggestions && suggestions.length === 0 && inputValue.length >= 2 && !isLoading && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg shadow-lg p-3">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No locations found. Using: <strong className="text-gray-900 dark:text-white">{inputValue}</strong>
                    </p>
                </div>
            )}
        </div>
    );
}

export default LocationSearch;
