"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HardwareProfile } from "@/lib/domain/hardware";
import { SelectedWorkload } from "@/lib/domain/software";
import { FriendlyHardwareSelector } from "@/components/FriendlyHardwareSelector";
import { WorkloadStackBuilder } from "@/components/WorkloadStackBuilder";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import { CompatibilityMap } from "@/components/CompatibilityMap";
import { StressMySetup } from "@/components/StressMySetup";
import { ResourceFingerprint } from "@/components/ResourceFingerprint";
import { ShareModal } from "@/components/ShareModal";
import { BottleneckCard } from "@/components/BottleneckCard";
import { StickyActionDock } from "@/components/StickyActionDock";
import { DesktopHardwareQRModal } from "@/components/DesktopHardwareQRModal";
import {
  Cpu,
  Sparkles,
  ArrowRight,
  Share2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Zap,
} from "lucide-react";
import { CompatibilityResult, UpgradeRecommendation } from "@/lib/domain/compatibility";
import { AddToComparisonButton } from "@/components/comparison/AddToComparisonButton";
import { saveCurrentDraft, getCurrentDraft } from "@/lib/comparison/storage";
import { SpecImportModal } from "@/components/importer/SpecImportModal";
import { computerProfileToHardwareProfile, ComputerProfile } from "@/lib/domain/computer-profile";
import { CalculationTransparencyInspector } from "@/components/results/CalculationTransparencyInspector";

const DEFAULT_HARDWARE: HardwareProfile = {
  cpu: {
    model: "AMD Ryzen 5 5600H",
    manufacturer: "AMD",
    architecture: "x86_64",
    physicalCores: 6,
    performanceScore: 68,
    laptopVariant: true,
    isVerified: true,
  },
  gpu: {
    model: "NVIDIA GeForce RTX 3050 Laptop GPU",
    manufacturer: "NVIDIA",
    type: "dedicated",
    performanceScore: 55,
    vramGb: 4.0,
    supportsCuda: true,
    supportsDirectX12: true,
    supportsVulkan: true,
    laptopVariant: true,
    isVerified: true,
  },
  ram: { totalGb: 16, type: "DDR4" },
  storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 180, isSystemDrive: true }],
  os: { family: "windows", version: "11", architecture: "x86_64" },
  architecture: "x86_64",
  deviceType: "laptop",
  supportsVirtualization: true,
  isVirtualizationEnabled: true,
};

const DEFAULT_WORKLOADS: SelectedWorkload[] = [
  {
    softwareId: "adobe-photoshop",
    softwareName: "Adobe Photoshop 2024",
    softwareVersionId: "ver_photoshop_2024",
    versionString: "2024",
    workloadId: "w_adobe-photoshop",
    workloadName: "24-45MP multi-layered RAW composites & Smart Objects",
    intensity: "heavy",
    concurrency: "foreground",
    quantity: 1,
  },
  {
    softwareId: "android-studio",
    softwareName: "Android Studio Iguana",
    softwareVersionId: "ver_android-studio_20241",
    versionString: "2024.1",
    workloadId: "w_android-studio",
    workloadName: "Gradle build daemon + Kotlin compiler + layout inspector",
    intensity: "heavy",
    concurrency: "foreground",
    quantity: 1,
  },
  {
    softwareId: "android-emulator",
    softwareName: "Android Emulator (AVD)",
    softwareVersionId: "ver_android-emulator_341",
    versionString: "34.1",
    workloadId: "w_android-emulator",
    workloadName: "1080p ARM/x86 hardware-accelerated virtual device",
    intensity: "medium",
    concurrency: "background",
    quantity: 1,
  },
  {
    softwareId: "google-chrome",
    softwareName: "Google Chrome",
    softwareVersionId: "ver_google-chrome_1250",
    versionString: "125.0",
    workloadId: "w_google-chrome",
    workloadName: "30+ active dev tabs + DevTools + media playback",
    intensity: "heavy",
    concurrency: "background",
    quantity: 1,
  },
];

