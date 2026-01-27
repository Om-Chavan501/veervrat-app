"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/app/actions/auth";

const tabs = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    sectionId: "hero",
  },
  {
    label: "Assess",
    href: "/lacunae",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4h12a2 2 0 0 1 2 2v12l-5-3-5 3-5-3V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    sectionId: "assessments",
  },
  {
    label: "Journeys",
    href: "/dashboard#journeys",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m4 10.5 8-5.5 8 5.5-8 5.5-8-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 5v11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    sectionId: "journeys",
  },
  {
    label: "More",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="6" cy="12" r="1.5" />
        <circle cx="18" cy="12" r="1.5" />
      </svg>
    ),
  },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ sectionId: string }>;
      setActiveSection(custom.detail.sectionId);
    };
    window.addEventListener("veervrat-section-change", handler as EventListener);
    return () => window.removeEventListener("veervrat-section-change", handler as EventListener);
  }, []);

  const handleNavClick = (tab: (typeof tabs)[number], e: React.MouseEvent) => {
    if (tab.sectionId && pathname === "/dashboard") {
      e.preventDefault();
      const el = document.querySelector(`[data-section="${tab.sectionId}"]`) || document.querySelector(tab.href);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", tab.href);
    }
    if (tab.label === "More") {
      e.preventDefault();
      setSheetOpen(true);
    }
  };

  const activeHref = useMemo(() => {
    if (pathname.startsWith("/lacunae") || pathname.startsWith("/assessments")) return "/lacunae";
    if (pathname.startsWith("/journeys")) return "/dashboard#journeys";
    return "/dashboard";
  }, [pathname]);

  const isActive = (tab: (typeof tabs)[number]) => {
    if (tab.label === "More") return false;
    if (pathname === "/dashboard" && tab.sectionId && activeSection) {
      return tab.sectionId === activeSection;
    }
    return activeHref === tab.href;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e5e5e5] bg-white/95 backdrop-blur-lg shadow-[0_-8px_30px_rgba(44,44,44,0.08)] lg:hidden" aria-label="Mobile navigation">
        <div className="grid grid-cols-4">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                onClick={(e) => handleNavClick(tab, e)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-xs font-semibold transition",
                  active ? "text-[#6b8e4e]" : "text-[#6b6b6b]"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border transition",
                    active
                      ? "border-[#6b8e4e] bg-[#e7f0df]"
                      : "border-[#e5e5e5] bg-white"
                  )}
                  aria-hidden
                >
                  {tab.icon}
                </span>
                <span className={cn(active ? "font-bold" : "font-semibold")}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[18px] border border-[#e5e5e5] bg-white p-5 shadow-soft transition-transform duration-200 ease-out">
            <div className="mx-auto h-1 w-12 rounded-full bg-[#d8d1c6] mb-3" />
            <div className="space-y-3">
              <Link
                href="/ontology"
                className="flex items-center gap-3 rounded-[12px] border border-[#e5e5e5] px-4 py-3 text-sm font-semibold text-[#2c2c2c] hover:border-[#6b8e4e]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M4 12h16M12 4v16" strokeLinecap="round" />
                </svg>
                Ontology
              </Link>
              <Link
                href="/dashboard#profile"
                onClick={(e) => {
                  if (pathname === "/dashboard") {
                    e.preventDefault();
                    setSheetOpen(false);
                    const el = document.querySelector(`[data-section="profile"]`);
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    window.history.pushState(null, "", "/dashboard#profile");
                  }
                }}
                className="flex items-center gap-3 rounded-[12px] border border-[#e5e5e5] px-4 py-3 text-sm font-semibold text-[#2c2c2c] hover:border-[#6b8e4e]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c1.2-3 4-4.5 7-4.5s5.8 1.5 7 4.5" strokeLinecap="round" />
                </svg>
                Profile
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-[12px] border border-[#e5e5e5] px-4 py-3 text-sm font-semibold text-left text-[#a35300] hover:border-[#c47b5c]"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M15 3.5H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h9" strokeLinecap="round" />
                      <path d="M19 12H9m10 0-3-3m3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Logout
                  </span>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
