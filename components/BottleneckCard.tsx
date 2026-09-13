"use client";

import React, { useState } from "react";
import { Bottleneck, UpgradeRecommendation } from "@/lib/domain/compatibility";
import {
  AlertOctagon,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Cpu,
  Layers,
  HardDrive,
  MonitorPlay,
  ShieldAlert,
  Server,
} from "lucide-react";
import { usePreferencesStore, DisplayPreferencesState } from "@/lib/stores/preferences-store";

export type GenericBottleneck =
  | {
      type: "ram";
      currentGb: number;
      requiredGb: number;
      recommendedGb?: number;
      severity?: "low" | "medium" | "high" | "critical";
      reason?: string;
    }
  | {
      type: "vram";
      currentGb: number;
      requiredGb: number;
      recommendedGb?: number;
      severity?: "low" | "medium" | "high" | "critical";
      reason?: string;
    }
  | {
      type: "cpu";
      currentScore: number;
      requiredScore: number;
      recommendedScore?: number;
      severity?: "low" | "medium" | "high" | "critical";
      reason?: string;
    }
  | {
      type: "gpu";
      currentScore: number;
      requiredScore: number;
      recommendedScore?: number;
      severity?: "low" | "medium" | "high" | "critical";
      reason?: string;
    }
  | {
      type: "storage";
      freeGb: number;
      requiredGb: number;
      severity?: "low" | "medium" | "high" | "critical";
      reason?: string;
    }
  | {
      type: "platform";
      reason: string;
      severity?: "low" | "medium" | "high" | "critical";
    }
  | {
      type: "none";
    };

export interface BottleneckCardProps {
  bottleneck?: GenericBottleneck;
  bottlenecks?: Bottleneck[];
  upgradeRecommendations?: UpgradeRecommendation[];
  onSimulateUpgrade?: (rec: UpgradeRecommendation) => void;
  isSimulating?: boolean;
}

