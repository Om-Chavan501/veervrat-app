'use client';

import { memo, type SelectHTMLAttributes, useMemo, useState } from 'react';

import { Check, ChevronDown, Loader2 } from 'lucide-react';

import type { DotNestedScalarKeys, IFormData, IHandleChange, StrongOmit } from '@/components/form/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { FieldError, FieldHint, FieldLabel, HiddenInput } from './FieldComponents';

export type ISelectFieldValue = string | number | boolean | null | undefined;

export interface ISelectOption<TValue extends ISelectFieldValue = string> {
    label: string;
    value: TValue;
    description?: string | undefined;
    disabled?: boolean | undefined;
}

export interface ICustomSelectProps<TFormBody extends IFormData = IFormData, TValue extends ISelectFieldValue = ISelectFieldValue> extends StrongOmit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'name' | 'onChange' | 'value'
> {
    name: DotNestedScalarKeys<TFormBody> | string;
    value?: TValue | undefined;
    options: Array<ISelectOption<TValue>>;
    onChange: IHandleChange;
    label?: string | undefined;
    info?: string | undefined;
    hint?: string | undefined;
    errorMessage?: string | undefined;
    placeholder?: string | undefined;
    isLoading?: boolean | undefined;
    isSearchable?: boolean | undefined;
    noOptionsMessage?: string | undefined;
    containerClassName?: string | undefined;
}

const CustomSelect = <TFormBody extends IFormData = IFormData, TValue extends ISelectFieldValue = ISelectFieldValue>({
    name,
    value,
    options,
    onChange,
    label,
    info,
    hint,
    errorMessage,
    placeholder = 'Select an option',
    isLoading,
    isSearchable,
    noOptionsMessage = 'No options found',
    containerClassName,
    required,
    disabled,
}: ICustomSelectProps<TFormBody, TValue>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedOption = useMemo(() => options.find((option) => String(option.value) === String(value)), [options, value]);

    const filteredOptions = useMemo(() => {
        if (!isSearchable || searchQuery.trim() === '') {
            return options;
        }

        const query = searchQuery.toLowerCase();
        return options.filter((option) => option.label.toLowerCase().includes(query));
    }, [isSearchable, options, searchQuery]);

    const isDisabled = disabled || isLoading;

    return (
        <div className={cn('flex flex-col gap-1.5', containerClassName)}>
            <FieldLabel label={label} info={info} required={required} />
            <HiddenInput name={name} value={value ?? ''} required={required} disabled={isDisabled} />

            <Popover
                open={isOpen}
                onOpenChange={(nextOpen) => {
                    if (isDisabled) {
                        return;
                    }

                    setIsOpen(nextOpen);
                    if (!nextOpen) {
                        setSearchQuery('');
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <button
                        type='button'
                        disabled={isDisabled}
                        className={cn(
                            'flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3',
                            'text-regular text-foreground shadow-none transition-fast',
                            'focus:outline-none focus:ring-2 focus:ring-ring',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            errorMessage ? 'border-destructive focus:ring-destructive' : undefined,
                        )}
                    >
                        <span className={cn('block truncate text-left', selectedOption ? 'text-foreground' : 'text-muted-foreground')}>{selectedOption?.label ?? placeholder}</span>
                        {isLoading ? (
                            <Loader2 className='size-4 animate-spin text-muted-foreground' />
                        ) : (
                            <ChevronDown className={cn('size-4 text-muted-foreground transition-fast', isOpen ? 'rotate-180' : undefined)} />
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent align='start' sideOffset={4} className='w-(--radix-popover-trigger-width) p-0'>
                    {isSearchable ? (
                        <div className='border-border border-b p-2'>
                            <input
                                value={searchQuery}
                                type='text'
                                placeholder='Search option'
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className='w-full bg-transparent px-2 py-1 text-small text-foreground outline-none placeholder:text-muted-foreground'
                            />
                        </div>
                    ) : null}

                    <ScrollArea className='max-h-60'>
                        {filteredOptions.length === 0 ? (
                            <p className='px-3 py-2 text-small text-muted-foreground'>{noOptionsMessage}</p>
                        ) : (
                            <div className='p-1'>
                                {filteredOptions.map((option) => {
                                    const isSelected = String(option.value) === String(value);
                                    return (
                                        <button
                                            key={String(option.value)}
                                            type='button'
                                            disabled={option.disabled}
                                            onClick={() => {
                                                onChange({
                                                    target: {
                                                        name,
                                                        value: option.value,
                                                    },
                                                });
                                                setIsOpen(false);
                                                setSearchQuery('');
                                            }}
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-small transition-fast',
                                                isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/70',
                                                option.disabled ? 'cursor-not-allowed opacity-50' : undefined,
                                            )}
                                        >
                                            <Check className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                                            <span className='truncate'>{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            <FieldHint text={hint} />
            <FieldError message={errorMessage} />
        </div>
    );
};

CustomSelect.displayName = 'CustomSelect';

export default memo(CustomSelect) as typeof CustomSelect;
