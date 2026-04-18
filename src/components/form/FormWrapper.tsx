'use client';

import { type Dispatch, type FormEvent, type HTMLInputTypeAttribute, memo, type ReactElement, type ReactNode, type RefObject, type SetStateAction } from 'react';

import { get } from 'lodash';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { DotNestedBooleanKeys, DotNestedScalarKeys, IFormData, IHandleChange } from '@/components/form/form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import CustomCheckbox from './CustomCheckbox';
import CustomInput, { type InputType } from './CustomInput';
import CustomRichText from './CustomRichText';
import CustomSelect, { type ISelectFieldValue, type ISelectOption } from './CustomSelect';
import CustomTagInput from './CustomTagInput';
import CustomTextArea from './CustomTextArea';
import CustomToggle from './CustomToggle';

export type SizeVariant = keyof typeof fieldSizeFormatter;

export const fieldSizeFormatter = {
    full: 'col-span-full',
    4: 'col-span-full sm:col-span-2 md:col-span-4',
    3: 'col-span-full sm:col-span-2 md:col-span-3',
    2: 'col-span-full sm:col-span-1 md:col-span-2',
} as const;

type TScalarPath<TFormBody extends IFormData> = DotNestedScalarKeys<TFormBody> | string;
type TBooleanPath<TFormBody extends IFormData> = DotNestedBooleanKeys<TFormBody> | string;

interface IBaseFieldConfig {
    key?: number | string | undefined;
    colsize?: SizeVariant | undefined;
    hidden?: boolean | undefined;
    className?: string | undefined;
}

interface ISharedFieldConfig {
    info?: string | undefined;
    hint?: string | undefined;
    errorMessage?: string | undefined;
    required?: boolean | undefined;
    disabled?: boolean | undefined;
}

export interface IInputFieldConfig<TFormBody extends IFormData> extends IBaseFieldConfig, ISharedFieldConfig {
    fieldtype: 'input';
    name: TScalarPath<TFormBody>;
    label?: string | undefined;
    value?: string | number | undefined;
    placeholder?: string | undefined;
    type?: HTMLInputTypeAttribute | undefined;
    inputType?: InputType | undefined;
    startIcon?: ReactElement<{ className?: string }> | undefined;
    endIcon?: ReactElement<{ className?: string }> | undefined;
    allowPasswordToggle?: boolean | undefined;
    allowCopy?: boolean | undefined;
    supplementaryLink?:
        | {
              href: string;
              text: string;
              target?: '_self' | '_blank' | undefined;
          }
        | undefined;
    autoComplete?: string | undefined;
}

export interface ITextAreaFieldConfig<TFormBody extends IFormData> extends IBaseFieldConfig, ISharedFieldConfig {
    fieldtype: 'textArea';
    name: TScalarPath<TFormBody>;
    label?: string | undefined;
    value?: string | undefined;
    placeholder?: string | undefined;
    rows?: number | undefined;
}

export interface ISelectFieldConfig<TFormBody extends IFormData, TValue extends ISelectFieldValue = ISelectFieldValue> extends IBaseFieldConfig, ISharedFieldConfig {
    fieldtype: 'select';
    name: TScalarPath<TFormBody>;
    label?: string | undefined;
    value?: TValue | undefined;
    options: Array<ISelectOption<TValue>>;
    placeholder?: string | undefined;
    isLoading?: boolean | undefined;
    isSearchable?: boolean | undefined;
    noOptionsMessage?: string | undefined;
}

export interface ICheckboxFieldConfig<TFormBody extends IFormData> extends IBaseFieldConfig, ISharedFieldConfig {
    fieldtype: 'checkbox';
    name: TBooleanPath<TFormBody>;
    value?: boolean;
    label: ReactNode;
}

export interface IToggleFieldConfig<TFormBody extends IFormData> extends IBaseFieldConfig, ISharedFieldConfig {
    fieldtype: 'toggle';
    name: TBooleanPath<TFormBody>;
    label?: string | undefined;
    value?: boolean | undefined;
    icon?: ReactElement<{ className?: string }> | undefined;
}

export interface IRichTextFieldConfig<TFormBody extends IFormData> extends IBaseFieldConfig, ISharedFieldConfig {
    fieldtype: 'authorly';
    name: TScalarPath<TFormBody>;
    label?: string | undefined;
    value?: string | undefined;
    placeholder?: string | undefined;
    minHeight?: string | undefined;
}

