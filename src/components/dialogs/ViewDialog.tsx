'use client';

import { type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import { DialogWrapper } from './DialogWrapper';
import { type IControlledDialogProps, type IViewDialogConfig } from './types';

export interface IViewDialogProps extends IControlledDialogProps, Omit<IViewDialogConfig, 'type'> {}

export function ViewDialog({ open, onClose, title, description, subText, content, icon: Icon, closeLabel = 'Close', width = 'lg', closeOnOutsideClick = true }: IViewDialogProps): ReactNode {
    const descriptionProps = description !== undefined ? { description } : {};

    return (
        <DialogWrapper open={open} onClose={onClose} title={title} width={width} closeOnOutsideClick={closeOnOutsideClick} {...descriptionProps}>
            <div className='flex flex-col gap-4'>
                {Icon || subText ? (
                    <div className='flex items-start gap-3'>
                        {Icon ? (
                            <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary'>
                                <Icon className='size-5' />
                            </span>
                        ) : null}
                        {subText ? <p className='pt-1 text-small text-muted-foreground'>{subText}</p> : null}
                    </div>
                ) : null}

                <div className='max-h-[60vh] overflow-y-auto pr-1 no-scrollbar'>{content}</div>

                <div className='flex justify-end'>
                    <Button type='button' onClick={onClose}>
                        {closeLabel}
                    </Button>
                </div>
            </div>
        </DialogWrapper>
    );
}

export default ViewDialog;
