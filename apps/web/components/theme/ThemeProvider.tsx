'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolved, setResolved] = useState<'light' | 'dark'>('light');
    const [isInitialized, setIsInitialized] = useState(false);

    // Load theme from localStorage on mount - only once
    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null;
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            setThemeState(stored);
        }
        setIsInitialized(true);
    }, []);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;

        let resolvedTheme: 'light' | 'dark' = 'light';

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            resolvedTheme = systemTheme;
        } else {
            resolvedTheme = theme;
        }

        setResolved(resolvedTheme);

        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
        root.style.colorScheme = resolvedTheme;
    }, [theme]);

    // Only save to localStorage after initialization to avoid overwriting on mount
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('theme', theme);
        }
    }, [theme, isInitialized]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: resolved }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
