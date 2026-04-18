'use client';

import { type Dispatch, type FormEvent, type ReactNode, type RefObject, type SetStateAction, useMemo, useRef } from 'react';

import { ArrowLeft, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useStepper } from '@/hooks/form';
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
    isValid?: (formData: TFormBody) => boolean;
    /** Error message to show when validation fails */
    validationErrorMessage?: string;
}

export interface IStepperFormFooterProps {
    /** Whether to show the back navigation button */
    showBackButton?: boolean;
    /** Label for the discard/reset button */
    discardLabel?: string;
    /** Label for the previous step button */
    previousLabel?: string;
    /** Label for the next step button */
    nextLabel?: string;
    /** Label for the final submit button */
    submitLabel?: string;
    /** Label shown while submitting */
    submittingLabel?: string;
}

export interface IStepperFormProps<TFormBody extends IFormData> {
    /** Step configurations - if not provided, renders as a regular form */
    steps?: Array<IStepConfig<TFormBody>>;
    /** Fields to render (used when steps is not provided) */
    fields?: Array<IFieldConfig<TFormBody>> | ((formData: TFormBody, handleChange: IHandleChange) => Array<IFieldConfig<TFormBody>>);
    /** Current form data */
    formData: TFormBody;
    /** Form change handler */
    handleChange: IHandleChange;
    /** Form data setter */
    setFormData: Dispatch<SetStateAction<TFormBody>>;
    /** Whether form has been modified */
    isModified: boolean;
    /** Submit handler */
    onSubmit: (formData: TFormBody) => void | Promise<void>;
    /** Reset handler */
    onReset?: () => void;
    /** Called when step validation fails */
    onValidationError?: (step: IStepConfig<TFormBody>, formData: TFormBody) => void;
    /** Whether the form is currently submitting */
    isSubmitting?: boolean;
    /** Additional class name for the form */
    className?: string;
    /** Hide the footer actions */
    hideFooter?: boolean;
    /** Footer customization */
    footer?: IStepperFormFooterProps;
    /** Submit button ref */
    submitBtnRef?: RefObject<HTMLButtonElement | null>;
    /** Disabled state */
    disabled?: boolean;
    /** Initial step index */
    initialStep?: number;
    /** Custom header content */
    headerContent?: ReactNode;
    /** Custom footer content (replaces default footer) */
    footerContent?: ReactNode;
}

// =============================================================
// Step Indicator Component
// =============================================================

interface IStepIndicatorProps {
    steps: Array<{ id: string; label: string; description?: string | undefined }>;
    currentStep: number;
    onStepClick?: (index: number) => void;
    allowNavigation?: boolean;
}

