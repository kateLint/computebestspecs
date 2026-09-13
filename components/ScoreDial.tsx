"use client";

import { HardCompatibilityStatus, PerformanceTier } from "@/lib/domain/compatibility";
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { AnimatedNumber } from "./motion/AnimatedNumber";

interface ScoreDialProps {
  score: number;
  compatibilityStatus: HardCompatibilityStatus;
  performanceTier: PerformanceTier;
  confidence: number;
  isHardIncompatible?: boolean;
}

export function ScoreDial({
  score,
  compatibilityStatus,
  performanceTier,
  confidence,
  isHardIncompatible,
}: ScoreDialProps) {
  const normalizedScore = isHardIncompatible ? 0 : Math.max(0, Math.min(100, score));

  // Determine status meta with explicit icons and text for WCAG 2.2 AA accessibility
  let statusBadge = {
    label: "Recommended Tier",
    symbol: "✓",
    icon: CheckCircle2,
    bgClass: "bg-blue-500/10 border-blue-500/30 text-brand-primary",
    strokeClass: "var(--status-recommended)",
  };

  if (isHardIncompatible || compatibilityStatus === "incompatible") {
    statusBadge = {
      label: "Hard Incompatible",
      symbol: "✕",
      icon: XCircle,
      bgClass: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
      strokeClass: "var(--status-incompatible)",
    };
  } else if (performanceTier === "poor" || performanceTier === "minimum") {
    statusBadge = {
      label: "Minimum / Borderline",
      symbol: "!",
      icon: AlertTriangle,
      bgClass: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
      strokeClass: "var(--status-borderline)",
    };
  } else if (performanceTier === "excellent") {
    statusBadge = {
      label: "Excellent Tier",
      symbol: "★",
      icon: Sparkles,
      bgClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
      strokeClass: "var(--status-excellent)",
    };
  } else if (performanceTier === "usable") {
    statusBadge = {
      label: "Usable Tier",
      symbol: "✓",
      icon: CheckCircle2,
      bgClass: "bg-blue-500/10 border-blue-500/30 text-brand-primary",
      strokeClass: "var(--status-recommended)",
    };
  }

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;
  const Icon = statusBadge.icon;

  return (
    <div 
      className="flex flex-col items-center justify-center p-6 surface-card rounded-3xl border border-border-subtle shadow-md relative overflow-hidden"
      role="region"
      aria-label="Hardware Compatibility Score"
    >
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Compatibility score: {normalizedScore} out of 100. Status: {statusBadge.label}. Confidence: {confidence}%.
      </div>

      <div className="relative flex items-center justify-center">
        <svg className="w-36 h-36 sm:w-40 sm:h-40 transform -rotate-90" aria-hidden="true">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="var(--border-subtle)"
            strokeWidth="9"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={statusBadge.strokeClass}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center font-mono">
          <span className="text-3xl sm:text-4xl font-black text-content-strong tracking-tight font-mono">
            <AnimatedNumber value={normalizedScore} durationMs={280} />
          </span>
          <span className="text-[10px] font-mono font-bold text-content-muted uppercase tracking-wider">
            out of 100
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${statusBadge.bgClass}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{statusBadge.symbol} {statusBadge.label}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-content-muted font-mono">
          <span>Confidence: <strong className="text-content-strong">{confidence}%</strong></span>
          <span>•</span>
          <span className="text-content-strong capitalize font-semibold">{compatibilityStatus}</span>
        </div>
      </div>
    </div>
  );
}
