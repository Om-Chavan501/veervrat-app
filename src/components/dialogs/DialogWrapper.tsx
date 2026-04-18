'use client';

import { type ReactNode } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { DIALOG_WIDTH_CLASS, type DialogWidth } from './types';

export interface IDialogWrapperProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    width?: DialogWidth;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
    showCloseButton?: boolean;
    closeOnOutsideClick?: boolean;
}

export function DialogWrapper({
    open,
    onClose,
    title,
    description,
    width = 'md',
    children,
    className,
    bodyClassName,
    showCloseButton = true,
    closeOnOutsideClick = true,
}: IDialogWrapperProps): ReactNode {
    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && closeOnOutsideClick) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent showCloseButton={showCloseButton} className={cn('flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-xl p-0 no-scrollbar', DIALOG_WIDTH_CLASS[width], className)}>
                <DialogHeader className='flex flex-col gap-1 p-5 pb-3 text-left'>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>
                <div className={cn('px-5 pb-5', bodyClassName)}>{children}</div>
            </DialogContent>
        </Dialog>
    );
}

export default DialogWrapper;