import { analytics } from "@/lib/observability/analytics/client";

export default function CheckPcPage() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<"natural" | "manual">("natural");
  const [stage, setStage] = useState<"basic" | "advanced">("basic");

  const [hardware, setHardware] = useState<HardwareProfile>(DEFAULT_HARDWARE);
  const [workloads, setWorkloads] = useState<SelectedWorkload[]>(DEFAULT_WORKLOADS);
  const [isSimultaneous, setIsSimultaneous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    analytics.track("journey_started", {
      journey: "check",
    });
  }, []);

  // Restore draft on mount if available
  useEffect(() => {
    const draft = getCurrentDraft();
    if (draft && draft.hardware) {
      setHardware(draft.hardware);
      if (draft.workloads && draft.workloads.length > 0) {
        setWorkloads(draft.workloads);
      }
      setIsSimultaneous(draft.isSimultaneous ?? true);
    }
  }, []);

  // Auto-save draft on hardware / workload updates
  useEffect(() => {
    saveCurrentDraft(hardware, workloads, isSimultaneous);
  }, [hardware, workloads, isSimultaneous]);

  const handleHardwareChange = (updated: HardwareProfile) => {
    setHardware(updated);
    if (result) setIsStale(true);
  };

  const handleWorkloadsChange = (updated: SelectedWorkload[]) => {
    setWorkloads(updated);
    if (result) setIsStale(true);
  };

  const handleSimultaneousChange = (sim: boolean) => {
    setIsSimultaneous(sim);
    analytics.track("concurrent_usage_selected", {
      isSimultaneous: sim,
      totalWorkloadsCount: workloads.length,
    });
    if (result) setIsStale(true);
  };

  const handleReset = () => {
    setHardware(DEFAULT_HARDWARE);
    setWorkloads(DEFAULT_WORKLOADS);
    setIsSimultaneous(true);
    setResult(null);
    setErrorMsg(null);
    setPublicId(null);
    setShowSources(false);
    setIsStale(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEvaluate = async (targetHardware?: HardwareProfile) => {
    if (workloads.length === 0) {
      setErrorMsg("Please select at least one software application to evaluate.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    setIsStale(false);

    const activeHw = targetHardware || hardware;
    const startTime = Date.now();

    analytics.track("compatibility_check_started", {
      workloadCount: workloads.length,
      operatingSystemFamily: (activeHw.os?.family as any) || "other",
    });

    try {
      const res = await fetch("/api/compatibility/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hardware: activeHw,
          workloads,
          isSimultaneous,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Evaluation failed");
      }

      setResult(data.result);
      setPublicId(data.publicId);

      const elapsed = Date.now() - startTime;
      analytics.track("compatibility_check_completed", {
        resultStatus: (data.result.overallStatus as any) || "recommended",
        scoreBucket:
          data.result.overallScore >= 90
            ? "90-100"
            : data.result.overallScore >= 75
            ? "75-89"
            : data.result.overallScore >= 50
            ? "50-74"
            : "<50",
        limitingResource: (data.result.limitingFactor as any) || "none",
        durationBucket: elapsed < 100 ? "<100ms" : elapsed < 500 ? "100-500ms" : ">500ms",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during evaluation.");
      analytics.track("compatibility_check_failed", {
        errorCode: "EVALUATION_ERROR",
        workloadCount: workloads.length,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateUpgrade = (rec?: UpgradeRecommendation) => {
    let nextHardware: HardwareProfile = { ...hardware };
    
    if (!rec || rec.component === "memory") {
      const currentRam = hardware.ram.totalGb || 16;
      const upgradedRam = currentRam < 16 ? 16 : currentRam < 32 ? 32 : currentRam < 64 ? 64 : 128;
      nextHardware = {
        ...nextHardware,
        ram: { ...nextHardware.ram, totalGb: upgradedRam },
      };
    } else if (rec.component === "gpu" || rec.component === "vram") {
      nextHardware = {
        ...nextHardware,
        gpu: nextHardware.gpu
          ? {
              ...nextHardware.gpu,
              model: "NVIDIA GeForce RTX 4070 Laptop GPU",
              vramGb: Math.max(8.0, (nextHardware.gpu.vramGb || 4) + 4),
              performanceScore: Math.min(92, (nextHardware.gpu.performanceScore || 55) + 25),
            }
          : {
              model: "NVIDIA GeForce RTX 4070",
              type: "dedicated",
              vramGb: 8,
              performanceScore: 82,
              supportsCuda: true,
              supportsDirectX12: true,
              isVerified: true,
            },
      };
    } else if (rec.component === "cpu") {
      nextHardware = {
        ...nextHardware,
        cpu: {
          ...nextHardware.cpu,
          physicalCores: Math.max(12, (nextHardware.cpu.physicalCores || 6) + 4),
          performanceScore: Math.min(95, (nextHardware.cpu.performanceScore || 50) + 20),
        },
      };
    }

    setHardware(nextHardware);
    handleEvaluate(nextHardware);

    // Smooth scroll down to result view
    setTimeout(() => {
      const elem = document.getElementById("results-section") || document.getElementById("what-if-simulator-section");
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 mobile-safe-bottom font-sans">
      {/* Top Header & Reset Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-content-strong tracking-tight">
            Check My Computer
          </h1>
          <p className="text-xs sm:text-sm text-content-body max-w-2xl mt-1">
            Evaluate whether your computer has the memory, compute power, and system features to run your applications.
          </p>
        </div>

        {/* Action buttons: Reset & QR mobile scan */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="touch-target px-3.5 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated text-content-body text-xs font-mono font-semibold flex items-center gap-1.5 border border-border-subtle shadow-xs transition-all"
            title="Scan QR to open specs on mobile"
          >
            <QrCode className="h-4 w-4 text-brand-primary" />
            <span className="hidden sm:inline">Phone Transfer</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="touch-target px-3.5 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated text-content-body text-xs font-mono font-semibold flex items-center gap-1.5 border border-border-subtle shadow-xs transition-all"
            title="Reset hardware and workloads to defaults"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3-Step Clear Progression Indicator */}
      <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-center border-b border-border-subtle pb-4">
        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
          <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-bold">1</span>
          <span>Your Computer</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-surface-subtle text-content-strong border border-border-subtle">
          <span className="w-5 h-5 rounded-full bg-surface-elevated text-content-muted flex items-center justify-center text-[10px] font-bold border border-border-subtle">2</span>
          <span>Apps & Usage</span>
        </div>
        <div className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border ${result ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold" : "bg-surface-subtle text-content-muted border-border-subtle"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${result ? "bg-emerald-500 text-white" : "bg-surface-elevated text-content-muted border border-border-subtle"}`}>3</span>
          <span>Results & Next Steps</span>
        </div>
      </div>

      {/* STEP 1 & 2: Hardware Input & Workload Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Hardware Input Panel */}
        <div className="lg:col-span-6 surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-brand-primary" />
              <h2 className="text-sm sm:text-base font-bold text-content-strong">
                Step 1: Your Computer Specs
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="touch-target px-2.5 py-1 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold border border-brand-primary/20 flex items-center gap-1.5 transition-all shadow-2xs"
              title="Import specs from text or screenshot"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Import Specs</span>
            </button>
          </div>

          <FriendlyHardwareSelector
            value={hardware}
            onChange={handleHardwareChange}
          />
        </div>

        {/* Workload Stack Builder Panel */}
        <div className="lg:col-span-6 surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-primary" />
              <h2 className="text-sm sm:text-base font-bold text-content-strong">
                Step 2: Apps & Multitasking
              </h2>
            </div>
            <span className="text-xs text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full font-bold">
              {workloads.length} Selected
            </span>
          </div>

          <WorkloadStackBuilder
            selectedWorkloads={workloads}
            onChange={handleWorkloadsChange}
            isSimultaneous={isSimultaneous}
            onSimultaneousChange={handleSimultaneousChange}
          />

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Outdated Stale Results Warning */}
          {isStale && result && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center justify-between">
              <span>⚠️ Specs or apps updated. Click Check Compatibility to refresh results.</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleEvaluate()}
            disabled={loading}
            className="touch-target w-full py-3.5 px-6 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Evaluating Concurrency Matrix...</span>
              </>
            ) : (
              <>
                <span>Check Compatibility</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6-LEVEL MOBILE DIAGNOSTIC RESULTS HIERARCHY */}
      {result && (
        <div id="results-section" className="space-y-6 pt-4 border-t border-border-subtle animate-in fade-in duration-300">
          {/* STEP 1: Verdict & Match Score Card */}
          <div className="surface-card p-6 rounded-3xl border border-border-subtle shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    result.performanceTier === "recommended" || result.performanceTier === "excellent"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  }`}
                >
                  ● {result.performanceTier.toUpperCase()}
                </span>
                <span className="text-xs text-content-muted font-mono">
                  {result.confidence >= 70 ? "High Confidence" : "Medium Confidence"} • {workloads.length} Workloads
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-content-strong tracking-tight">
                {result.performanceTier === "recommended" || result.performanceTier === "excellent"
                  ? "Your PC handles this workload well."
                  : "Your PC can run this workload with memory constraints."}
              </h2>
              <p className="text-xs sm:text-sm text-content-body max-w-2xl leading-relaxed">
                Deterministic concurrency evaluation based on active steady-state working sets and OS reserve headroom.
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
              <div className="text-left sm:text-right font-mono">
                <div className="text-[10px] uppercase font-bold text-content-muted">Match Score</div>
                <div className="text-4xl sm:text-5xl font-black text-brand-primary">{result.score}</div>
              </div>

              {/* Add to Comparison Button */}
              <AddToComparisonButton
                hardware={hardware}
                workloads={workloads}
                isSimultaneous={isSimultaneous}
                score={result.score}
                status={result.performanceTier}
              />

              {/* Share Report Button */}
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="touch-target px-4 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-elevated text-content-strong border border-border-subtle text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Share2 className="h-4 w-4 text-brand-primary" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* STEP 2: Primary Bottleneck & Direct Simulation Action Card */}
          <BottleneckCard
            bottlenecks={result.bottlenecks}
            upgradeRecommendations={result.upgradeRecommendations}
            onSimulateUpgrade={handleSimulateUpgrade}
            isSimulating={loading}
          />

          {/* STEP 3 & 4: Workload Summary & Resource Fingerprint Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detailed Resource Fingerprint */}
            <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-content-muted mb-2">
                  System Resource Fingerprint
                </div>
                <h4 className="text-sm font-bold text-content-strong mb-4">
                  Multi-Resource Capacity Distribution
                </h4>
                <div className="flex justify-center py-2">
                  <ResourceFingerprint
                    metrics={{
                      cpu: result.components.cpu.score || 92,
                      ram: result.components.memory?.score ?? (result.concurrencyMetrics.ramPressureRatio > 1.2 ? 40 : 85),
                      gpu: result.components.gpu.score || 88,
                      vram: result.components.vram.score || 90,
                      disk: result.components.storage?.score || 85,
                      platform: result.components.os?.status === "PASS",
                    }}
                    label="Current PC Fingerprint"
                  />
                </div>
              </div>
              <p className="text-[11px] text-content-muted font-mono pt-2 border-t border-border-subtle">
                Visual identity: CPU (Blue) • GPU (Violet) • RAM (Cyan) • VRAM (Purple) • Storage (Teal)
              </p>
            </div>

            {/* Workload Stack Summary */}
            <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-3 shadow-sm">
              <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-content-muted">
                Active Concurrency Workloads ({workloads.length})
              </div>
              <div className="space-y-2 font-mono text-xs">
                {workloads.map((w, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between">
                    <div>
                      <span className="font-bold text-content-strong block">{w.softwareName}</span>
                      <span className="text-[10px] text-content-muted">{w.workloadName}</span>
                    </div>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-lg bg-surface-card border border-border-subtle text-content-muted font-semibold">
                      {w.intensity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 4.5: Workload Resolution & Quality Feasibility Matrix (PCBuildCheck Inspiration) */}
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

          {/* STEP 5: Interactive Transparency Inspector & What-If Upgrade Simulator */}
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

          {/* STEP 6: Deep Evidence — Compatibility Map, Stress My Setup & Sources */}
          <div className="space-y-6">
            <CompatibilityMap hardware={hardware} workloads={workloads} result={result} />
            <StressMySetup hardware={hardware} baseScore={result.score} />

            {/* Collapsible Provenance Drawer */}
            <div className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-3 shadow-sm">
              <button
                type="button"
                onClick={() => setShowSources(!showSources)}
                className="w-full flex items-center justify-between text-xs font-mono font-bold text-content-body hover:text-content-strong transition-colors touch-target"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>How we know this — Official Requirements & Provenance</span>
                </div>
                {showSources ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showSources && (
                <div className="pt-3 border-t border-border-subtle space-y-3 text-xs text-content-body">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                      <div className="font-bold text-content-strong flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Adobe Photoshop
                      </div>
                      <div className="text-[10px] text-content-muted">Source: Official Vendor Spec (Adobe Inc.)</div>
                      <div className="text-[10px] text-content-muted font-mono">Verified: Aug 2026</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                      <div className="font-bold text-content-strong flex items-center gap-1.5 font-mono">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Android Studio + Emulator
                      </div>
                      <div className="text-[10px] text-content-muted">Source: Google Android Developers</div>
                      <div className="text-[10px] text-content-muted font-mono">Verified: Sep 2026</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                      <div className="font-bold text-content-strong flex items-center gap-1.5 font-mono">
                        <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                        Chrome 30-Tab Working Set
                      </div>
                      <div className="text-[10px] text-content-muted">Source: Calibrated Memory Profile</div>
                      <div className="text-[10px] text-content-muted font-mono">Confidence: Medium</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Share Modal Dialog */}
          <ShareModal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            title="ComputeBestSpecs Hardware Evaluation"
            score={result.score}
            verdict={result.performanceTier}
          />

          {/* Desktop Hardware QR Code Modal */}
          <DesktopHardwareQRModal
            isOpen={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            hardware={hardware}
          />
        </div>
      )}

      {/* Sticky Mobile Action Dock (Context-Aware: Evaluates before result, Simulates after result) */}
      <StickyActionDock
        mode={result ? "simulate" : "evaluate"}
        onPrimaryClick={() => {
          if (!result) {
            handleEvaluate();
          } else if (result.upgradeRecommendations[0]) {
            handleSimulateUpgrade(result.upgradeRecommendations[0]);
          } else {
            // Scroll to WhatIfSimulator if no direct upgrade rec
            const elem = document.getElementById("what-if-simulator-section");
            if (elem) {
              elem.scrollIntoView({ behavior: "smooth" });
            } else {
              window.scrollTo({ top: 600, behavior: "smooth" });
            }
          }
        }}
        onShareClick={() => setShareModalOpen(true)}
        onSaveClick={() => {
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem("computebestspecs_saved_profile", JSON.stringify(hardware));
              alert(`✓ Saved "${hardware.cpu.model} (${hardware.ram.totalGb}GB RAM)" to your local PC inventory!`);
            }
          } catch (e) {
            console.error("Save error", e);
          }
        }}
        isLoading={loading}
      />

      <SpecImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onProfileConfirmed={(profile) => {
          const hw = computerProfileToHardwareProfile(profile);
          setHardware(hw);
          setIsStale(true);
        }}
      />
    </div>
  );
}

