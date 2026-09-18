"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  scrollStep?: number;
  showFadeGradients?: boolean;
  buttonSize?: "sm" | "md";
}

export function HorizontalScrollContainer({
  children,
  className = "",
  scrollStep = 240,
  showFadeGradients = true,
  buttonSize = "md",
}: HorizontalScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollability();

    const handleScroll = () => {
      checkScrollability();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", checkScrollability, { passive: true });

    const observer = new MutationObserver(checkScrollability);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollability);
      observer.disconnect();
    };
  }, [checkScrollability]);

  const scrollBy = (offset: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  const buttonClasses =
    buttonSize === "sm"
      ? "h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-surface-card/95 hover:bg-surface-elevated text-content-strong border border-border-strong shadow-sm flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
      : "h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-surface-card/95 hover:bg-surface-elevated text-content-strong border border-border-strong shadow-md flex items-center justify-center transition-all transform hover:scale-105 active:scale-95";

  const iconClasses = buttonSize === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className={`relative flex items-center group/hscroll w-full min-w-0 ${className}`}>
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-scrollStep)}
          aria-label="Scroll left"
          className={`absolute left-0 z-20 ${buttonClasses} -translate-x-1`}
        >
          <ChevronLeft className={iconClasses} />
        </button>
      )}

      {/* Left Gradient Scrim */}
      {showFadeGradients && canScrollLeft && (
        <div className={`absolute left-0 top-0 bottom-0 ${buttonSize === "sm" ? "w-6" : "w-8"} bg-gradient-to-r from-surface-card to-transparent pointer-events-none z-10`} />
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 w-full scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* Right Gradient Scrim */}
      {showFadeGradients && canScrollRight && (
        <div className={`absolute right-0 top-0 bottom-0 ${buttonSize === "sm" ? "w-6" : "w-8"} bg-gradient-to-l from-surface-card to-transparent pointer-events-none z-10`} />
      )}

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(scrollStep)}
          aria-label="Scroll right"
          className={`absolute right-0 z-20 ${buttonClasses} translate-x-1`}
        >
          <ChevronRight className={iconClasses} />
        </button>
      )}
    </div>
  );
}
