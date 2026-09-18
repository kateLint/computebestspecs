"use client";

import React from "react";
import {
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { HardwareProfile } from "@/lib/domain/hardware";
import { SelectedWorkload } from "@/lib/domain/software";
import { CompatibilityResult } from "@/lib/domain/compatibility";

export interface CheckProgressStepperProps {
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
  result: CompatibilityResult | null;
  loading: boolean;
  isStale: boolean;
  onStepClick: (step: 1 | 2 | 3) => void;
  onRunEvaluate?: () => void;
}

export function CheckProgressStepper({
  hardware,
  workloads,
  result,
  loading,
  isStale,
  onStepClick,
  onRunEvaluate,
}: CheckProgressStepperProps) {
  // Determine current active phase:
  // Phase 1: Hardware configuration (if no hardware or user actively on step 1)
  // Phase 2: Workload stack selection (hardware configured, picking/ready apps)
  // Phase 3: Results & Verdict ready
  const hasHardware = Boolean(hardware.cpu?.model);
  const hasWorkloads = workloads.length > 0;
  const hasResults = Boolean(result);

  let currentPhase: 1 | 2 | 3 = 1;
  if (loading || (hasResults && !isStale)) {
    currentPhase = 3;
  } else if (hasWorkloads) {
    currentPhase = 2;
  } else {
    currentPhase = 1;
  }

  // Progress percentage for connector line
  const progressPercent = loading
    ? 85
    : hasResults && !isStale
    ? 100
    : hasWorkloads
    ? 66
    : 33;

  const cpuSummary = hardware.cpu?.model
    ? hardware.cpu.model.replace(/^(Apple|Intel Core|AMD Ryzen)\s+/i, "")
    : "My PC";
  const ramSummary = `${hardware.ram?.totalGb || 16}GB`;

  return (
    <section
      aria-label="Evaluation Workflow Progression"
      className="surface-card p-4 sm:p-5 rounded-3xl border border-border-subtle shadow-xs space-y-4 font-sans transition-all"
    >
      {/* Top Banner: Where the user is in this exact moment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              loading
                ? "bg-cyan-400 animate-ping"
                : hasResults && !isStale
                ? "bg-emerald-400"
                : isStale
                ? "bg-amber-400 animate-pulse"
                : hasWorkloads
                ? "bg-brand-primary animate-pulse"
                : "bg-brand-primary"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-primary">
                {loading
                  ? "Evaluating Now"
                  : hasResults && !isStale
                  ? "Phase 3 of 3 • Diagnostic Report Ready"
                  : isStale
                  ? "Specs Changed • Re-Evaluation Needed"
                  : hasWorkloads
                  ? "Phase 2 of 3 • Ready to Check Compatibility"
                  : "Phase 1 of 3 • Configure Computer Specs"}
              </span>
            </div>
            <p className="text-xs text-content-body font-medium mt-0.5">
              {loading
                ? "Crunching peak RAM pressure, instruction sets, and GPU headroom..."
                : hasResults && !isStale
                ? `Compatibility score calculated (${result?.score}/100). Review your bottleneck diagnosis below.`
                : isStale
                ? "Your hardware or apps were updated. Click Check Compatibility to refresh calculations."
                : hasWorkloads
                ? `${workloads.length} application${workloads.length > 1 ? "s" : ""} selected for ${cpuSummary} (${ramSummary}). Click Check Compatibility below.`
                : "Verify your processor and memory on the left, then pick apps on the right."}
            </p>
          </div>
        </div>

        {/* Quick action button based on current moment */}
        <div className="shrink-0 flex items-center gap-2">
          {hasResults && !loading && (
            <button
              type="button"
              onClick={() => onStepClick(3)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Jump to Verdict ({result?.score}/100)</span>
            </button>
          )}

          {!hasResults && hasWorkloads && onRunEvaluate && (
            <button
              type="button"
              onClick={onRunEvaluate}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-primary hover:bg-brand-primary-hover text-white transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Check Compatibility</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Connected Timeline Stepper */}
      <div className="relative pt-2">
        {/* Horizontal Connecting Progress Line */}
        <div className="absolute top-7 left-8 right-8 h-1 bg-surface-subtle -translate-y-1/2 rounded-full overflow-hidden z-0">
          <div
            className="h-full bg-gradient-to-r from-brand-primary to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 3 Step Buttons */}
        <div className="relative z-10 grid grid-cols-3 gap-2">
          {/* STEP 1: HARDWARE */}
          <button
            type="button"
            onClick={() => onStepClick(1)}
            className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex flex-col items-center sm:items-start gap-1 group ${
              currentPhase === 1
                ? "bg-surface-card border-brand-primary shadow-sm ring-2 ring-brand-primary/20"
                : hasWorkloads || hasResults
                ? "bg-surface-card/60 hover:bg-surface-card border-emerald-500/30 text-content-strong"
                : "bg-surface-subtle border-border-subtle text-content-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-transform group-hover:scale-105 ${
                  hasWorkloads || hasResults
                    ? "bg-emerald-500 text-white"
                    : currentPhase === 1
                    ? "bg-brand-primary text-white shadow-xs"
                    : "bg-surface-elevated text-content-muted border border-border-subtle"
                }`}
              >
                {hasWorkloads || hasResults ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  "1"
                )}
              </div>
              <span className="text-xs font-bold text-content-strong hidden sm:inline">
                Step 1: Your PC
              </span>
            </div>
            <div className="text-[11px] text-content-muted line-clamp-1 text-center sm:text-left mt-0.5">
              <span className="font-semibold text-content-strong">
                {cpuSummary}
              </span>{" "}
              • {ramSummary}
            </div>
          </button>

          {/* STEP 2: WORKLOADS */}
          <button
            type="button"
            onClick={() => onStepClick(2)}
            className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex flex-col items-center sm:items-start gap-1 group ${
              currentPhase === 2
                ? "bg-surface-card border-brand-primary shadow-sm ring-2 ring-brand-primary/20"
                : hasResults && !isStale
                ? "bg-surface-card/60 hover:bg-surface-card border-emerald-500/30 text-content-strong"
                : "bg-surface-subtle border-border-subtle text-content-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-transform group-hover:scale-105 ${
                  hasResults && !isStale
                    ? "bg-emerald-500 text-white"
                    : currentPhase === 2
                    ? "bg-brand-primary text-white shadow-xs"
                    : "bg-surface-elevated text-content-muted border border-border-subtle"
                }`}
              >
                {hasResults && !isStale ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  "2"
                )}
              </div>
              <span className="text-xs font-bold text-content-strong hidden sm:inline">
                Step 2: Apps & Usage
              </span>
            </div>
            <div className="text-[11px] text-content-muted line-clamp-1 text-center sm:text-left mt-0.5">
              {hasWorkloads ? (
                <span className="text-brand-primary font-semibold">
                  {workloads.length} app{workloads.length > 1 ? "s" : ""} selected
                </span>
              ) : (
                <span>Pick 1+ apps to test</span>
              )}
            </div>
          </button>

          {/* STEP 3: RESULTS & VERDICT */}
          <button
            type="button"
            onClick={() => onStepClick(3)}
            disabled={!hasResults && !loading}
            className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex flex-col items-center sm:items-start gap-1 group ${
              currentPhase === 3
                ? "bg-surface-card border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                : "bg-surface-subtle border-border-subtle text-content-muted opacity-80"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-transform group-hover:scale-105 ${
                  loading
                    ? "bg-brand-primary text-white animate-spin"
                    : hasResults && !isStale
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "bg-surface-elevated text-content-muted border border-border-subtle"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5" />
                ) : hasResults ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : (
                  "3"
                )}
              </div>
              <span className="text-xs font-bold text-content-strong hidden sm:inline">
                Step 3: Verdict
              </span>
            </div>
            <div className="text-[11px] text-content-muted line-clamp-1 text-center sm:text-left mt-0.5">
              {loading ? (
                <span className="text-brand-primary font-semibold">
                  Analyzing...
                </span>
              ) : hasResults ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Score: {result?.score}/100
                </span>
              ) : (
                <span>Awaiting check</span>
              )}
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
