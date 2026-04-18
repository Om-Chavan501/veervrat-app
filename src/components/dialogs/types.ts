import { type ComponentType, type ReactNode } from 'react';

import { type IFieldConfig } from '@/components/form';
import { type IFormData } from '@/interfaces/actionHelper';

export type DialogType = 'confirmation' | 'form' | 'view';
export type DialogWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ConfirmationTone = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export const DIALOG_WIDTH_CLASS: Record<DialogWidth, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

export interface IBaseDialogConfig {
    type: DialogType;
    title: string;
    description?: string;
    width?: DialogWidth;
    closeOnOutsideClick?: boolean;
}

export interface IConfirmationDialogConfig extends IBaseDialogConfig {
    type: 'confirmation';
    message?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: ConfirmationTone;
    onConfirm: () => Promise<void> | void;
}

export interface IFormDialogConfig<TFormBody extends IFormData = IFormData> extends IBaseDialogConfig {
    type: 'form';
    fields: Array<IFieldConfig<TFormBody>> | ((formData: TFormBody, handleChange: (event: { target: { name: string; value: unknown } }) => void) => Array<IFieldConfig<TFormBody>>);
    defaultValues?: Partial<TFormBody>;
    submitLabel?: string;
    cancelLabel?: string;
    requireModification?: boolean;
    className?: string;
    onSubmit: (data: TFormBody) => Promise<void> | void;
}

export interface IViewDialogConfig extends IBaseDialogConfig {
    type: 'view';
    content: ReactNode;
    subText?: string;
    icon?: ComponentType<{ className?: string }>;
    closeLabel?: string;
}

export type IDialogConfig = IConfirmationDialogConfig | IFormDialogConfig | IViewDialogConfig;

export interface IControlledDialogProps {
    open: boolean;
    onClose: () => void;
}
