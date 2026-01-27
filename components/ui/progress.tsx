import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  tone?: "primary" | "secondary" | "neutral";
}

export function Progress({
  value,
  max = 100,
  tone = "primary",
  className,
  ...props
}: ProgressProps) {
  const safeValue = Math.max(0, Math.min(value, max));
  const percent = (safeValue / max) * 100;

  const toneClass =
    tone === "secondary"
      ? "from-[#c47b5c] to-[#d38b6d]"
      : tone === "neutral"
      ? "from-[#9fa89f] to-[#b8c1b8]"
      : "from-[#6b8e4e] to-[#7fa65c]";

  return (
    <div
      className={cn(
        "h-3 rounded-full bg-[#f0eee8] border border-[#e5e5e5] overflow-hidden shadow-inner",
        className
      )}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-300 ease-out",
          toneClass
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
