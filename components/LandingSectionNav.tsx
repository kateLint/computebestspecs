"use client";

import React, { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface SectionMeta {
  id: string;
  title: string;
  shortLabel: string;
}

const SECTIONS: SectionMeta[] = [
  { id: "section-hero", title: "Overview", shortLabel: "Hero" },
  { id: "section-paths", title: "3-Path Routing", shortLabel: "Paths" },
  { id: "section-demo", title: "Interactive Demo", shortLabel: "Proof" },
  { id: "section-framework", title: "Decision Framework", shortLabel: "Framework" },
  { id: "section-presets", title: "Workload Presets", shortLabel: "Presets" },
  { id: "section-trust", title: "Evidence & Standards", shortLabel: "Trust" },
  { id: "section-cta", title: "Get Started", shortLabel: "Start" },
];

export function LandingSectionNav() {
  const [activeSection, setActiveSection] = useState<string>("section-hero");
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const section = document.getElementById(SECTIONS[i].id);
        if (section) {
          const top = section.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(SECTIONS[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);

  const scrollPrev = () => {
    if (currentIndex > 0) {
      scrollToSection(SECTIONS[currentIndex - 1].id);
    }
  };

  const scrollNext = () => {
    if (currentIndex < SECTIONS.length - 1) {
      scrollToSection(SECTIONS[currentIndex + 1].id);
    }
  };

  return (
    <aside
      aria-label="Section Navigation"
      className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-2 pointer-events-none"
    >
      <div className="bg-surface-card/90 dark:bg-surface-card/90 backdrop-blur-md border border-border-subtle shadow-lg rounded-2xl p-2 flex flex-col items-center gap-1.5 pointer-events-auto">
        {/* Previous Section Button */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={currentIndex === 0}
          aria-label="Scroll to previous section"
          className="p-1 rounded-lg text-content-muted hover:text-content-strong hover:bg-surface-elevated disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        {/* Section Dots */}
        <div className="flex flex-col items-center gap-2 py-1">
          {SECTIONS.map((section, index) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                aria-label={`Jump to ${section.title}`}
                className="group relative flex items-center justify-center p-1"
              >
                {/* Floating Tooltip Label */}
                <span className="absolute right-7 px-2.5 py-1 rounded-lg bg-tooltip-bg text-tooltip-text text-[11px] font-bold font-sans tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-md translate-x-1 group-hover:translate-x-0">
                  <span className="text-brand-primary mr-1">0{index + 1}</span> {section.title}
                </span>

                {/* Dot Indicator */}
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-2.5 h-6 bg-brand-primary ring-2 ring-brand-primary/30"
                      : "w-2.5 h-2.5 bg-border-strong group-hover:bg-content-muted group-hover:scale-125"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Next Section Button */}
        <button
          type="button"
          onClick={scrollNext}
          disabled={currentIndex === SECTIONS.length - 1}
          aria-label="Scroll to next section"
          className="p-1 rounded-lg text-content-muted hover:text-content-strong hover:bg-surface-elevated disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Current Section Number Badge */}
      <div className="bg-surface-card/85 backdrop-blur-sm border border-border-subtle px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-content-muted pointer-events-auto shadow-xs">
        <span className="text-brand-primary">0{currentIndex + 1}</span> / 0{SECTIONS.length}
      </div>
    </aside>
  );
}
