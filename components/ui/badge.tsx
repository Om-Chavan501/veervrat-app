import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone =
  | "active"
  | "paused"
  | "completed"
  | "info"
  | "success"
  | "warning"
  | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  pulseOnHover?: boolean;
}

const toneStyles: Record<BadgeTone, string> = {
  active:
    "bg-[#e7f0df] text-[#2d5a1a] border border-[#b6c9a4] shadow-[0_10px_30px_rgba(107,142,78,0.12)]",
  paused:
    "bg-[#fff3d9] text-[#a25a0f] border border-[#f2d195] shadow-[0_10px_30px_rgba(255,167,38,0.14)]",
  completed:
    "bg-[#e6ecf5] text-[#284d80] border border-[#c5d1e4] shadow-[0_10px_30px_rgba(100,149,237,0.16)]",
  info:
    "bg-[#e8f2fd] text-[#1c64b0] border border-[#c0d6f5] shadow-[0_10px_30px_rgba(100,149,237,0.12)]",
  success:
    "bg-[#e7f3df] text-[#316327] border border-[#c2dfab] shadow-[0_10px_30px_rgba(124,179,66,0.15)]",
  warning:
    "bg-[#fff1e0] text-[#a35300] border border-[#f7caa0] shadow-[0_10px_30px_rgba(255,167,38,0.15)]",
  neutral:
    "bg-[#f4f1ea] text-[#4a4a4a] border border-[#e1ddd4] shadow-[0_10px_30px_rgba(0,0,0,0.05)]",
};

const toneIcon: Record<BadgeTone, JSX.Element | null> = {
  active: (
    <span
      className="h-2.5 w-2.5 rounded-full bg-[#4f7d2f] ring-2 ring-[#b6c9a4]"
      aria-hidden
    />
  ),
  paused: (
    <svg
      className="h-3.5 w-3.5 text-[#a25a0f]"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M9 7h2v10H9V7zm4 0h2v10h-2V7z" />
    </svg>
  ),
  completed: (
    <svg
      className="h-3.5 w-3.5 text-[#284d80]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  info: (
    <span className="h-2.5 w-2.5 rounded-full bg-[#1c64b0]" aria-hidden />
  ),
  success: (
    <span className="h-2.5 w-2.5 rounded-full bg-[#316327]" aria-hidden />
  ),
  warning: (
    <span className="h-2.5 w-2.5 rounded-full bg-[#a35300]" aria-hidden />
  ),
  neutral: (
    <span className="h-2.5 w-2.5 rounded-full bg-[#6b6b6b]" aria-hidden />
  ),
};

export function Badge({
  children,
  className,
  tone = "neutral",
  pulseOnHover = false,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold tracking-tight transition duration-200",
        toneStyles[tone],
        pulseOnHover ? "hover:scale-[1.02]" : "",
        className
      )}
      {...props}
    >
      {toneIcon[tone]}
      <span>{children}</span>
    </span>
  );
}
