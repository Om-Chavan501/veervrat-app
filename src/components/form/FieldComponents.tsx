'use client';

import { type ReactNode } from 'react';

import { Info } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IFieldLabelProps {
    label?: string | undefined;
    info?: string | undefined;
    required?: boolean | undefined;
}

interface IFieldHintProps {
    text?: string | undefined;
    className?: string | undefined;
}

interface IFieldErrorProps {
    message?: string | undefined;
    className?: string | undefined;
}

interface IHiddenInputProps {
    name: string;
    value: string | number | boolean | undefined | null;
    required?: boolean | undefined;
    disabled?: boolean | undefined;
}

export function FieldLabel({ label, info, required }: IFieldLabelProps): ReactNode {
    if (!label) {
        return null;
    }

    return (
        <div className='flex items-center justify-between gap-2'>
            <label className='text-label font-medium text-foreground'>
                {label}
                {required ? <span className='text-destructive'> *</span> : null}
            </label>
            {info ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button type='button' className='inline-flex size-4 items-center justify-center text-muted-foreground transition-fast hover:text-foreground' aria-label='Field info'>
                            <Info className='size-3.5' />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{info}</p>
                    </TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}

export function FieldHint({ text, className }: IFieldHintProps): ReactNode {
    if (!text) {
        return null;
    }

    return <p className={cn('text-small text-muted-foreground', className)}>{text}</p>;
}

export function FieldError({ message, className }: IFieldErrorProps): ReactNode {
    if (!message) {
        return null;
    }

    return <p className={cn('text-small text-destructive', className)}>{message}</p>;
}

export function HiddenInput({ name, value, required, disabled }: IHiddenInputProps): ReactNode {
    return (
        <input
            type='text'
            name={name}
            required={required}
            disabled={disabled}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={() => {}}
            className='sr-only'
            tabIndex={-1}
            aria-hidden='true'
        />
    );
}
