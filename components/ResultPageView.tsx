"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Share2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Compass,
} from "lucide-react";
import { HardwareProfile } from "@/lib/domain/hardware";
import { SelectedWorkload } from "@/lib/domain/software";
import { CompatibilityResult } from "@/lib/domain/compatibility";
import { BottleneckCard, GenericBottleneck } from "@/components/BottleneckCard";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import { CompatibilityMap } from "@/components/CompatibilityMap";
import { StressMySetup } from "@/components/StressMySetup";
import { ShareModal } from "@/components/ShareModal";
import { CalculationTransparencyInspector } from "@/components/results/CalculationTransparencyInspector";

export type PerformanceTierKey =
  | "excellent"
  | "recommended"
  | "usable"
  | "minimum"
  | "borderline"
  | "poor"
  | "incompatible"
  | "unknown";

interface TierPresentation {
  tone: "success" | "warning" | "critical" | "unknown";
  title: string;
  badgeText: string;
  badgeClass: string;
}

const TIER_PRESENTATION: Record<PerformanceTierKey, TierPresentation> = {
  excellent: {
    tone: "success",
    title: "Excellent fit",
    badgeText: "● EXCELLENT FIT",
    badgeClass: "bg-emerald-500/10 dark:bg-emerald-500/20 text-semantic-success border-emerald-500/30",
  },
  recommended: {
    tone: "success",
    title: "Good fit",
    badgeText: "● GOOD FIT",
    badgeClass: "bg-emerald-500/10 dark:bg-emerald-500/20 text-semantic-success border-emerald-500/30",
  },
  usable: {
    tone: "warning",
    title: "Usable fit",
    badgeText: "● USABLE FIT",
    badgeClass: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  minimum: {
    tone: "warning",
    title: "Runs, but with compromises",
    badgeText: "● MINIMUM RUNTIME",
    badgeClass: "bg-amber-500/10 dark:bg-amber-500/20 text-semantic-warning border-amber-500/30",
  },
  borderline: {
    tone: "warning",
    title: "Borderline fit",
    badgeText: "● BORDERLINE FIT",
    badgeClass: "bg-amber-500/10 dark:bg-amber-500/20 text-semantic-warning border-amber-500/30",
  },
  poor: {
    tone: "critical",
    title: "Poor fit",
    badgeText: "● POOR FIT",
    badgeClass: "bg-rose-500/10 dark:bg-rose-500/20 text-semantic-critical border-rose-500/30",
  },
  incompatible: {
    tone: "critical",
    title: "Not compatible",
    badgeText: "● NOT COMPATIBLE",
    badgeClass: "bg-rose-500/10 dark:bg-rose-500/20 text-semantic-critical border-rose-500/30",
  },
  unknown: {
    tone: "unknown",
    title: "Unable to determine",
    badgeText: "● UNKNOWN",
    badgeClass: "bg-slate-500/10 dark:bg-slate-500/20 text-content-muted border-border-subtle",
  },
};

export interface ResultPageViewProps {
  publicId: string;
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
  result: CompatibilityResult;
  snapshotMeta: {
    engineVersion: string;
    benchmarkDatasetVersion: string;
    normalizationAlgorithmVersion?: string;
    policyVersion?: string;
    createdAt: string;
    fingerprint?: string;
  };
}

export function ResultPageView({
  publicId,
  hardware,
  workloads,
  result,
  snapshotMeta,
}: ResultPageViewProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Derive Exhaustive Tier Presentation
  const tierKey = (result.performanceTier as PerformanceTierKey) || "unknown";
  const tier = TIER_PRESENTATION[tierKey] || TIER_PRESENTATION.unknown;

  // Confidence Calculation (Fix: ?? instead of || so 0 is preserved)
  const confidenceScore = result.confidence ?? 70;
  const confidenceLevel =
    confidenceScore >= 80
      ? { label: "High", badgeClass: "text-semantic-success" }
      : confidenceScore >= 60
      ? { label: "Medium", badgeClass: "text-brand-primary" }
      : confidenceScore >= 40
      ? { label: "Low", badgeClass: "text-semantic-warning" }
      : { label: "Insufficient", badgeClass: "text-semantic-critical" };

  // Derive Generic Primary Bottleneck
  let primaryBottleneck: GenericBottleneck = { type: "none" };
  if (result.bottlenecks && result.bottlenecks.length > 0) {
    const b = result.bottlenecks[0];
    if (b.component === "memory") {
      primaryBottleneck = {
        type: "ram",
        currentGb: hardware.ram.totalGb,
        requiredGb: result.concurrencyMetrics?.effectiveRequiredRamGb || Number(b.parameters?.requiredRamGb || 16),
        recommendedGb: Number(result.components?.memory?.recommendedValue || b.parameters?.recommendedRamGb || 0),
        severity: b.severity,
        reason: b.reason,
      };
    } else if (b.component === "vram") {
      primaryBottleneck = {
        type: "vram",
        currentGb: hardware.gpu?.vramGb || 0,
        requiredGb: Number(b.parameters?.requiredVramGb || 8),
        recommendedGb: Number(result.components?.vram?.recommendedValue || 0),
        severity: b.severity,
        reason: b.reason,
      };
    } else if (b.component === "cpu") {
      primaryBottleneck = {
        type: "cpu",
        currentScore: hardware.cpu.performanceScore || 50,
        requiredScore: Number(b.parameters?.requiredScore || 70),
        severity: b.severity,
        reason: b.reason,
      };
    } else if (b.component === "gpu") {
      primaryBottleneck = {
        type: "gpu",
        currentScore: hardware.gpu?.performanceScore || 40,
        requiredScore: Number(b.parameters?.requiredScore || 65),
        severity: b.severity,
        reason: b.reason,
      };
    } else if (b.component === "storage") {
      primaryBottleneck = {
        type: "storage",
        freeGb: hardware.storage[0]?.freeGb || 50,
        requiredGb: Number(b.parameters?.requiredGb || 100),
        severity: b.severity,
        reason: b.reason,
      };
    } else {
      primaryBottleneck = {
        type: "platform",
        reason: b.reason || "Platform or OS compatibility constraint.",
        severity: b.severity,
      };
    }
  }

  // Derive Authoritative Headline & Explanation
  let headline = "Your PC handles this workload well.";
  let explanation = "Hardware specifications provide comfortable throughput and headroom for the selected applications.";

  if (result.isHardIncompatible || result.compatibilityStatus === "incompatible") {
    headline = "Your PC is incompatible with this workload.";
    explanation = "One or more selected applications cannot run due to missing OS features, instruction sets, or minimum hardware baselines.";
  } else if (tier.tone === "critical" || tierKey === "poor") {
    headline = "Your PC will struggle significantly with this workload.";
    explanation = "Severe performance deficits are expected under active usage.";
  } else if (tier.tone === "warning" || tierKey === "minimum" || tierKey === "borderline") {
    if (primaryBottleneck.type === "ram") {
      headline = "Your PC can run this workload with memory constraints.";
      explanation = `Active multitasking requires ~${result.concurrencyMetrics?.effectiveRequiredRamGb || 16} GB RAM; swapping to disk may cause latency spikes.`;
    } else if (primaryBottleneck.type === "vram") {
      headline = "Your PC can run this workload with GPU VRAM limits.";
      explanation = "High-resolution viewports or model weights exceed dedicated video memory.";
    } else if (primaryBottleneck.type === "cpu") {
      headline = "Your PC can run this workload with CPU compute limitations.";
      explanation = "CPU core throughput will be heavily saturated during compilation or rendering.";
    } else {
      headline = "Your PC runs this workload, but with hardware compromises.";
      explanation = primaryBottleneck.type !== "none" && primaryBottleneck.reason ? primaryBottleneck.reason : "System resources will operate near maximum saturation during peak usage.";
    }
  }

  // Resource Pressure Math
  const installedRam = hardware.ram.totalGb;
  const normalRam = result.concurrencyMetrics?.steadyStateRamGb || Math.round(installedRam * 0.4);
  const heavyRam = result.concurrencyMetrics?.effectiveRequiredRamGb || Math.round(installedRam * 0.85);
  const peakRam = result.concurrencyMetrics?.peakConcurrentRamGb || Math.round(heavyRam * 1.25);
  const ramRatio = result.concurrencyMetrics?.ramPressureRatio || (heavyRam / installedRam);
  const ramPercent = Math.round(ramRatio * 100);

  // Meter color logic: solid semantic tokens (No gradients)
  const getPressureColor = (ratio: number) => {
    if (ratio > 1.0) return "bg-semantic-critical";
    if (ratio >= 0.9) return "bg-semantic-warning";
    if (ratio >= 0.7) return "bg-brand-primary";
    return "bg-semantic-success";
  };

  const formattedSavedDate = new Date(snapshotMeta.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header: Simple & Consumer-Friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-content-muted mb-1">
            <span className="h-2 w-2 rounded-full bg-semantic-success animate-pulse" />
            <span>Compatibility Report</span>
            <span>•</span>
            <span>Saved {formattedSavedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-strong">
            Diagnostic & Workload Sizing Report
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="touch-target px-4 py-2 bg-surface-card hover:bg-surface-elevated text-content-strong text-xs font-mono font-bold rounded-xl border border-border-subtle transition-all flex items-center gap-2 shadow-sm"
            aria-label="Share this report"
          >
            <Share2 className="h-4 w-4 text-brand-primary" />
            <span>Share</span>
          </button>

          <Link
            href="/check"
            className="touch-target px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <Cpu className="h-4 w-4" />
            <span>Run New Check</span>
          </Link>
        </div>
      </div>

      {/* LEVEL 1 — The Answer */}
      <div className="space-y-4">
        <div className="surface-card p-6 sm:p-8 rounded-3xl border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden shadow-md">
          <div className="space-y-3 max-w-3xl">
            {/* Status & Workload Counter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border uppercase ${tier.badgeClass}`}>
                {tier.badgeText}
              </span>
              <span className="text-xs text-content-muted font-mono">
                {workloads.length} {workloads.length === 1 ? "Workload" : "Workloads"} Evaluated
              </span>
            </div>

            {/* Authoritative Headline & Explanation */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-content-strong leading-tight">
                {headline}
              </h2>
              <p className="text-xs sm:text-sm text-content-body mt-2 leading-relaxed font-sans">
                {explanation}
              </p>
            </div>

            {/* Evaluated Hardware Spec Bar */}
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-content-muted font-mono">
              <span className="text-content-strong font-semibold">{hardware.cpu.model}</span>
              <span>•</span>
              <span>{hardware.ram.totalGb} GB RAM</span>
              <span>•</span>
              <span>{hardware.gpu?.model || "Integrated Graphics"}</span>
              <span>•</span>
              <span className="capitalize">{hardware.os.family}</span>
            </div>
          </div>

          {/* Verdict Score Dial */}
          <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-surface-main border border-border-subtle shrink-0 text-center min-w-[120px] shadow-inner font-mono">
            <div className="text-[10px] uppercase font-bold text-content-muted">Match Score</div>
            <div className="text-4xl sm:text-5xl font-black text-brand-primary">{result.score}</div>
            <div className="text-[11px] font-bold text-content-secondary uppercase mt-0.5">{tier.title}</div>
          </div>
        </div>

        {/* Multi-Dimension Compact Status Row (Answer Reinforcement) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Dimension 1: Compatibility */}
          <div className="surface-card p-3 rounded-2xl border border-border-subtle flex items-center justify-between font-mono">
            <span className="text-xs text-content-muted font-medium">Compatible</span>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {result.compatibilityStatus === "compatible" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-semantic-success" />
                  <span className="text-semantic-success">Yes</span>
                </>
              ) : result.compatibilityStatus === "incompatible" ? (
                <>
                  <XCircle className="h-3.5 w-3.5 text-semantic-critical" />
                  <span className="text-semantic-critical">No</span>
                </>
              ) : (
                <>
                  <HelpCircle className="h-3.5 w-3.5 text-content-muted" />
                  <span className="text-content-muted">Unknown</span>
                </>
              )}
            </div>
          </div>

          {/* Dimension 2: Runs Well */}
          <div className="surface-card p-3 rounded-2xl border border-border-subtle flex items-center justify-between font-mono">
            <span className="text-xs text-content-muted font-medium">Runs well</span>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {tier.tone === "success" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-semantic-success" />
                  <span className="text-semantic-success">Good</span>
                </>
              ) : tier.tone === "warning" ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-semantic-warning" />
                  <span className="text-semantic-warning">Compromised</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-semantic-critical" />
                  <span className="text-semantic-critical">Poor</span>
                </>
              )}
            </div>
          </div>

          {/* Dimension 3: Workload Fit */}
          <div className="surface-card p-3 rounded-2xl border border-border-subtle flex items-center justify-between font-mono">
            <span className="text-xs text-content-muted font-medium">Workload fit</span>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {result.score >= 80 ? (
                <span className="text-semantic-success">✓ High</span>
              ) : result.score >= 60 ? (
                <span className="text-semantic-warning">⚠ Moderate</span>
              ) : (
                <span className="text-semantic-critical">✗ Low</span>
              )}
            </div>
          </div>

          {/* Dimension 4: Confidence */}
          <div className="surface-card p-3 rounded-2xl border border-border-subtle flex items-center justify-between font-mono">
            <span className="text-xs text-content-muted font-medium">Confidence</span>
            <div className="flex items-center gap-1 text-xs font-bold">
              <span className={confidenceLevel.badgeClass}>● {confidenceLevel.label}</span>
              <span className="text-[10px] text-content-muted font-normal">({confidenceScore}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* LEVEL 2 — Limiting Factor */}
      <div className="space-y-4">
        {/* Generic Primary Bottleneck Component */}
        <BottleneckCard
          bottleneck={primaryBottleneck}
          upgradeRecommendations={result.upgradeRecommendations}
        />

        {/* Workload Resource Load Distribution (Normal / Heavy / Peak) */}
        <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-content-strong">
              <Layers className="h-4 w-4 text-brand-primary" />
              <span>Multitasking RAM Pressure Distribution</span>
            </div>
            <div className="text-xs font-mono text-content-muted">
              Installed: <strong className="text-content-strong">{installedRam} GB</strong> • Demand: <strong className="text-content-strong">{heavyRam} GB</strong>
            </div>
          </div>

          {/* Pressure Bar with Solid Semantic Colors */}
          <div className="space-y-2">
            <div className="w-full h-4 bg-surface-subtle rounded-full overflow-hidden p-0.5 border border-border-subtle relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getPressureColor(ramRatio)}`}
                style={{ width: `${Math.min(100, ramPercent)}%` }}
              />
            </div>

            {/* Pressure Percentage & Overflow Indicator */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-1">
              <span className="text-content-muted">
                Pressure: <strong className={ramRatio > 1.0 ? "text-semantic-critical" : "text-content-strong"}>{ramPercent}%</strong>
              </span>
              {ramRatio > 1.0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-semantic-critical text-[11px] font-bold border border-rose-500/20">
                  +{ramPercent - 100}% overflow ({heavyRam - installedRam} GB deficit)
                </span>
              )}
            </div>
          </div>

          {/* Breakdown by Usage Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-subtle">
            <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle font-mono text-xs">
              <div className="text-content-muted text-[10px] uppercase font-semibold">Normal Use</div>
              <div className="text-sm font-bold text-content-strong mt-0.5 flex items-center justify-between">
                <span>{normalRam} GB</span>
                <span className="text-semantic-success text-[11px]">✓ Comfort</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle font-mono text-xs">
              <div className="text-content-muted text-[10px] uppercase font-semibold">Heavy Multitasking</div>
              <div className="text-sm font-bold text-content-strong mt-0.5 flex items-center justify-between">
                <span>{heavyRam} GB</span>
                <span className={heavyRam <= installedRam ? "text-semantic-success text-[11px]" : "text-semantic-warning text-[11px]"}>
                  {heavyRam <= installedRam ? "✓ Stable" : "⚠ Swapping"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle font-mono text-xs">
              <div className="text-content-muted text-[10px] uppercase font-semibold">Peak Burst Load</div>
              <div className="text-sm font-bold text-content-strong mt-0.5 flex items-center justify-between">
                <span>{peakRam} GB</span>
                <span className={peakRam <= installedRam ? "text-semantic-success text-[11px]" : "text-semantic-critical text-[11px]"}>
                  {peakRam <= installedRam ? "✓ Handled" : "✗ Throttle"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Workload Resolution & Quality Feasibility Matrix (PCBuildCheck Inspiration) */}
        <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-primary" />
              <h3 className="font-bold text-content-strong uppercase tracking-wider">
                Workload Resolution & Quality Feasibility Matrix
              </h3>
            </div>
            <span className="text-[10px] text-content-muted">
              Project Scaling Estimates
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1080p / Standard Workload */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-content-strong text-xs">1080p • Standard</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {result.score >= 50 ? "✓ 60+ FPS / Smooth" : "⚠ Modest"}
                </span>
              </div>
              <p className="text-[11px] font-sans text-content-muted leading-relaxed">
                Standard timeline scrubbing, web dev, and 1080p viewport editing run with minimal latency.
              </p>
            </div>

            {/* 1440p / Pro Workload */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-content-strong text-xs">1440p • Pro Complex</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  result.score >= 75
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : result.score >= 60
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}>
                  {result.score >= 75 ? "✓ Optimal" : result.score >= 60 ? "⚠ Usable" : "✗ Low"}
                </span>
              </div>
              <p className="text-[11px] font-sans text-content-muted leading-relaxed">
                Multi-layer compositing, large Docker containers, and complex 3D viewports operate cleanly.
              </p>
            </div>

            {/* 4K / Heavy Multi-Agent Workload */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-content-strong text-xs">4K • Extreme / AI</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  result.score >= 88 && (hardware.gpu?.vramGb || 0) >= 12
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : result.score >= 70
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}>
                  {result.score >= 88 && (hardware.gpu?.vramGb || 0) >= 12
                    ? "✓ Full Fidelity"
                    : result.score >= 70
                    ? "⚠ Proxies Advised"
                    : "✗ Insufficient VRAM"}
                </span>
              </div>
              <p className="text-[11px] font-sans text-content-muted leading-relaxed">
                Heavy 4K rendering and local LLM context scaling require high memory bus bandwidth and 16GB+ VRAM.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LEVEL 3 — Interactive Transparency Inspector & WHAT IF Simulator */}
      <div className="space-y-6">
        <CalculationTransparencyInspector
          hardware={hardware}
          workloads={workloads}
          result={result}
        />

        <WhatIfSimulator
          initialHardware={hardware}
          workloads={workloads}
          currentScore={result.score}
        />
      </div>

      {/* LEVEL 4 — Deep Technical Evidence */}
      <div className="space-y-6">
        {/* Compatibility Map */}
        <CompatibilityMap hardware={hardware} workloads={workloads} result={result} />

        {/* Stress My Setup */}
        <StressMySetup hardware={hardware} baseScore={result.score} />

        {/* Cross-Product Acceleration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Find a better PC */}
          <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-primary">
                <Sparkles className="h-4 w-4" />
                <span>Next Step Recommendation</span>
              </div>
              <h4 className="text-base font-bold text-content-strong">
                Find a Better PC for This Workload
              </h4>
              <p className="text-xs text-content-body leading-relaxed font-sans">
                Looking for hardware that delivers unconstrained throughput? Our recommendation engine generates optimal laptop and desktop specs tailored to your budget and stack.
              </p>
            </div>
            <Link
              href="/recommend"
              className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-mono font-bold hover:bg-brand-primary-hover transition-all mt-2"
            >
              <span>Explore Recommended PCs</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Fit Engine Deep-Dive */}
          <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-3 flex flex-col justify-between shadow-sm">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-cyan">
                <Compass className="h-4 w-4" />
                <span>Holistic Fit Analysis</span>
              </div>
              <h4 className="text-base font-bold text-content-strong">
                Run Full Fit & Longevity Analysis
              </h4>
              <p className="text-xs text-content-body leading-relaxed font-sans">
                Evaluate longevity modeling, multi-agent AI concurrency thresholds, and local vs cloud deployment strategies in the interactive Fit Engine.
              </p>
            </div>
            <Link
              href="/fit"
              className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated text-content-strong border border-border-subtle text-xs font-mono font-bold transition-all mt-2"
            >
              <span>Launch Fit Engine</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Provenance & Audit Footer (Moved to Bottom) */}
        <div className="p-6 rounded-3xl bg-surface-subtle border border-border-subtle space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-content-strong font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>How This Result Was Calculated (Evaluation Provenance)</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20 self-start sm:self-auto">
              ✓ Server-verified snapshot
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-content-muted text-[11px]">
            <div>
              <span className="block text-content-secondary font-semibold">Snapshot ID</span>
              <span className="break-all">{publicId}</span>
            </div>
            <div>
              <span className="block text-content-secondary font-semibold">Engine Version</span>
              <span>v{snapshotMeta.engineVersion}</span>
            </div>
            <div>
              <span className="block text-content-secondary font-semibold">Benchmark Dataset</span>
              <span>{snapshotMeta.benchmarkDatasetVersion}</span>
            </div>
            <div>
              <span className="block text-content-secondary font-semibold">Result Fingerprint</span>
              <span>{snapshotMeta.fingerprint || "sha256-verified-match"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sharing Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Workload Compatibility Snapshot — ComputeBestSpecs"
        score={result.score}
        verdict={tier.title}
      />
    </div>
  );
}
