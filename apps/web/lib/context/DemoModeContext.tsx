'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoModeContextType {
    isDemoMode: boolean;
    toggleDemoMode: () => void;
    enableDemoMode: () => void;
    disableDemoMode: () => void;
    currentStep: number;
    setCurrentStep: (step: number) => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

/**
 * Demo flow steps definition
 */
export const DEMO_STEPS = [
    {
        step: 1,
        title: 'Control Tower Overview',
        path: '/overview',
        description: 'You are viewing how the system is explained',
        highlight: 'SYSTEM vs Human roles, Governance-first design, Automated decisions',
    },
    {
        step: 2,
        title: 'Dashboard (Global View)',
        path: '/dashboard',
        description: 'You are viewing global operational visibility',
        highlight: 'Global KPIs, SYSTEM-generated metrics, Oversight (not execution)',
    },
    {
        step: 3,
        title: 'Cases List',
        path: '/cases',
        description: 'You are viewing how cases are tracked',
        highlight: 'Case origin (SYSTEM vs manual), Filters, Auditability',
    },
    {
        step: 4,
        title: 'Case Detail',
        pathPattern: /^\/cases\/[^/]+$/,
        description: 'You are viewing system automation in action',
        highlight: 'Automation Summary, SYSTEM assignment, Restricted human actions',
    },
    {
        step: 5,
        title: 'Case Lifecycle Story',
        pathPattern: /^\/cases\/[^/]+\/lifecycle$/,
        description: 'You are viewing the full system story end-to-end',
        highlight: 'Upstream origin, SYSTEM enrichment, Allocation, DCA workflow, SLA, Audit',
    },
];

/**
 * Get current demo step based on path
 */
export function getDemoStepFromPath(path: string): number {
    for (const step of DEMO_STEPS) {
        if ('path' in step && step.path === path) {
            return step.step;
        }
        if ('pathPattern' in step && step.pathPattern?.test(path)) {
            return step.step;
        }
    }
    return 0; // Not in demo flow
}

export function DemoModeProvider({ children }: { children: ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Persist demo mode state in localStorage
    useEffect(() => {
        const stored = localStorage.getItem('fedex_demo_mode');
        if (stored === 'true') {
            setIsDemoMode(true);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('fedex_demo_mode', isDemoMode.toString());
    }, [isDemoMode]);

    const toggleDemoMode = () => setIsDemoMode(prev => !prev);
    const enableDemoMode = () => setIsDemoMode(true);
    const disableDemoMode = () => setIsDemoMode(false);

    return (
        <DemoModeContext.Provider value={{
            isDemoMode,
            toggleDemoMode,
            enableDemoMode,
            disableDemoMode,
            currentStep,
            setCurrentStep,
        }}>
            {children}
        </DemoModeContext.Provider>
    );
}

export function useDemoMode() {
    const context = useContext(DemoModeContext);
    if (context === undefined) {
        throw new Error('useDemoMode must be used within a DemoModeProvider');
    }
    return context;
}
