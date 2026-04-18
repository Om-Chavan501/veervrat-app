'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { renderField, type IFieldConfig } from '@/components/form';
import { Button } from '@/components/ui/button';
import { useFormOperations } from '@/hooks/form/useFormOperations';
import { type IFormData } from '@/interfaces/actionHelper';
import { cn } from '@/lib/utils';

import { DialogWrapper } from './DialogWrapper';
import { type IControlledDialogProps, type IFormDialogConfig } from './types';

export interface IFormDialogProps<TFormBody extends IFormData> extends IControlledDialogProps, Omit<IFormDialogConfig<TFormBody>, 'type'> {}

export function FormDialog<TFormBody extends IFormData>({
    open,
    onClose,
    onSubmit,
    title,
    description,
    fields,
    defaultValues,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    width = 'md',
    requireModification = true,
    className,
    closeOnOutsideClick = true,
}: IFormDialogProps<TFormBody>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { formData, handleChange, isModified, resetForm } = useFormOperations<TFormBody>(defaultValues ?? {});

    const resolvedFields = useMemo<Array<IFieldConfig<TFormBody>>>(() => (typeof fields === 'function' ? fields(formData, handleChange) : fields), [fields, formData, handleChange]);

    const handleClose = (force = false) => {
        if (!force && isSubmitting) {
            return;
        }

        resetForm();
        onClose();
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            handleClose(true);
        } catch {
            // Keep the dialog open when submit fails so users can correct input and retry.
        } finally {
            setIsSubmitting(false);
        }
    };

    const descriptionProps = description !== undefined ? { description } : {};

    return (
        <DialogWrapper open={open} onClose={handleClose} title={title} width={width} closeOnOutsideClick={closeOnOutsideClick && !isSubmitting} bodyClassName='px-0 pb-0' {...descriptionProps}>
            <form onSubmit={handleSubmit} className='flex flex-col'>
                <div className={cn('grid max-h-[50vh] gap-x-5 gap-y-3 overflow-y-auto px-5 no-scrollbar sm:grid-cols-2 md:grid-cols-6', className)}>
                    {resolvedFields.map((field, index) => renderField(formData, handleChange, field, index))}
                </div>
                <div className='mt-4 flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end'>
                    <Button type='button' variant='outline' onClick={() => handleClose()} disabled={isSubmitting}>
                        {cancelLabel}
                    </Button>
                    <Button type='submit' disabled={isSubmitting || (requireModification && !isModified)}>
                        {isSubmitting ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            </form>
        </DialogWrapper>
    );
}

export default FormDialog;
