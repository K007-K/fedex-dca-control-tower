'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAgentDemoMode, AGENT_DEMO_STEPS, getAgentDemoStepFromPath } from '@/lib/context/AgentDemoContext';

/**
 * Agent Demo step indicator - shows current position in demo flow
 */
export function AgentDemoStepIndicator() {
    const { isDemoMode, currentStep, setCurrentStep } = useAgentDemoMode();
    const pathname = usePathname();

    // Update current step based on path
    useEffect(() => {
        const step = getAgentDemoStepFromPath(pathname);
        if (step > 0) {
            setCurrentStep(step);
        }
    }, [pathname, setCurrentStep]);

    if (!isDemoMode) return null;

    const stepInfo = AGENT_DEMO_STEPS.find(s => s.step === currentStep);
    const nextStep = AGENT_DEMO_STEPS.find(s => s.step === currentStep + 1);
    const isInDemoFlow = currentStep > 0;

    if (!isInDemoFlow) {
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-orange-600 text-white rounded-lg shadow-lg p-4 max-w-sm animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🎯</span>
                    <span className="font-semibold">Agent Demo Active</span>
                </div>
                <p className="text-sm text-orange-100">
                    Navigate to <Link href="/agent/overview" className="underline font-medium">Overview</Link> to begin the demo flow.
                </p>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl shadow-2xl p-4 max-w-sm">
            {/* Step Counter */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">{currentStep}</span>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Agent Demo</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{stepInfo?.title}</p>
                    </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                    {currentStep} of 6
                </span>
            </div>

            {/* Current Description */}
            <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {stepInfo?.description}
                </p>
                <div className="flex flex-wrap gap-1">
                    {stepInfo?.highlight.split(', ').map((item, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300">
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex gap-1">
                    {AGENT_DEMO_STEPS.map((step) => (
                        <div
                            key={step.step}
                            className={`h-1.5 rounded-full flex-1 transition-colors ${step.step <= currentStep
                                ? 'bg-orange-500 dark:bg-orange-400'
                                : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Next Step */}
            {nextStep ? (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Next:</span>
                    {'path' in nextStep && nextStep.path ? (
                        <Link
                            href={nextStep.path}
                            className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                        >
                            {nextStep.title}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            Select a case to continue
                        </span>
                    )}
                </div>
            ) : (
                <div className="text-center">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Agent Demo Complete!
                    </span>
                </div>
            )}
        </div>
    );
}

/**
 * Agent Demo mode toggle - for sidebar
 */
export function AgentDemoModeToggle() {
    const { isDemoMode, toggleDemoMode } = useAgentDemoMode();

    return (
        <button
            onClick={toggleDemoMode}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDemoMode
                ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/30'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{isDemoMode ? '🎯 Demo Active' : 'Guided Demo'}</span>
            {isDemoMode && (
                <span className="ml-auto w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
        </button>
    );
}
