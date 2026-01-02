'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Region = 'ALL' | 'INDIA' | 'AMERICA' | 'EUROPE' | 'APAC';

interface RegionContextType {
    region: Region;
    setRegion: (region: Region) => void;
    isGlobalUser: boolean; // Can view all regions
    setIsGlobalUser: (isGlobal: boolean) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

const REGION_STORAGE_KEY = 'fedex-selected-region';

export function RegionProvider({ children }: { children: ReactNode }) {
    const [region, setRegionState] = useState<Region>('ALL');
    const [isGlobalUser, setIsGlobalUser] = useState(true);

    // Load from localStorage on mount (client-side only)
    useEffect(() => {
        const stored = localStorage.getItem(REGION_STORAGE_KEY);
        if (stored && ['ALL', 'INDIA', 'AMERICA', 'EUROPE', 'APAC'].includes(stored)) {
            setRegionState(stored as Region);
        }
    }, []);

    // Save to localStorage when region changes
    const setRegion = (newRegion: Region) => {
        setRegionState(newRegion);
        if (typeof window !== 'undefined') {
            localStorage.setItem(REGION_STORAGE_KEY, newRegion);
        }
    };

    // Always provide context - use default 'ALL' region initially
    return (
        <RegionContext.Provider value={{ region, setRegion, isGlobalUser, setIsGlobalUser }}>
            {children}
        </RegionContext.Provider>
    );
}

export function useRegion() {
    const context = useContext(RegionContext);
    if (context === undefined) {
        throw new Error('useRegion must be used within a RegionProvider');
    }
    return context;
}

// Hook to get region query param for API calls
export function useRegionFilter() {
    const { region } = useRegion();
    return region === 'ALL' ? undefined : region;
}
