'use client';

import { useState } from 'react';

import { AlertTriangle, Check, Info, Trash2, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { DialogWrapper } from './DialogWrapper';
import { type ConfirmationTone, type IConfirmationDialogConfig, type IControlledDialogProps } from './types';

const toneIconMap: Record<ConfirmationTone, { icon: LucideIcon; colorClass: string; confirmVariant: 'default' | 'destructive' }> = {
    default: { icon: AlertTriangle, colorClass: 'text-warning', confirmVariant: 'default' },
    destructive: { icon: Trash2, colorClass: 'text-destructive', confirmVariant: 'destructive' },
    success: { icon: Check, colorClass: 'text-success', confirmVariant: 'default' },
    warning: { icon: AlertTriangle, colorClass: 'text-warning', confirmVariant: 'default' },
    info: { icon: Info, colorClass: 'text-primary', confirmVariant: 'default' },
};

export interface IConfirmationDialogProps extends IControlledDialogProps, Omit<IConfirmationDialogConfig, 'type'> {}

export function ConfirmationDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'default',
    width = 'sm',
    closeOnOutsideClick = true,
}: IConfirmationDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const selectedTone = toneIconMap[tone];
    const Icon = selectedTone.icon;

    const handleConfirm = async () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const descriptionProps = description !== undefined ? { description } : {};

    return (
        <DialogWrapper open={open} onClose={onClose} title={title} width={width} closeOnOutsideClick={closeOnOutsideClick && !isSubmitting} bodyClassName='pt-1' {...descriptionProps}>
            <div className='flex items-start gap-3'>
                <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted'>
                    <Icon className={cn('size-5', selectedTone.colorClass)} />
                </span>
                <div className='flex min-w-0 flex-col gap-2'>
                    {message ? <div className='text-body text-foreground'>{message}</div> : null}
                    <div className='flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end'>
                        <Button type='button' variant='outline' onClick={onClose} disabled={isSubmitting}>
                            {cancelLabel}
                        </Button>
                        <Button type='button' variant={selectedTone.confirmVariant} onClick={() => void handleConfirm()} disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </DialogWrapper>
    );
}

export default ConfirmationDialog;
