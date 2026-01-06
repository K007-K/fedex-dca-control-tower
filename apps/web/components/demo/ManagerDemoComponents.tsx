'use client';

import { useManagerDemo } from '@/lib/context/ManagerDemoContext';

/**
 * Manager Demo Components
 * 
 * Styled with yellow/orange theme to match manager workbench
 */

export function ManagerDemoStepIndicator() {
    const { isEnabled, currentStep, steps, nextStep, prevStep, disableDemo, getCurrentStep } = useManagerDemo();

    if (!isEnabled) return null;

    const currentStepData = getCurrentStep();

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-[#111] rounded-xl shadow-2xl border border-yellow-200 dark:border-yellow-800 p-4 w-[90%] max-w-lg">
            {/* Step indicator dots */}
            <div className="flex justify-center gap-2 mb-3">
                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`w-2 h-2 rounded-full transition-colors ${step.id === currentStep
                                ? 'bg-yellow-500'
                                : step.id < currentStep
                                    ? 'bg-yellow-300'
                                    : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                    />
                ))}
            </div>

            {/* Step content */}
            <div className="text-center mb-4">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                    Step {currentStep} of {steps.length}
                </p>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentStepData?.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentStepData?.description}
                </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white disabled:opacity-30"
                >
                    ← Previous
                </button>
                <button
                    onClick={disableDemo}
                    className="text-xs text-gray-400 hover:text-gray-600"
                >
                    End Demo
                </button>
                <button
                    onClick={nextStep}
                    className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                >
                    {currentStep === steps.length ? 'Finish' : 'Next →'}
                </button>
            </div>
        </div>
    );
}

export function ManagerDemoModeToggle() {
    const { isEnabled, enableDemo, disableDemo } = useManagerDemo();

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Guided Demo</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Learn Manager Workbench</p>
            </div>
            <button
                onClick={isEnabled ? disableDemo : enableDemo}
                className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}