export function BottleneckCard({
  bottleneck,
  bottlenecks,
  upgradeRecommendations = [],
  onSimulateUpgrade,
  isSimulating,
}: BottleneckCardProps) {
  const [showTechnicalWhy, setShowTechnicalWhy] = useState(false);
  const detailLevel = usePreferencesStore((state: DisplayPreferencesState) => state.detailLevel);

  // Normalize input into unified structure
  let resolvedBottleneck: GenericBottleneck;

  if (bottleneck) {
    resolvedBottleneck = bottleneck;
  } else if (bottlenecks && bottlenecks.length > 0) {
    const b = bottlenecks[0];
    const comp = b.component;
    if (comp === "memory") {
      resolvedBottleneck = {
        type: "ram",
        currentGb: Number(b.parameters?.installedRamGb ?? b.parameters?.installedGb ?? 0),
        requiredGb: Number(b.parameters?.requiredRamGb ?? b.parameters?.peakGb ?? b.parameters?.typicalGb ?? 0),
        recommendedGb: Number(b.parameters?.recommendedRamGb ?? (Number(b.parameters?.installedGb ?? 16) >= 16 ? 32 : 16)),
        severity: b.severity,
        reason: b.reason,
      };
    } else if (comp === "vram") {
      resolvedBottleneck = {
        type: "vram",
        currentGb: Number(b.parameters?.installedVramGb ?? b.parameters?.availableVram ?? 0),
        requiredGb: Number(b.parameters?.requiredVramGb ?? b.parameters?.requiredVram ?? 0),
        recommendedGb: Number(b.parameters?.recommendedVramGb ?? 0),
        severity: b.severity,
        reason: b.reason,
      };
    } else if (comp === "cpu") {
      resolvedBottleneck = {
        type: "cpu",
        currentScore: Number(b.parameters?.currentScore ?? b.parameters?.cpuScore ?? 0),
        requiredScore: Number(b.parameters?.requiredScore ?? 0),
        severity: b.severity,
        reason: b.reason,
      };
    } else if (comp === "gpu") {
      resolvedBottleneck = {
        type: "gpu",
        currentScore: Number(b.parameters?.currentScore ?? b.parameters?.gpuScore ?? 0),
        requiredScore: Number(b.parameters?.requiredScore ?? 0),
        severity: b.severity,
        reason: b.reason,
      };
    } else if (comp === "storage") {
      resolvedBottleneck = {
        type: "storage",
        freeGb: Number(b.parameters?.freeGb ?? 0),
        requiredGb: Number(b.parameters?.requiredGb ?? 0),
        severity: b.severity,
        reason: b.reason,
      };
    } else {
      resolvedBottleneck = {
        type: "platform",
        reason: b.reason || "Platform or configuration constraints detected.",
        severity: b.severity,
      };
    }
  } else {
    resolvedBottleneck = { type: "none" };
  }

  // Balanced state
  if (resolvedBottleneck.type === "none") {
    return (
      <div className="surface-card p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>No Severe Bottlenecks Detected</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Harmonious Fit
          </span>
        </div>
        <h3 className="text-base font-bold text-content-strong">
          Balanced System Hardware Architecture
        </h3>
        <p className="text-xs text-content-body leading-relaxed font-sans">
          Your CPU, GPU, RAM, and Storage capabilities align harmoniously with the active workload profile. No single component is prematurely capping overall throughput.
        </p>
      </div>
    );
  }

  // Find matching recommendation
  const primaryRec = upgradeRecommendations.find((r) => {
    if (resolvedBottleneck.type === "ram") return r.component === "memory";
    if (resolvedBottleneck.type === "vram") return r.component === "vram";
    if (resolvedBottleneck.type === "cpu") return r.component === "cpu";
    if (resolvedBottleneck.type === "gpu") return r.component === "gpu";
    if (resolvedBottleneck.type === "storage") return r.component === "storage";
    return false;
  }) || upgradeRecommendations[0];

  const severity = resolvedBottleneck.severity || "medium";
  const severityBadge = {
    critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    high: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    low: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
  }[severity];

  const getBottleneckIcon = () => {
    switch (resolvedBottleneck.type) {
      case "ram":
        return <Layers className="h-4 w-4 text-amber-500" />;
      case "vram":
        return <Server className="h-4 w-4 text-rose-500" />;
      case "cpu":
        return <Cpu className="h-4 w-4 text-amber-500" />;
      case "gpu":
        return <MonitorPlay className="h-4 w-4 text-indigo-500" />;
      case "storage":
        return <HardDrive className="h-4 w-4 text-blue-500" />;
      case "platform":
        return <ShieldAlert className="h-4 w-4 text-rose-500" />;
      default:
        return <AlertOctagon className="h-4 w-4 text-amber-500" />;
    }
  };

  const getBottleneckTitle = () => {
    switch (resolvedBottleneck.type) {
      case "ram":
        return "RAM Capacity & Multitasking Constraint";
      case "vram":
        return "GPU Dedicated VRAM Capacity Limit";
      case "cpu":
        return "CPU Compute Throughput Bottleneck";
      case "gpu":
        return "GPU Graphics / Shader Performance Limit";
      case "storage":
        return "Storage Drive Free Space / Throughput Constraint";
      case "platform":
        return "Platform / Virtualization Architecture Incompatibility";
      default:
        return "Hardware Throughput Constraint";
    }
  };

  const renderMetricsSnippet = () => {
    switch (resolvedBottleneck.type) {
      case "ram":
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-content-muted">
              <span>Installed RAM: <strong className="text-content-strong">{resolvedBottleneck.currentGb} GB</strong></span>
              <span>•</span>
              <span>Est. Demand: <strong className="text-amber-600 dark:text-amber-400">~{resolvedBottleneck.requiredGb} GB</strong></span>
              {resolvedBottleneck.requiredGb > resolvedBottleneck.currentGb && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Deficit: ~{(resolvedBottleneck.requiredGb - resolvedBottleneck.currentGb).toFixed(1)} GB (Swapping to Disk)
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-content-body font-sans leading-relaxed">
              When multitasking demand exceeds physical RAM, your operating system swaps active memory to storage, causing UI stutter and slowdowns.
            </p>
          </div>
        );
      case "vram":
        return (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-content-muted">
            <span>Installed VRAM: <strong className="text-content-strong">{resolvedBottleneck.currentGb} GB</strong></span>
            <span>•</span>
            <span>Model/Asset Demand: <strong className="text-rose-600 dark:text-rose-400">{resolvedBottleneck.requiredGb} GB</strong></span>
          </div>
        );
      case "cpu":
        return (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-content-muted">
            <span>Current Score: <strong className="text-content-strong">{resolvedBottleneck.currentScore} pts</strong></span>
            <span>•</span>
            <span>Required Baseline: <strong className="text-amber-600 dark:text-amber-400">{resolvedBottleneck.requiredScore} pts</strong></span>
          </div>
        );
      case "gpu":
        return (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-content-muted">
            <span>Current GPU Score: <strong className="text-content-strong">{resolvedBottleneck.currentScore} pts</strong></span>
            <span>•</span>
            <span>Workload Target: <strong className="text-indigo-600 dark:text-indigo-400">{resolvedBottleneck.requiredScore} pts</strong></span>
          </div>
        );
      case "storage":
        return (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-content-muted">
            <span>Free Space: <strong className="text-content-strong">{resolvedBottleneck.freeGb} GB</strong></span>
            <span>•</span>
            <span>Required Space: <strong className="text-rose-600 dark:text-rose-400">{resolvedBottleneck.requiredGb} GB</strong></span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="surface-card p-6 rounded-3xl border-2 border-amber-500/40 dark:border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/5 space-y-4 shadow-sm relative overflow-hidden">
      {/* Header with Severity Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
          {getBottleneckIcon()}
          <span>Primary Limiting Factor</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border self-start sm:self-auto ${severityBadge}`}>
          ! {severity} Severity
        </span>
      </div>

      {/* Main Diagnostic Title & Summary */}
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-content-strong flex items-center gap-2">
          {getBottleneckTitle()}
        </h3>
        {renderMetricsSnippet()}
        <p className="text-xs sm:text-sm text-content-body mt-1 leading-relaxed font-sans">
          {resolvedBottleneck.reason || `Hardware capability is constrained under active simultaneous multitasking loads.`}
        </p>
      </div>

      {/* Direct Action Upgrade CTA (Zero Friction) */}
      {primaryRec && (
        <div className="p-4 rounded-2xl bg-surface-main border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-content-muted font-semibold flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500" />
              Engine Recommended Resolution
            </div>
            <div className="text-sm font-bold text-content-strong flex items-center gap-2 font-mono flex-wrap">
              <span className="text-content-muted">{primaryRec.from}</span>
              <span className="text-amber-500">→</span>
              <span className="text-brand-primary font-black">{primaryRec.to}</span>
              {primaryRec.simulationDelta && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  +{primaryRec.simulationDelta.deltaScore} pts
                </span>
              )}
            </div>
          </div>

          {onSimulateUpgrade && (
            <button
              onClick={() => onSimulateUpgrade(primaryRec)}
              disabled={isSimulating}
              className="touch-target px-4 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-mono font-bold hover:bg-brand-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              aria-label={`Simulate upgrading to ${primaryRec.to}`}
            >
              <span>Simulate {primaryRec.to}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Progressive Disclosure: "Why?" Detailed Technical Explanation */}
      <div className="pt-1 border-t border-border-subtle">
        <button
          onClick={() => setShowTechnicalWhy(!showTechnicalWhy)}
          className="text-xs font-mono font-semibold text-brand-primary hover:underline flex items-center gap-1 py-1"
          aria-expanded={showTechnicalWhy}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{showTechnicalWhy ? "Hide" : "Why is this limiting performance?"}</span>
          <ChevronRight className={`h-3 w-3 transition-transform ${showTechnicalWhy ? "rotate-90" : ""}`} />
        </button>

        {(showTechnicalWhy || detailLevel === "technical") && (
          <div className="mt-2 p-3 rounded-xl bg-surface-subtle border border-border-subtle text-xs font-mono space-y-1.5 text-content-secondary animate-in fade-in duration-200">
            <div className="flex justify-between">
              <span>Limiting Component Type:</span>
              <strong className="text-content-strong uppercase">{resolvedBottleneck.type}</strong>
            </div>
            {primaryRec?.reasonText && (
              <p className="text-[11px] pt-1 text-content-muted border-t border-border-subtle leading-normal font-sans">
                {primaryRec.reasonText}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
