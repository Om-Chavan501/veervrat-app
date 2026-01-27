import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card rounded-[16px] border border-[#e5e5e5] bg-white/90 shadow-card transition-shadow hover:shadow-soft",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn(
        "border-b border-[#f0eee8] px-6 py-4 flex items-center justify-between gap-3",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn(
        "text-lg font-semibold text-[#2c2c2c] tracking-tight leading-6",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: CardSectionProps) {
  return (
    <p
      className={cn("text-sm text-[#6b6b6b] leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: CardSectionProps) {
  return <div className={cn("px-6 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardSectionProps) {
  return <div className={cn("px-6 py-4 pt-0", className)} {...props} />;
}
