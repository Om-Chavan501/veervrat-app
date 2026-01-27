"use client";

import { useEffect } from "react";

interface SectionObserverProps {
  sectionIds: string[];
}

export function SectionObserver({ sectionIds }: SectionObserverProps) {
  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.querySelector(`[data-section="${id}"]`))
      .filter(Boolean) as Element[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.5) {
            const id = entry.target.getAttribute("data-section");
            if (!id) return;
            window.dispatchEvent(
              new CustomEvent("veervrat-section-change", {
                detail: { sectionId: id },
              })
            );
          }
        });
      },
      { threshold: [0.5] }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [sectionIds]);

  return null;
}
