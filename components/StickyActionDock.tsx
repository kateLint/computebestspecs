"use client";

import { SlidersHorizontal, Share2, BookmarkPlus, ArrowRight, Sparkles } from "lucide-react";

interface StickyActionDockProps {
  mode?: "evaluate" | "simulate";
  onPrimaryClick?: () => void;
  onShareClick?: () => void;
  onSaveClick?: () => void;
  isLoading?: boolean;
}

export function StickyActionDock({
  mode = "evaluate",
  onPrimaryClick,
  onShareClick,
  onSaveClick,
  isLoading,
}: StickyActionDockProps) {
  return (
    <div 
      className="md:hidden sticky-action-dock bg-surface-card/95 border-t border-border-subtle px-4 py-2.5 shadow-xl flex items-center justify-between gap-2"
      role="toolbar"
      aria-label="Mobile primary action bar"
    >
      <button
        onClick={onPrimaryClick}
        disabled={isLoading}
        className="touch-target flex-1 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-mono font-bold hover:bg-brand-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
      >
        {mode === "evaluate" ? (
          <>
            <Sparkles className="h-4 w-4" />
            <span>{isLoading ? "Analyzing System..." : "Run Diagnostic Evaluation →"}</span>
          </>
        ) : (
          <>
            <SlidersHorizontal className="h-4 w-4" />
            <span>{isLoading ? "Recalculating..." : "Simulate Best Upgrade ⚡"}</span>
          </>
        )}
      </button>

      {mode === "simulate" && onShareClick && (
        <button
          onClick={onShareClick}
          className="touch-target px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle text-content-strong text-xs font-mono font-semibold hover:bg-surface-elevated active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          aria-label="Share evaluation report"
        >
          <Share2 className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Share</span>
        </button>
      )}

      {onSaveClick && (
        <button
          onClick={onSaveClick}
          className="touch-target px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle text-content-strong text-xs font-mono font-semibold hover:bg-surface-elevated active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          aria-label="Save this PC configuration"
        >
          <BookmarkPlus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Save</span>
        </button>
      )}
    </div>
  );
}
