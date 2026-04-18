'use client';

import { type KeyboardEvent, useRef, useState } from 'react';

import { Pill } from '@/components/ui/pill';
import { cn } from '@/lib/utils';

import { FieldError, FieldHint, FieldLabel } from './FieldComponents';
import type { IHandleChange } from './form';

// =============================================================
// Props
// =============================================================

export interface ICustomTagInputProps {
    name: string;
    value?: string[] | undefined;
    onChange: IHandleChange;
    label?: string | undefined;
    hint?: string | undefined;
    info?: string | undefined;
    errorMessage?: string | undefined;
    placeholder?: string | undefined;
    required?: boolean | undefined;
    disabled?: boolean | undefined;
    maxTags?: number | undefined;
    containerClassName?: string | undefined;
}

// =============================================================
// CustomTagInput
// =============================================================

export default function CustomTagInput({
    name,
    value = [],
    onChange,
    label,
    hint,
    info,
    errorMessage,
    placeholder = 'Type and press Enter…',
    required,
    disabled,
    maxTags = 10,
    containerClassName,
}: ICustomTagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const atMax = value.length >= maxTags;

    const commit = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed || value.includes(trimmed) || atMax) return;
        onChange({ target: { name, value: [...value, trimmed] } });
        setInputValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            // Remove last tag on backspace when input is empty
            onChange({ target: { name, value: value.slice(0, -1) } });
        }
    };

    const removeTag = (index: number) => {
        onChange({ target: { name, value: value.filter((_, i) => i !== index) } });
    };

    const hasError = Boolean(errorMessage);

    return (
        <div className={cn('flex flex-col gap-1.5', containerClassName)}>
            {label && <FieldLabel label={label} required={required} info={info} />}

            {/* Tag pills */}
            {value.length > 0 && (
                <div className='flex flex-wrap gap-1.5'>
                    {value.map((tag, i) => (
                        <Pill key={`${tag}-${i}`} variant='subtle' size='chip' onRemove={disabled ? undefined : () => removeTag(i)}>
                            {tag}
                        </Pill>
                    ))}
                </div>
            )}

            {/* Input */}
            <div
                className={cn(
                    'flex items-center rounded-lg border bg-background px-3 py-2 transition-fast',
                    hasError ? 'border-destructive ring-1 ring-destructive/30' : 'border-border focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20',
                    disabled && 'cursor-not-allowed opacity-50',
                    atMax && !disabled && 'opacity-60',
                )}
                onClick={() => inputRef.current?.focus()}
            >
                <input
                    ref={inputRef}
                    type='text'
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => commit(inputValue)}
                    disabled={disabled || atMax}
                    placeholder={atMax ? `Max ${maxTags} tags reached` : placeholder}
                    className='w-full bg-transparent text-regular text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:cursor-not-allowed'
                    aria-label={label}
                />
            </div>

            <FieldHint text={hint ?? (atMax ? undefined : `Press Enter or comma to add. Up to ${maxTags} tags.`)} />
            {hasError && <FieldError message={errorMessage} />}
        </div>
    );
}
