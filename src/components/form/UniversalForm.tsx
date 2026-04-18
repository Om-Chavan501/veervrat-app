'use client';

import { type Dispatch, type FormEvent, type ReactNode, type RefObject, type SetStateAction, useMemo, useRef, useState } from 'react';

import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, RotateCcw, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { IFormData, IHandleChange } from './form';
import type { IFieldConfig } from './FormWrapper';
import { renderField } from './FormWrapper';

// =============================================================
// Types
// =============================================================

export interface IStepConfig<TFormBody extends IFormData> {
    /** Unique step identifier */
    id: string;
    /** Display label for the step */
    label: string;
    /** Optional description shown below the label */
    description?: string;
    /** Fields to render for this step */
    fields: Array<IFieldConfig<TFormBody>> | ((formData: TFormBody, handleChange: IHandleChange) => Array<IFieldConfig<TFormBody>>);
    /** Validation function for this step - return true if valid */
    validate?: (formData: TFormBody) => boolean;
    /** Error message to show when validation fails */
    errorMessage?: string;
}

export interface IUniversalFormLabels {
    /** Back navigation button label */
    back?: string;
    /** Discard/reset button label */
    discard?: string;
    /** Previous step button label */
    previous?: string;
    /** Next step button label */
    next?: string;
    /** Submit button label */
    submit?: string;
    /** Loading state label */
    submitting?: string;
}

export interface IUniversalFormProps<TFormBody extends IFormData> {
    /** Step configurations - if not provided, renders as a regular form */
    steps?: Array<IStepConfig<TFormBody>>;
    /** Fields to render (used when steps is not provided) */
    fields?: Array<IFieldConfig<TFormBody>> | ((formData: TFormBody, handleChange: IHandleChange) => Array<IFieldConfig<TFormBody>>);
    /** Current form data */
    formData: TFormBody;
    /** Form change handler */
    handleChange: IHandleChange;
    /** Form data setter (exposed for advanced use cases) */
    setFormData: Dispatch<SetStateAction<TFormBody>>;
    /** Whether form has been modified */
    isModified: boolean;
    /** Submit handler - receives validated form data */
    onSubmit: (formData: TFormBody) => void | Promise<void>;
    /** Reset handler */
    onReset?: () => void;
    /** Called when step validation fails */
    onValidationError?: (step: IStepConfig<TFormBody>, formData: TFormBody) => void;
    /** Whether the form is currently submitting */
    isSubmitting?: boolean;
    /** Additional class name for the form */
    className?: string;
    /** Hide the action bar */
    hideActions?: boolean;
    /** Show back navigation button */
    showBackButton?: boolean;
    /** Custom labels */
    labels?: IUniversalFormLabels;
    /** Submit button ref (for external triggering) */
    submitBtnRef?: RefObject<HTMLButtonElement | null>;
    /** Disabled state */
    disabled?: boolean;
    /** Initial step index (for stepper mode) */
    initialStep?: number;
    /** Content to render above the form fields */
    headerContent?: ReactNode;
    /** Content to render below the form fields */
    footerContent?: ReactNode;
    /** Title shown in the action bar */
    title?: string;
}

// =============================================================
// Step Indicator Component
// =============================================================

interface IStepIndicatorProps {
    steps: Array<{ id: string; label: string; description?: string }>;
    currentStep: number;
    onStepClick?: (index: number) => void;
}

