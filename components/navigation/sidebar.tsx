/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  userName: string;
  activeJourneyCount: number;
  supportedCount?: number;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    sectionId: "hero",
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
    sectionId: "assessments",
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
    sectionId: "journeys",
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
    label: "Vratmitra Support",
    href: "/vratmitra",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11V6.5a2.5 2.5 0 0 0-5 0V12a7 7 0 0 0 7 7h1" strokeLinecap="round" />
        <path d="M15 11V6.5a2.5 2.5 0 0 1 5 0V12a7 7 0 0 1-7 7h-1" strokeLinecap="round" />
      </svg>
    ),
    match: (pathname: string) => pathname.startsWith("/vratmitra"),
  },
  {
    label: "Archive",
    href: "/archive",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 3h10M9 12h6" strokeLinecap="round" />
      </svg>
    ),
    match: (pathname: string) => pathname.startsWith("/archive"),
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
];

export function NavigationSidebar({ userName, activeJourneyCount, supportedCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ sectionId: string }>;
      setActiveSection(custom.detail.sectionId);
    };
    window.addEventListener("veervrat-section-change", handler as EventListener);
    return () => window.removeEventListener("veervrat-section-change", handler as EventListener);
  }, []);

  return (
    <aside className="sticky top-0 hidden max-h-screen w-72 flex-col overflow-y-auto self-start border-r border-[#e5e5e5] bg-white/80 backdrop-blur-lg shadow-[12px_0_40px_rgba(44,44,44,0.06)] lg:flex">
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
          const isActive =
            (pathname === "/dashboard" && activeSection && item.sectionId === activeSection) ||
            item.match(pathname);
          const isJourneys = item.label === "Active Journeys";
          const isSupport = item.label === "Vratmitra Support";

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (item.sectionId && pathname === "/dashboard") {
                  e.preventDefault();
                  const target =
                    document.querySelector(`[data-section="${item.sectionId}"]`) ||
                    document.querySelector(item.href);
                  target?.scrollIntoView({ behavior: "smooth", block: "start" });
                  window.history.pushState(null, "", item.href);
                }
              }}
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
              {isSupport && supportedCount > 0 ? (
                <Badge tone="info" className="px-2 py-1 text-xs font-bold">
                  {supportedCount}
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
