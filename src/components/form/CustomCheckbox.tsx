'use client';

import { type ReactNode, memo } from 'react';

import type { DotNestedBooleanKeys, IFormData, IHandleChange } from '@/components/form/form';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { FieldError, FieldHint } from './FieldComponents';

export interface ICustomCheckboxProps<TFormBody extends IFormData = IFormData> {
    name: DotNestedBooleanKeys<TFormBody> | string;
    value?: boolean | undefined;
    label: ReactNode;
    onChange: IHandleChange;
    required?: boolean | undefined;
    disabled?: boolean | undefined;
    hint?: string | undefined;
    errorMessage?: string | undefined;
    className?: string | undefined;
}

const CustomCheckbox = <TFormBody extends IFormData = IFormData>({ name, value, label, onChange, required, disabled, hint, errorMessage, className }: ICustomCheckboxProps<TFormBody>) => {
    const checkboxProps = {
        id: name,
        name,
        checked: Boolean(value),
        ...(required !== undefined ? { required } : {}),
        ...(disabled !== undefined ? { disabled } : {}),
    };

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <label className={cn('flex items-start gap-2.5', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
                <Checkbox
                    {...checkboxProps}
                    onCheckedChange={(checked) => {
                        onChange({
                            target: {
                                name,
                                value: checked === true,
                            },
                        });
                    }}
                    className='mt-0.5'
                />
                <span className='text-regular text-foreground'>
                    {label}
                    {required ? <span className='text-destructive'> *</span> : null}
                </span>
            </label>
            <FieldHint text={hint} className='pl-6' />
            <FieldError message={errorMessage} className='pl-6' />
        </div>
    );
};

CustomCheckbox.displayName = 'CustomCheckbox';

export default memo(CustomCheckbox) as typeof CustomCheckbox;
