import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState renders a lightweight dashed card with icon, title, description, and optional action.
 * Use to guide users toward the next step when content is missing.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-[#d8d1c6] bg-[#faf6ef] px-5 py-6 text-center shadow-inner",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm text-[#6b8e4e]">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-[#2c2c2c]">{title}</p>
        <p className="text-sm text-[#6b6b6b]">{description}</p>
      </div>
      {action}
    </div>
  );
}
