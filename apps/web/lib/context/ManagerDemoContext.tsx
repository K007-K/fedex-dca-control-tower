'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Manager Demo Context
 * 
 * Guided demo for DCA Manager role - 5 steps covering key pages
 */

interface DemoStep {
    id: number;
    title: string;
    description: string;
    targetPath: string;
}

const MANAGER_DEMO_STEPS: DemoStep[] = [
    {
        id: 1,
        title: 'Manager Overview',
        description: 'Understand your role as DCA Manager - what you CAN and CANNOT do, and quick actions to get started.',
        targetPath: '/manager/overview',
    },
    {
        id: 2,
        title: 'Team Dashboard',
        description: 'View team-level KPIs, agent workload distribution, at-risk cases, and stuck cases requiring attention.',
        targetPath: '/manager/dashboard',
    },
    {
        id: 3,
        title: 'Team Cases',
        description: 'See all cases assigned to your team agents. Filter by agent, status, or SLA risk.',
        targetPath: '/manager/cases',
    },
    {
        id: 4,
        title: 'My Team',
        description: 'View your agents with operational metrics. Click "View Cases" to see an agent\'s workload.',
        targetPath: '/manager/team',
    },
    {
        id: 5,
        title: 'Notifications',
        description: 'Check DCA-scoped notifications including escalations, SLA alerts, and case updates.',
        targetPath: '/manager/notifications',
    },
];

interface ManagerDemoContextType {
    isEnabled: boolean;
    currentStep: number;
    steps: DemoStep[];
    enableDemo: () => void;
    disableDemo: () => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    getCurrentStep: () => DemoStep | null;
}

const ManagerDemoContext = createContext<ManagerDemoContextType | null>(null);

export function useManagerDemo() {
    const context = useContext(ManagerDemoContext);
    if (!context) {
        // Return safe defaults instead of throwing
        return {
            isEnabled: false,
            currentStep: 0,
            steps: [],
            enableDemo: () => { },
            disableDemo: () => { },
            nextStep: () => { },
            prevStep: () => { },
            goToStep: () => { },
            getCurrentStep: () => null,
        };
    }
    return context;
}

export function ManagerDemoProvider({ children }: { children: React.ReactNode }) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const pathname = usePathname();
    const router = useRouter();

    // Sync step with current path
    useEffect(() => {
        if (!isEnabled) return;
        const step = MANAGER_DEMO_STEPS.find(s => pathname?.startsWith(s.targetPath));
        if (step) {
            setCurrentStep(step.id);
        }
    }, [pathname, isEnabled]);

    const enableDemo = useCallback(() => {
        setIsEnabled(true);
        setCurrentStep(1);
        router.push('/manager/overview');
    }, [router]);

    const disableDemo = useCallback(() => {
        setIsEnabled(false);
    }, []);

    const nextStep = useCallback(() => {
        if (currentStep < MANAGER_DEMO_STEPS.length) {
            const next = currentStep + 1;
            setCurrentStep(next);
            const nextStepData = MANAGER_DEMO_STEPS.find(s => s.id === next);
            if (nextStepData) {
                router.push(nextStepData.targetPath);
            }
        } else {
            setIsEnabled(false);
        }
    }, [currentStep, router]);

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            const prev = currentStep - 1;
            setCurrentStep(prev);
            const prevStepData = MANAGER_DEMO_STEPS.find(s => s.id === prev);
            if (prevStepData) {
                router.push(prevStepData.targetPath);
            }
        }
    }, [currentStep, router]);

    const goToStep = useCallback((step: number) => {
        if (step >= 1 && step <= MANAGER_DEMO_STEPS.length) {
            setCurrentStep(step);
            const stepData = MANAGER_DEMO_STEPS.find(s => s.id === step);
            if (stepData) {
                router.push(stepData.targetPath);
            }
        }
    }, [router]);

    const getCurrentStep = useCallback(() => {
        return MANAGER_DEMO_STEPS.find(s => s.id === currentStep) || null;
    }, [currentStep]);

    return (
        <ManagerDemoContext.Provider
            value={{
                isEnabled,
                currentStep,
                steps: MANAGER_DEMO_STEPS,
                enableDemo,
                disableDemo,
                nextStep,
                prevStep,
                goToStep,
                getCurrentStep,
            }}
        >
            {children}
        </ManagerDemoContext.Provider>
    );
}
