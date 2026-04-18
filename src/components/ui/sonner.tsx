import React from 'react';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => (
    <Sonner className="toaster group"
        icons={{ success: null, info: null, warning: null, error: null, loading: null, close: null }}
        toastOptions={{
            unstyled: true,
            style: { width: '100%', maxWidth: 'min(500px, calc(100vw - 32px))', padding: '15px', margin: '0', borderRadius: '8px' },
            classNames: {
                toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                description: 'group-[.toast]:text-muted-foreground',
                actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
            }
        }} {...props}
    />
);

export { Toaster };
