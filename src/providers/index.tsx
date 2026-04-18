'use client';

import { type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './ThemeProvider';
interface IProvidersProps {
    children: ReactNode;
}

export const Providers = ({ children }: IProvidersProps) => {
    return (
        <ThemeProvider>
            {children}
            <Toaster
                position='top-right'
                toastOptions={{
                    classNames: {
                        toast: 'bg-background border border-border shadow-lg',
                        title: 'text-foreground font-semibold',
                        description: 'text-muted-foreground',
                        actionButton: 'bg-primary text-primary-foreground',
                        cancelButton: 'bg-muted text-muted-foreground',
                    },
                }}
            />
        </ThemeProvider>
    );
};
