/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  userName: string;
  activeJourneyCount: number;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    label: "My Assessments",
    href: "/lacunae",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4h12a2 2 0 0 1 2 2v12l-5-3-5 3-5-3v-9a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    match: (pathname: string) =>
      pathname.startsWith("/lacunae") ||
      pathname.startsWith("/assessments") ||
      pathname.startsWith("/assessment-results"),
  },
  {
    label: "Active Journeys",
    href: "/dashboard#journeys",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 10.5 12 5l8 5.5-8 5.5-8-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 5v11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    match: (pathname: string) =>
      pathname.startsWith("/journeys") || pathname === "/dashboard",
  },
  {
    label: "Ontology Explorer",
    href: "/ontology",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12h16" strokeLinecap="round" />
        <path d="M12 4v16" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    match: (pathname: string) => pathname.startsWith("/ontology"),
  },
  {
    label: "Profile / Settings",
    href: "/dashboard#profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20c1.5-3 4.5-4 7-4s5.5 1 7 4" strokeLinecap="round" />
      </svg>
    ),
    match: (pathname: string) => pathname === "/dashboard",
  },
];

export function NavigationSidebar({ userName, activeJourneyCount }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-[#e5e5e5] lg:bg-white/80 lg:backdrop-blur-lg lg:shadow-[12px_0_40px_rgba(44,44,44,0.06)]">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#6b8e4e] to-[#c47b5c] shadow-soft flex items-center justify-center text-white font-bold">
          VV
        </div>
        <div>
          <p className="text-sm text-[#6b6b6b]">Welcome back</p>
          <p className="text-base font-semibold text-[#2c2c2c]">{userName}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-1">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          const isJourneys = item.label === "Active Journeys";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-[12px] px-3.5 py-3 text-sm font-semibold transition hover:bg-[#f4f1ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b8e4e]",
                isActive
                  ? "bg-gradient-to-r from-[#eef3e7] to-[#f5ede6] text-[#2c2c2c] border border-[#d8d1c6] shadow-soft"
                  : "text-[#4a4a4a]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[10px] border border-transparent transition",
                    isActive
                      ? "bg-white text-[#6b8e4e] shadow-card"
                      : "bg-[#f7f4ed] text-[#6b6b6b] group-hover:text-[#6b8e4e]"
                  )}
                  aria-hidden
                >
                  {item.icon}
                </span>
                {item.label}
              </span>
              {isJourneys ? (
                <Badge tone="active" className="px-2 py-1 text-xs font-bold">
                  {activeJourneyCount}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#e5e5e5] px-6 py-4 text-xs text-[#6b6b6b]">
        Slow by design — move with intention.
      </div>
    </aside>
  );
}
