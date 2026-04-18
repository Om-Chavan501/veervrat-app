'use client';

import { type ReactNode } from 'react';

import { type IFormData } from '@/interfaces/actionHelper';

import { ConfirmationDialog } from './ConfirmationDialog';
import { FormDialog } from './FormDialog';
import { ViewDialog } from './ViewDialog';
import { type IDialogConfig } from './types';

export interface IDialogHostProps {
    open: boolean;
    config: IDialogConfig | null;
    onClose: () => void;
}

export function DialogHost({ open, config, onClose }: IDialogHostProps): ReactNode {
    if (!config) {
        return null;
    }

    switch (config.type) {
        case 'confirmation':
            return <ConfirmationDialog open={open} onClose={onClose} {...config} />;
        case 'form':
            return <FormDialog<IFormData> open={open} onClose={onClose} {...config} />;
        case 'view':
            return <ViewDialog open={open} onClose={onClose} {...config} />;
        default:
            return null;
    }
}

export default DialogHost;
