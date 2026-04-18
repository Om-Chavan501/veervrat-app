'use client';

import { memo } from 'react';

import { RichTextEditor } from '@/components/admin/RichTextEditor';
import type { DotNestedScalarKeys, IFormData, IHandleChange } from '@/components/form/form';
import { cn } from '@/lib/utils';

import { FieldError, FieldHint, FieldLabel } from './FieldComponents';

export interface ICustomRichTextProps<TFormBody extends IFormData = IFormData> {
    name: DotNestedScalarKeys<TFormBody> | string;
    value?: string | undefined;
    onChange: IHandleChange;
    label?: string | undefined;
    info?: string | undefined;
    hint?: string | undefined;
    errorMessage?: string | undefined;
    required?: boolean | undefined;
    disabled?: boolean | undefined;
    placeholder?: string | undefined;
    minHeight?: string | undefined;
    className?: string | undefined;
}

const CustomRichText = <TFormBody extends IFormData = IFormData>({
    name,
    value,
    onChange,
    label,
    info,
    hint,
    errorMessage,
    required,
    disabled,
    placeholder,
    minHeight,
    className,
}: ICustomRichTextProps<TFormBody>) => {
    const editorOptionalProps = {
        ...(placeholder !== undefined ? { placeholder } : {}),
        ...(minHeight !== undefined ? { minHeight } : {}),
    };

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <FieldLabel label={label} info={info} required={required} />
            <div className={cn(disabled ? 'pointer-events-none opacity-60' : undefined)}>
                <RichTextEditor
                    value={value ?? ''}
                    onChange={(html) => {
                        onChange({
                            target: {
                                name,
                                value: html,
                            },
                        });
                    }}
                    {...editorOptionalProps}
                />
            </div>
            <FieldHint text={hint} />
            <FieldError message={errorMessage} />
        </div>
    );
};

CustomRichText.displayName = 'CustomRichText';

export default memo(CustomRichText) as typeof CustomRichText;
