import { cva, type VariantProps } from 'class-variance-authority';
import { XIcon } from 'lucide-react';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const pillVariants = cva(
    "relative inline-flex shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border font-medium transition-base focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground! [a&]:hover:bg-primary/90',
                subtle: 'border-transparent bg-primary/8 text-primary [a&]:hover:bg-primary/12',
                neutral: 'border-border bg-background/85 text-muted-foreground [a&]:hover:border-primary/30 [a&]:hover:text-foreground',
                outline: 'border-border bg-background text-foreground [a&]:hover:border-primary/40 [a&]:hover:text-primary',
                success: 'border-success/35 bg-success/15 text-success',
                warning: 'border-warning/35 bg-warning/15 text-warning',
                destructive: 'border-destructive/30 bg-destructive/15 text-destructive',
            },
            size: {
                chip: 'px-2.5 py-1 text-label',
                status: 'px-3 py-0.5 text-xs',
                cta: 'px-3 py-1 text-small',
            },
        },
        defaultVariants: {
            variant: 'subtle',
            size: 'chip',
        },
    },
);

type PillBaseProps = React.ComponentProps<'span'> &
    VariantProps<typeof pillVariants> & {
        asChild?: boolean;
        onRemove?: undefined;
        removeIcon?: undefined;
    };

type PillRemovableProps = Omit<React.ComponentProps<'div'>, 'children'> &
    VariantProps<typeof pillVariants> & {
        onRemove: () => void;
        /** Override the remove icon. Defaults to XIcon. */
        removeIcon?: React.ReactElement<{ className?: string }>;
        children: React.ReactNode;
    };

export type PillProps = PillBaseProps | PillRemovableProps;

function Pill(props: PillProps) {
    // Removable variant
    if (props.onRemove !== undefined) {
        const { className, variant = 'subtle', size = 'chip', onRemove, removeIcon, children, ...rest } = props as PillRemovableProps;
        return (
            <div data-slot='pill' data-variant={variant} data-size={size} className={cn(pillVariants({ variant, size }), 'pr-1', className)} {...rest}>
                <span className='leading-none'>{children}</span>
                <button
                    type='button'
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className='ml-0.5 flex items-center justify-center rounded-full p-0.5 opacity-60 transition-fast hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    aria-label={`Remove ${typeof children === 'string' ? children : 'tag'}`}
                >
                    {removeIcon ?? <XIcon className='size-3' />}
                </button>
            </div>
        );
    }

    // Standard variant
    const { className, variant = 'subtle', size = 'chip', asChild = false, ...rest } = props as PillBaseProps;
    const Comp = asChild ? Slot.Root : 'span';
    return <Comp data-slot='pill' data-variant={variant} data-size={size} className={cn(pillVariants({ variant, size }), className)} {...rest} />;
}

export { Pill, pillVariants };