function StepIndicator({ steps, currentStep, onStepClick }: IStepIndicatorProps): ReactNode {
    return (
        <div className='flex flex-wrap items-center gap-2'>
            {steps.map((step, index) => {
                const isActive = currentStep === index;
                const isComplete = currentStep > index;
                const isClickable = index <= currentStep;

                return (
                    <button
                        key={step.id}
                        type='button'
                        onClick={() => isClickable && onStepClick?.(index)}
                        disabled={!isClickable}
                        className={cn(
                            'flex items-center gap-2 rounded-lg border px-3 py-2 text-label transition-all duration-200',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            isActive && 'border-primary/50 bg-primary/10 text-foreground shadow-sm',
                            !isActive && 'border-border bg-card text-foreground hover:bg-muted/50',
                            isComplete && 'border-success/30 bg-success/5',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full text-small font-medium transition-all duration-200',
                                isActive && 'bg-primary text-primary-foreground',
                                isComplete && 'bg-success text-success-foreground',
                                !isActive && !isComplete && 'bg-muted text-muted-foreground',
                            )}
                        >
                            {isComplete ? <Check className='size-3.5' /> : index + 1}
                        </span>
                        <div className='flex flex-col items-start'>
                            <span className={cn('font-medium', isActive && 'text-primary')}>{step.label}</span>
                            {step.description && <span className='text-xs text-muted-foreground'>{step.description}</span>}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// =============================================================
// Action Bar Component (TOP - not sticky)
// =============================================================

interface IActionBarProps {
    title?: string;
    showBackButton: boolean;
    isStepperMode: boolean;
    isFirst: boolean;
    isLast: boolean;
    isModified: boolean;
    isSubmitting: boolean;
    isCurrentStepValid: boolean;
    disabled: boolean;
    labels: Required<IUniversalFormLabels>;
    onReset?: () => void;
    onPrevious: () => void;
    onBack: () => void;
    submitBtnRef?: RefObject<HTMLButtonElement | null>;
}

function ActionBar({
    title,
    showBackButton,
    isStepperMode,
    isFirst,
    isLast,
    isModified,
    isSubmitting,
    isCurrentStepValid,
    disabled,
    labels,
    onReset,
    onPrevious,
    onBack,
    submitBtnRef,
}: IActionBarProps): ReactNode {
    const showSubmitButton = !isStepperMode || isLast;
    const showNextButton = isStepperMode && !isLast;
    const showPreviousButton = isStepperMode && !isFirst;

    return (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4'>
            {/* Left side: Back + Title */}
            <div className='flex min-w-0 items-center gap-3'>
                {showBackButton && (
                    <Button type='button' variant='ghost' size='icon' onClick={onBack} className='group size-9 shrink-0' aria-label='Go back'>
                        <ArrowLeft className='size-4 transition-transform duration-200 group-hover:-translate-x-0.5' />
                    </Button>
                )}
                {title && <h2 className='text-title font-semibold text-foreground'>{title}</h2>}
            </div>

            {/* Right side: Actions */}
            <div className='flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto'>
                {/* Discard button */}
                <Button type='button' variant='ghost' size='sm' disabled={!isModified || isSubmitting} onClick={onReset} className='h-9 gap-1.5 text-muted-foreground hover:text-foreground'>
                    <RotateCcw className='size-3.5' />
                    {labels.discard}
                </Button>

                {/* Previous button (stepper mode) */}
                {showPreviousButton && (
                    <Button type='button' variant='outline' size='sm' onClick={onPrevious} disabled={isSubmitting} className='h-9 gap-1.5'>
                        <ChevronLeft className='size-4' />
                        {labels.previous}
                    </Button>
                )}

                {/* Next button (stepper mode) */}
                {showNextButton && (
                    <Button type='submit' ref={submitBtnRef} size='sm' disabled={!isCurrentStepValid || isSubmitting} className='h-9 gap-1.5'>
                        {labels.next}
                        <ChevronRight className='size-4' />
                    </Button>
                )}

                {/* Submit button */}
                {showSubmitButton && (
                    <Button
                        type='submit'
                        ref={submitBtnRef}
                        size='sm'
                        disabled={!isCurrentStepValid || isSubmitting || disabled || (!isStepperMode && !isModified)}
                        className='h-9 w-full min-w-28 gap-1.5 sm:w-auto'
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className='size-4 animate-spin' />
                                {labels.submitting}
                            </>
                        ) : (
                            <>
                                <Save className='size-4' />
                                {labels.submit}
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

// =============================================================
// UniversalForm Component
// =============================================================

export function UniversalForm<TFormBody extends IFormData>({
    steps,
    fields,
    formData,
    handleChange,
    setFormData: _setFormData,
    isModified,
    onSubmit,
    onReset,
    onValidationError,
    isSubmitting = false,
    className,
    hideActions = false,
    showBackButton = true,
    labels = {},
    submitBtnRef: externalSubmitBtnRef,
    disabled = false,
    initialStep = 0,
    headerContent,
    footerContent,
    title,
}: IUniversalFormProps<TFormBody>): React.ReactElement {
    const router = useRouter();
    const internalSubmitBtnRef = useRef<HTMLButtonElement>(null);
    const submitBtnRef = externalSubmitBtnRef ?? internalSubmitBtnRef;

    // Stepper state
    const isStepperMode = Boolean(steps && steps.length > 0);
    const totalSteps = steps?.length ?? 1;
    const [currentStep, setCurrentStep] = useState(Math.min(initialStep, totalSteps - 1));

    // Derived step navigation
    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;

    // Resolve labels with defaults
    const resolvedLabels: Required<IUniversalFormLabels> = {
        back: labels.back ?? 'Back',
        discard: labels.discard ?? 'Discard',
        previous: labels.previous ?? 'Previous',
        next: labels.next ?? 'Next',
        submit: labels.submit ?? 'Save',
        submitting: labels.submitting ?? 'Saving…',
    };

    // Current step config
    const currentStepConfig = isStepperMode ? steps![currentStep] : null;

    // Resolve fields for current view
    const resolvedFields = useMemo(() => {
        if (isStepperMode && currentStepConfig) {
            const stepFields = currentStepConfig.fields;
            return typeof stepFields === 'function' ? stepFields(formData, handleChange) : stepFields;
        }
        if (fields) {
            return typeof fields === 'function' ? fields(formData, handleChange) : fields;
        }
        return [];
    }, [isStepperMode, currentStepConfig, fields, formData, handleChange]);

    // Validation for current step
    const isCurrentStepValid = useMemo(() => {
        if (!isStepperMode || !currentStepConfig?.validate) {
            return true;
        }
        return currentStepConfig.validate(formData);
    }, [isStepperMode, currentStepConfig, formData]);

    // Navigation handlers
    const goToStep = (step: number) => {
        if (step >= 0 && step < totalSteps && step <= currentStep) {
            setCurrentStep(step);
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    // Form handlers
    const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // If in stepper mode and not on last step, validate and move to next
        if (isStepperMode && !isLast) {
            if (!isCurrentStepValid) {
                onValidationError?.(currentStepConfig!, formData);
                return;
            }
            nextStep();
            return;
        }

        // Final submission - validate current step first
        if (isStepperMode && currentStepConfig?.validate && !currentStepConfig.validate(formData)) {
            onValidationError?.(currentStepConfig, formData);
            return;
        }

        // Call the submit handler
        await onSubmit(formData);
    };

    const handleReset = () => {
        onReset?.();
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <form onSubmit={handleFormSubmit} className={cn('flex flex-col gap-5', className)}>
            {/* Action Bar (TOP) */}
            {!hideActions && (
                <ActionBar
                    {...(title !== undefined && { title })}
                    showBackButton={showBackButton}
                    isStepperMode={isStepperMode}
                    isFirst={isFirst}
                    isLast={isLast}
                    isModified={isModified}
                    isSubmitting={isSubmitting}
                    isCurrentStepValid={isCurrentStepValid}
                    disabled={disabled}
                    labels={resolvedLabels}
                    onReset={handleReset}
                    onPrevious={prevStep}
                    onBack={handleBack}
                    submitBtnRef={submitBtnRef}
                />
            )}

            {/* Step Indicator (stepper mode only) */}
            {isStepperMode && steps && (
                <StepIndicator
                    steps={steps.map((s) => ({
                        id: s.id,
                        label: s.label,
                        ...(s.description !== undefined && { description: s.description }),
                    }))}
                    currentStep={currentStep}
                    onStepClick={goToStep}
                />
            )}

            {/* Custom header content */}
            {headerContent}

            {/* Form Fields */}
            <div className='rounded-xl border border-border bg-card p-5'>
                <div className='grid gap-5 sm:grid-cols-2 md:grid-cols-6'>{resolvedFields.map((field, index) => renderField(formData, handleChange, field, index))}</div>
            </div>

            {/* Custom footer content */}
            {footerContent}
        </form>
    );
}

export default UniversalForm;
