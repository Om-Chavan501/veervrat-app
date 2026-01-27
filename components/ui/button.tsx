import { cloneElement, forwardRef, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      icon,
      loading = false,
      asChild = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-[12px] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B8E4E] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed";

    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-[#6B8E4E] text-white shadow-soft hover:bg-[#56723f] hover:shadow-lg focus-visible:outline-[#6B8E4E]",
      secondary:
        "bg-[#C47B5C] text-white shadow-soft hover:bg-[#ab6447] hover:shadow-lg focus-visible:outline-[#C47B5C]",
      ghost:
        "bg-transparent text-[#2C2C2C] hover:bg-[#f1eee7] border border-transparent focus-visible:outline-[#6B8E4E]",
      outline:
        "bg-white text-[#2C2C2C] border border-[#d9d7d1] hover:border-[#6B8E4E] hover:text-[#56723f] shadow-sm",
      subtle:
        "bg-[#f4f1ea] text-[#2C2C2C] border border-[#e5e5e5] hover:border-[#6B8E4E]",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "text-sm px-3 py-2 min-h-[40px]",
      md: "text-sm px-4 py-2.5 min-h-[44px]",
      lg: "text-base px-5 py-3 min-h-[48px]",
    };

    if (asChild && isValidElement(children)) {
      return cloneElement(children as ReactElement, {
        className: cn(
          base,
          variants[variant],
          sizes[size],
          (children as ReactElement).props.className,
          className
        )
      });
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin"
            aria-hidden
          />
        )}
        {icon ? <span aria-hidden>{icon}</span> : null}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
