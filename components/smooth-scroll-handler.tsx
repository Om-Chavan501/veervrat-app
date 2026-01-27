"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function SmoothScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    }
  }, [pathname]);

  return null;
}
