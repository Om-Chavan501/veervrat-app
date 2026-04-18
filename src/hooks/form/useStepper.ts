'use client';

import { useState, useCallback } from 'react';

interface IStepperOptions {
    totalSteps: number;
    initialStep?: number;
}

/**
 * Hook for managing stepper/wizard state
 * Adapted from refer-2 useStepper
 */
export const useStepper = ({ totalSteps, initialStep = 0 }: IStepperOptions) => {
    const [currentStep, setCurrentStep] = useState(initialStep);

    const goToStep = useCallback((step: number) => {
        if (step >= 0 && step < totalSteps) {
            setCurrentStep(step);
        }
    }, [totalSteps]);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }, [totalSteps]);

    const prevStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    }, []);

    const reset = useCallback(() => {
        setCurrentStep(initialStep);
    }, [initialStep]);

    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return {
        currentStep,
        setCurrentStep: goToStep,
        nextStep,
        prevStep,
        reset,
        isFirst,
        isLast,
        progress,
        totalSteps,
    };
};

export default useStepper;
