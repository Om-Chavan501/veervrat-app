'use client';

import { type ReactElement, memo } from 'react';

import type { DotNestedBooleanKeys, IFormData, IHandleChange } from '@/components/form/form';
import { cn } from '@/lib/utils';

import { FieldError, FieldHint, HiddenInput } from './FieldComponents';

export interface ICustomToggleProps<TFormBody extends IFormData = IFormData> {
    name: DotNestedBooleanKeys<TFormBody> | string;
    value?: boolean | undefined;
    onChange: IHandleChange;
    label?: string | undefined;
    icon?: ReactElement<{ className?: string }> | undefined;
    required?: boolean | undefined;
    disabled?: boolean | undefined;
    hint?: string | undefined;
    errorMessage?: string | undefined;
    className?: string | undefined;
}

const CustomToggle = <TFormBody extends IFormData = IFormData>({ name, value, onChange, label, icon, required, disabled, hint, errorMessage, className }: ICustomToggleProps<TFormBody>) => {
    const isOn = Boolean(value);

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <HiddenInput name={name} value={isOn ? 'true' : 'false'} required={required} disabled={disabled} />
            <button
                type='button'
                disabled={disabled}
                onClick={() => {
                    onChange({
                        target: {
                            name,
                            value: !isOn,
                        },
                    });
                }}
                className={cn(
                    'flex w-full items-center gap-3 rounded-md border border-border bg-card p-3 text-left transition-fast',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                )}
            >
                {icon ? <span className='text-muted-foreground'>{icon}</span> : null}
                <span className='text-regular text-foreground'>
                    {label}
                    {required ? <span className='text-destructive'> *</span> : null}
                </span>
                <span className={cn('relative ml-auto h-5 w-10 rounded-full transition-fast', isOn ? 'bg-primary' : 'bg-muted-foreground/20 border border-border')}>
                    <span className={cn('absolute top-0.5 left-0.5 size-4 rounded-full transition-fast shadow-sm', isOn ? 'translate-x-5 bg-primary-foreground' : 'bg-muted-foreground/60')} />
                </span>
            </button>
            <FieldHint text={hint} />
            <FieldError message={errorMessage} />
        </div>
    );
};

CustomToggle.displayName = 'CustomToggle';

export default memo(CustomToggle) as typeof CustomToggle;
