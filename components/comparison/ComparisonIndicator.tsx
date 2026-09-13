"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, ChevronRight } from "lucide-react";
import { getComparisonSet, subscribeToComparisonSet, MAX_COMPARISON_ITEMS } from "@/lib/comparison/storage";
import { ComparisonSet } from "@/lib/comparison/types";

export function ComparisonIndicator({ className }: { className?: string }) {
  const [comparisonSet, setComparisonSet] = useState<ComparisonSet | null>(null);

  useEffect(() => {
    setComparisonSet(getComparisonSet());
    const unsubscribe = subscribeToComparisonSet((set) => {
      setComparisonSet(set);
    });
    return () => unsubscribe();
  }, []);

  if (!comparisonSet || comparisonSet.items.length === 0) {
    return null;
  }

  const count = comparisonSet.items.length;

  return (
    <Link
      href="/compare"
      id="cbs-comparison-dock-indicator"
      className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-cyan-500/40 shadow-xl shadow-cyan-950/40 backdrop-blur-md transition-all group hover:scale-[1.02] ${className ?? ""}`}
    >
      <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400">
        <Scale className="w-4 h-4" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950">
          {count}
        </span>
      </div>

      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold text-slate-200">
          Compare computers
        </span>
        <span className="text-[11px] text-cyan-400 font-mono">
          {count}/{MAX_COMPARISON_ITEMS} saved
        </span>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors ml-1" />
    </Link>
  );
}