const StepIndicator = ({ steps, currentStep, onStepClick, allowNavigation = true }: IStepIndicatorProps): ReactNode => {
    return (
        <div className='flex flex-wrap items-center gap-2'>
            {steps.map((step, index) => {
                const isActive = currentStep === index;
                const isComplete = currentStep > index;
                const isClickable = allowNavigation && index <= currentStep;

                return (
                    <button
                        key={step.id}
                        type='button'
                        onClick={() => isClickable && onStepClick?.(index)}
                        disabled={!isClickable}
                        className={cn(
                            'flex items-center gap-2 rounded-lg border px-3 py-2 text-label transition-fast',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            isActive ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border bg-card text-foreground hover:bg-muted/50',
                            isComplete && 'border-success/30 bg-success/5',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full text-small font-medium transition-fast',
                                isActive ? 'bg-primary text-primary-foreground' : isComplete ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground',
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
};

// =============================================================
// Form Footer Component
// =============================================================

interface IFormFooterProps {
    isStepperMode: boolean;
    isFirst: boolean;
    isLast: boolean;
    isModified: boolean;
    isSubmitting: boolean;
    isCurrentStepValid: boolean;
    disabled?: boolean;
    footerConfig: IStepperFormFooterProps;
    onReset?: () => void;
    onPrevious: () => void;
    onBack: () => void;
    submitBtnRef?: RefObject<HTMLButtonElement | null>;
}

const FormFooter = ({
    isStepperMode,
    isFirst,
    isLast,
    isModified,
    isSubmitting,
    isCurrentStepValid,
    disabled,
    footerConfig,
    onReset,
    onPrevious,
    onBack,
    submitBtnRef,
}: IFormFooterProps): ReactNode => {
    const { showBackButton = true, discardLabel = 'Discard', previousLabel = 'Previous', nextLabel = 'Next', submitLabel = 'Submit', submittingLabel = 'Saving…' } = footerConfig;

    return (
        <div className='glass-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 shadow-glow-sm transition-all duration-300 hover:shadow-glow-md'>
            <div className='flex flex-wrap items-center gap-3'>
                {showBackButton && (
                    <Button type='button' variant='ghost' size='icon' onClick={onBack} className='group size-9' aria-label='Go back'>
                        <ArrowLeft className='size-4 transition-fast group-hover:-translate-x-0.5' />
                    </Button>
                )}
                <Button type='button' variant='outline' disabled={!isModified || isSubmitting} onClick={onReset} className='h-9 min-w-24 bg-background/50 hover:bg-background/80'>
                    {discardLabel}
                </Button>
                {isStepperMode && !isFirst && (
                    <Button type='button' variant='outline' onClick={onPrevious} disabled={isSubmitting} className='h-9 min-w-24 bg-background/50 hover:bg-background/80'>
                        {previousLabel}
                    </Button>
                )}
            </div>
            {isStepperMode && !isLast ? (
                <Button type='submit' ref={submitBtnRef} disabled={!isCurrentStepValid || isSubmitting} className='h-9 min-w-28 shadow-sm'>
                    {nextLabel}
                </Button>
            ) : (
                <Button
                    type='submit'
                    ref={submitBtnRef}
                    disabled={!isCurrentStepValid || isSubmitting || disabled || (!isStepperMode && !isModified)}
                    className='h-9 w-full min-w-32 shadow-sm sm:w-auto'
                >
                    {isSubmitting ? submittingLabel : submitLabel}
                </Button>
            )}
        </div>
    );
};

// =============================================================
// StepperForm Component
// =============================================================

export function StepperForm<TFormBody extends IFormData>({
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
    hideFooter = false,
    footer = {},
    submitBtnRef: externalSubmitBtnRef,
    disabled = false,
    initialStep = 0,
    headerContent,
    footerContent,
}: IStepperFormProps<TFormBody>): React.ReactElement {
    const router = useRouter();
    const internalSubmitBtnRef = useRef<HTMLButtonElement>(null);
    const submitBtnRef = externalSubmitBtnRef ?? internalSubmitBtnRef;

    const isStepperMode = Boolean(steps && steps.length > 0);
    const totalSteps = steps?.length ?? 1;

    const { currentStep, nextStep, prevStep, setCurrentStep, isFirst, isLast } = useStepper({
        totalSteps,
        initialStep,
    });

    // Resolve current step config
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
        if (!isStepperMode || !currentStepConfig?.isValid) {
            return true;
        }
        return currentStepConfig.isValid(formData);
    }, [isStepperMode, currentStepConfig, formData]);

    // Handle form submission
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
        if (isStepperMode && currentStepConfig?.isValid && !currentStepConfig.isValid(formData)) {
            onValidationError?.(currentStepConfig, formData);
            return;
        }

        // Call the submit handler
        await onSubmit(formData);
    };

    // Handle reset
    const handleReset = () => {
        onReset?.();
    };

    // Handle back navigation
    const handleBack = () => {
        router.back();
    };

    return (
        <form onSubmit={handleSubmit} className={cn('flex flex-col gap-6', className)}>
            {/* Step Indicator (stepper mode only) */}
            {isStepperMode && steps && (
                <StepIndicator
                    steps={steps.map((s) => ({
                        id: s.id,
                        label: s.label,
                        description: s.description,
                    }))}
                    currentStep={currentStep}
                    onStepClick={setCurrentStep}
                    allowNavigation={true}
                />
            )}

            {/* Custom header content */}
            {headerContent}

            {/* Form Content */}
            <div className='flex-1 rounded-xl border border-border bg-card p-5'>
                <div className='grid gap-5 sm:grid-cols-2 md:grid-cols-6'>{resolvedFields.map((field, index) => renderField(formData, handleChange, field, index))}</div>
            </div>

            {/* Footer */}
            {!hideFooter &&
                (footerContent ?? (
                    <FormFooter
                        isStepperMode={isStepperMode}
                        isFirst={isFirst}
                        isLast={isLast}
                        isModified={isModified}
                        isSubmitting={isSubmitting}
                        isCurrentStepValid={isCurrentStepValid}
                        disabled={disabled}
                        footerConfig={footer}
                        onReset={handleReset}
                        onPrevious={prevStep}
                        onBack={handleBack}
                        submitBtnRef={submitBtnRef}
                    />
                ))}
        </form>
    );
}

export default StepperForm;
