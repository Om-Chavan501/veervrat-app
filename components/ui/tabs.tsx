import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  badge?: ReactNode;
  description?: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onTabChange: (id: string) => void;
}

export function Tabs({ tabs, activeId, onTabChange }: TabsProps) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 rounded-[14px] border border-[#e5e5e5] bg-white/70 p-2 shadow-inner">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "flex flex-1 min-w-[140px] items-center justify-between gap-3 rounded-[12px] px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "bg-gradient-to-r from-[#6b8e4e] to-[#7fa65c] text-white shadow-soft"
                  : "text-[#2c2c2c] bg-[#f7f4ed] hover:bg-[#f0ede5]"
              )}
              aria-current={isActive}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.badge}
              </span>
              {tab.description ? (
                <span className="text-xs font-normal text-inherit">
                  {tab.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
