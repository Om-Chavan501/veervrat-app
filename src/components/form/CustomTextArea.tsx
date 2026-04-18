'use client';

import { type TextareaHTMLAttributes, memo } from 'react';

import type { DotNestedScalarKeys, IFormData, IHandleChange, StrongOmit } from '@/components/form/form';
import { cn } from '@/lib/utils';

import { FieldError, FieldHint, FieldLabel } from './FieldComponents';

export interface ICustomTextAreaProps<TFormBody extends IFormData = IFormData> extends StrongOmit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'onChange' | 'value'> {
    name: DotNestedScalarKeys<TFormBody> | string;
    value?: string | undefined;
    onChange: IHandleChange;
    label?: string | undefined;
    info?: string | undefined;
    hint?: string | undefined;
    errorMessage?: string | undefined;
    containerClassName?: string | undefined;
    textAreaClassName?: string | undefined;
}

const CustomTextArea = <TFormBody extends IFormData = IFormData>({
    name,
    value,
    onChange,
    label,
    info,
    hint,
    errorMessage,
    containerClassName,
    textAreaClassName,
    rows = 5,
    required,
    disabled,
    placeholder,
    ...rest
}: ICustomTextAreaProps<TFormBody>) => {
    return (
        <div className={cn('flex flex-col gap-1.5', containerClassName)}>
            <FieldLabel label={label} info={info} required={required} />
            <textarea
                {...rest}
                name={name}
                value={value ?? ''}
                rows={rows}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(event) => {
                    onChange({
                        target: {
                            name,
                            value: event.target.value === '' ? undefined : event.target.value,
                        },
                    });
                }}
                className={cn(
                    'flex min-h-28 w-full rounded-md border border-input bg-background p-3 text-regular text-foreground',
                    'placeholder:text-muted-foreground shadow-none transition-fast',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    errorMessage ? 'border-destructive focus:ring-destructive' : undefined,
                    textAreaClassName,
                )}
            />
            <FieldHint text={hint} />
            <FieldError message={errorMessage} />
        </div>
    );
};

CustomTextArea.displayName = 'CustomTextArea';

export default memo(CustomTextArea) as typeof CustomTextArea;