export interface IDividerFieldConfig extends IBaseFieldConfig {
    fieldtype: 'divider';
    type?: 'gap' | 'line' | undefined;
    size?: 'xs' | 'md' | 'lg' | undefined;
    name?: string | undefined;
}

export interface ITagInputFieldConfig<TFormBody extends IFormData> extends IBaseFieldConfig, ISharedFieldConfig {
    fieldtype: 'tagInput';
    name: TScalarPath<TFormBody>;
    label?: string | undefined;
    value?: string[] | undefined;
    placeholder?: string | undefined;
    maxTags?: number | undefined;
}

export interface IGroupFieldConfig<TFormBody extends IFormData> extends IBaseFieldConfig {
    fieldtype: 'group';
    title?: string | undefined;
    subText?: string | undefined;
    fields: Array<IFieldConfig<TFormBody>>;
}

export type IFieldConfig<TFormBody extends IFormData> =
    | IInputFieldConfig<TFormBody>
    | ITextAreaFieldConfig<TFormBody>
    | ISelectFieldConfig<TFormBody>
    | ICheckboxFieldConfig<TFormBody>
    | IToggleFieldConfig<TFormBody>
    | IRichTextFieldConfig<TFormBody>
    | ITagInputFieldConfig<TFormBody>
    | IDividerFieldConfig
    | IGroupFieldConfig<TFormBody>;

const getResolvedValue = <TFormBody extends IFormData, TValue>(formData: TFormBody, name: string, fallback: TValue): TValue => {
    const dataValue = get(formData, name);
    return (dataValue ?? fallback) as TValue;
};

export const renderField = <TFormBody extends IFormData>(formData: TFormBody, handleChange: IHandleChange, field: IFieldConfig<TFormBody>, index?: number): ReactNode => {
    if (field.hidden) {
        return null;
    }

    const colClassName = fieldSizeFormatter[field.colsize ?? 2];
    const containerClassName = cn(colClassName, field.className);
    const key = field.key ?? ('name' in field ? field.name : `${field.fieldtype}-${index ?? 0}`);

    switch (field.fieldtype) {
        case 'input':
            return (
                <CustomInput
                    key={key}
                    name={field.name}
                    value={field.value ?? getResolvedValue(formData, field.name, '')}
                    onChange={handleChange}
                    type={field.type}
                    required={field.required}
                    disabled={field.disabled}
                    label={field.label}
                    info={field.info}
                    hint={field.hint}
                    errorMessage={field.errorMessage}
                    placeholder={field.placeholder}
                    inputType={field.inputType}
                    startIcon={field.startIcon}
                    endIcon={field.endIcon}
                    allowPasswordToggle={field.allowPasswordToggle}
                    allowCopy={field.allowCopy}
                    supplementaryLink={field.supplementaryLink}
                    autoComplete={field.autoComplete}
                    containerClassName={containerClassName}
                />
            );
        case 'textArea':
            return (
                <CustomTextArea
                    key={key}
                    name={field.name}
                    value={field.value ?? getResolvedValue(formData, field.name, '')}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled}
                    label={field.label}
                    info={field.info}
                    hint={field.hint}
                    errorMessage={field.errorMessage}
                    placeholder={field.placeholder}
                    rows={field.rows}
                    containerClassName={containerClassName}
                />
            );
        case 'select':
            return (
                <CustomSelect
                    key={key}
                    name={field.name}
                    value={field.value ?? getResolvedValue(formData, field.name, undefined)}
                    options={field.options}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled}
                    label={field.label}
                    info={field.info}
                    hint={field.hint}
                    errorMessage={field.errorMessage}
                    placeholder={field.placeholder}
                    isLoading={field.isLoading}
                    isSearchable={field.isSearchable}
                    noOptionsMessage={field.noOptionsMessage}
                    containerClassName={containerClassName}
                />
            );
        case 'checkbox':
            return (
                <CustomCheckbox
                    key={key}
                    name={field.name}
                    value={field.value ?? getResolvedValue(formData, field.name, false)}
                    label={field.label}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled}
                    hint={field.hint}
                    errorMessage={field.errorMessage}
                    className={containerClassName}
                />
            );
        case 'toggle':
            return (
                <CustomToggle
                    key={key}
                    name={field.name}
                    value={field.value ?? getResolvedValue(formData, field.name, false)}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled}
                    label={field.label}
                    icon={field.icon}
                    hint={field.hint}
                    errorMessage={field.errorMessage}
                    className={containerClassName}
                />
            );
        case 'authorly':
            return (
                <CustomRichText
                    key={key}
                    name={field.name}
                    value={field.value ?? getResolvedValue(formData, field.name, '')}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled}
                    label={field.label}
                    info={field.info}
                    hint={field.hint}
                    errorMessage={field.errorMessage}
                    placeholder={field.placeholder}
                    minHeight={field.minHeight}
                    className={containerClassName}
                />
            );
        case 'tagInput':
            return (
                <CustomTagInput
                    key={key}
                    name={field.name}
                    value={field.value ?? getResolvedValue(formData, field.name, [])}
                    onChange={handleChange}
                    required={field.required}
                    disabled={field.disabled}
                    label={field.label}
                    info={field.info}
                    hint={field.hint}
                    errorMessage={field.errorMessage}
                    placeholder={field.placeholder}
                    maxTags={field.maxTags}
                    containerClassName={containerClassName}
                />
            );
        case 'divider': {
            const dividerHeight = field.size === 'xs' ? 'h-3' : field.size === 'lg' ? 'h-8' : 'h-5';
            return (
                <div key={key} className={cn('col-span-full flex items-center', dividerHeight, field.className)}>
                    {field.type === 'line' ? <hr className='w-full border-border' /> : null}
                </div>
            );
        }
        case 'group':
            return (
                <div key={key} className={cn('col-span-full flex flex-col gap-3', field.className)}>
                    {field.title || field.subText ? (
                        <div className='flex flex-col gap-0.5'>
                            {field.title ? <h4 className='text-title text-foreground'>{field.title}</h4> : null}
                            {field.subText ? <p className='text-regular text-muted-foreground'>{field.subText}</p> : null}
                        </div>
                    ) : null}
                    <div className='grid gap-5 sm:grid-cols-2 md:grid-cols-6'>{field.fields.map((subField, subIndex) => renderField(formData, handleChange, subField, subIndex))}</div>
                </div>
            );
        default:
            return null;
    }
};

