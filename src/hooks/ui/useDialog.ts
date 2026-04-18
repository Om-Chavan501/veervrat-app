'use client';

import { useContext } from 'react';

import { DialogContext, type IDialogContextValue } from '@/providers/DialogProvider';

export type IUseDialogReturn = IDialogContextValue;

/**
 * Global dialog API from DialogProvider.
 */
export const useDialog = (): IUseDialogReturn => {
    const dialog = useContext(DialogContext);

    if (!dialog) {
        throw new Error('useDialog must be used within DialogProvider');
    }

    return dialog;
};

export default useDialog;
