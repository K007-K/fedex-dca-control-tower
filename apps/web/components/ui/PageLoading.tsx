'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface PageLoadingContextType {
    isLoading: boolean;
    startLoading: () => void;
    stopLoading: () => void;
}

const PageLoadingContext = createContext<PageLoadingContextType>({
    isLoading: false,
    startLoading: () => { },
    stopLoading: () => { },
});

export function usePageLoading() {
    return useContext(PageLoadingContext);
}

/**
 * Page Loading Provider
 * P2-12 FIX: Add loading indicator during page transitions
 */
export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Track navigation changes
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    const startLoading = useCallback(() => setIsLoading(true), []);
    const stopLoading = useCallback(() => setIsLoading(false), []);

    return (
        <PageLoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}
            {isLoading && <PageLoadingIndicator />}
        </PageLoadingContext.Provider>
    );
}

/**
 * Loading indicator bar at top of page
 */
function PageLoadingIndicator() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animate progress bar
        const timer1 = setTimeout(() => setProgress(30), 100);
        const timer2 = setTimeout(() => setProgress(60), 300);
        const timer3 = setTimeout(() => setProgress(80), 600);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
            <div
                className="h-1 bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

/**
 * Standalone NProgress-like loading bar
 */
export function TopLoadingBar({ isLoading }: { isLoading: boolean }) {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setProgress(0);
            const timer1 = setTimeout(() => setProgress(20), 50);
            const timer2 = setTimeout(() => setProgress(40), 200);
            const timer3 = setTimeout(() => setProgress(60), 400);
            const timer4 = setTimeout(() => setProgress(80), 800);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
                clearTimeout(timer4);
            };
        } else {
            setProgress(100);
            const hideTimer = setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 200);

            return () => clearTimeout(hideTimer);
        }
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
            <div
                className="h-0.5 bg-gradient-to-r from-primary via-primary-500 to-primary-400 transition-all duration-200 ease-out"
                style={{
                    width: `${progress}%`,
                    opacity: progress === 100 ? 0 : 1,
                }}
            />
        </div>
    );
}

export default PageLoadingProvider;