export interface IFormWrapperProps<TFormBody extends IFormData> {
    formConfig: Array<IFieldConfig<TFormBody>>;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
    handleSecondaryClick?: (() => void) | undefined;
    className?: string | undefined;
    submitLabel?: string | undefined;
    cancelLabel?: string | undefined;
    handleChange: IHandleChange;
    setFormData: Dispatch<SetStateAction<TFormBody>>;
    formData: TFormBody;
    isModified: boolean;
    isSubmitting: boolean;
    hideActionable?: boolean | undefined;
    navigateBackRequired?: boolean | undefined;
    submitBtnRef?: RefObject<HTMLButtonElement | null> | undefined;
    disabled?: boolean | undefined;
}

const FormWrapper = <TFormBody extends IFormData>({
    formConfig,
    handleSubmit,
    handleSecondaryClick,
    className,
    submitLabel = 'Submit',
    cancelLabel = 'Discard',
    handleChange,
    formData,
    isModified,
    isSubmitting,
    hideActionable = false,
    navigateBackRequired = true,
    submitBtnRef,
    disabled,
}: IFormWrapperProps<TFormBody>) => {
    const router = useRouter();

    return (
        <form onSubmit={handleSubmit} className={cn('flex flex-col gap-6 pb-5', className)}>
            <div className='grid gap-5 sm:grid-cols-2 md:grid-cols-6'>{formConfig.map((field, index) => renderField(formData, handleChange, field, index))}</div>

            {hideActionable ? null : (
                <div className='glass-card flex w-full flex-wrap items-center justify-between gap-3 rounded-xl p-4 shadow-glow-sm transition-all duration-300 hover:shadow-glow-md'>
                    <div className='flex flex-wrap items-center gap-3'>
                        {navigateBackRequired ? (
                            <Button type='button' variant='ghost' size='icon' onClick={() => router.back()} className='group size-9' aria-label='Go back'>
                                <ArrowLeft className='size-4 transition-fast group-hover:-translate-x-0.5' />
                            </Button>
                        ) : null}
                        <Button type='reset' variant='outline' disabled={!isModified || isSubmitting} onClick={handleSecondaryClick} className='h-9 min-w-28 bg-background/50 hover:bg-background/80'>
                            {cancelLabel}
                        </Button>
                    </div>
                    <Button ref={submitBtnRef} type='submit' disabled={!isModified || isSubmitting || disabled} className='h-9 w-full min-w-32 shadow-sm sm:w-auto'>
                        {isSubmitting ? 'Saving…' : submitLabel}
                    </Button>
                </div>
            )}
        </form>
    );
};

export default memo(FormWrapper) as typeof FormWrapper;
