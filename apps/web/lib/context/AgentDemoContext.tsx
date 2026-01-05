'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AgentDemoContextType {
    isDemoMode: boolean;
    toggleDemoMode: () => void;
    enableDemoMode: () => void;
    disableDemoMode: () => void;
    currentStep: number;
    setCurrentStep: (step: number) => void;
}

const AgentDemoContext = createContext<AgentDemoContextType | undefined>(undefined);

/**
 * DCA Agent Demo flow steps
 * Covers the agent-specific pages and workflows
 */
export const AGENT_DEMO_STEPS = [
    {
        step: 1,
        title: 'Agent Overview',
        path: '/agent/overview',
        description: 'Your personal workbench introduction',
        highlight: 'Quick stats, How it works guide, Your role explained',
    },
    {
        step: 2,
        title: 'My Dashboard',
        path: '/agent/dashboard',
        description: 'Your daily work dashboard showing assigned cases',
        highlight: 'Due today, Overdue cases, SLA alerts, Action reminders',
    },
    {
        step: 3,
        title: 'My Cases',
        path: '/agent/cases',
        description: 'List of all cases assigned to you for recovery',
        highlight: 'Status filter, SLA countdown, Work on case action',
    },
    {
        step: 4,
        title: 'Work on Case',
        pathPattern: /^\/agent\/cases\/[^/]+$/,
        description: 'Working on a specific case - log contacts, add notes, record payments',
        highlight: 'Update status, Log contact, Add note, Record payment, Schedule callback',
    },
    {
        step: 5,
        title: 'Case History',
        path: '/agent/history',
        description: 'Your completed cases and recovery history',
        highlight: 'Full recoveries, Partial recoveries, Recovery summary',
    },
    {
        step: 6,
        title: 'My Performance',
        path: '/agent/stats',
        description: 'Your performance metrics and achievements',
        highlight: 'Recovery rate, Total recovered, Achievements, Impact on auto-assignment',
    },
];

/**
 * Get current agent demo step based on path
 */
export function getAgentDemoStepFromPath(path: string): number {
    for (const step of AGENT_DEMO_STEPS) {
        if ('path' in step && step.path === path) {
            return step.step;
        }
        if ('pathPattern' in step && step.pathPattern?.test(path)) {
            return step.step;
        }
    }
    return 0; // Not in demo flow
}

export function AgentDemoProvider({ children }: { children: ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Persist demo mode state in localStorage
    useEffect(() => {
        const stored = localStorage.getItem('fedex_agent_demo_mode');
        if (stored === 'true') {
            setIsDemoMode(true);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('fedex_agent_demo_mode', isDemoMode.toString());
    }, [isDemoMode]);

    const toggleDemoMode = () => setIsDemoMode(prev => !prev);
    const enableDemoMode = () => setIsDemoMode(true);
    const disableDemoMode = () => setIsDemoMode(false);

    return (
        <AgentDemoContext.Provider value={{
            isDemoMode,
            toggleDemoMode,
            enableDemoMode,
            disableDemoMode,
            currentStep,
            setCurrentStep,
        }}>
            {children}
        </AgentDemoContext.Provider>
    );
}

export function useAgentDemoMode() {
    const context = useContext(AgentDemoContext);
    if (context === undefined) {
        throw new Error('useAgentDemoMode must be used within an AgentDemoProvider');
    }
    return context;
}
