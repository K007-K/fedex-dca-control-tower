'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Region = 'ALL' | 'INDIA' | 'AMERICAS' | 'EMEA' | 'APAC';

interface RegionContextType {
    region: Region;
    setRegion: (region: Region) => void;
    isGlobalUser: boolean; // Can view all regions
    setIsGlobalUser: (isGlobal: boolean) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

const REGION_STORAGE_KEY = 'fedex-selected-region';
export const REGION_COOKIE_NAME = 'fedex-region';

// Helper to set cookie
function setCookie(name: string, value: string, days: number = 365) {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Helper to get cookie
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

export function RegionProvider({ children }: { children: ReactNode }) {
    const [region, setRegionState] = useState<Region>('ALL');
    const [isGlobalUser, setIsGlobalUser] = useState(true);

    // Load from cookie/localStorage on mount (client-side only)
    useEffect(() => {
        // Try cookie first (for server sync)
        const cookieRegion = getCookie(REGION_COOKIE_NAME);
        if (cookieRegion && ['ALL', 'INDIA', 'AMERICAS', 'EMEA', 'APAC'].includes(cookieRegion)) {
            setRegionState(cookieRegion as Region);
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem(REGION_STORAGE_KEY);
            if (stored && ['ALL', 'INDIA', 'AMERICAS', 'EMEA', 'APAC'].includes(stored)) {
                setRegionState(stored as Region);
                // Sync to cookie for server
                setCookie(REGION_COOKIE_NAME, stored);
            }
        }
    }, []);

    // Save to cookie AND localStorage when region changes
    const setRegion = (newRegion: Region) => {
        setRegionState(newRegion);
        if (typeof window !== 'undefined') {
            localStorage.setItem(REGION_STORAGE_KEY, newRegion);
            setCookie(REGION_COOKIE_NAME, newRegion);
            // Trigger page refresh to apply server-side filtering
            window.location.reload();
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

