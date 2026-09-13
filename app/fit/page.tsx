"use client";

import { useState, useMemo, useRef } from "react";
import { HardwareProfile } from "@/lib/domain/hardware";
import { UserNeedsProfile, FitStatus } from "@/lib/domain/needs-profile";
import { PERSONAS_CATALOG } from "@/services/needs/personas-catalog";
import { evaluateNeedsFit } from "@/services/needs/needs-evaluator";
import { NeedsIntakeWizard } from "@/components/needs/NeedsIntakeWizard";
import { FitFingerprintRadar } from "@/components/needs/FitFingerprintRadar";
import { AgentConcurrencySimulator } from "@/components/needs/AgentConcurrencySimulator";
import { ExecutionStrategyCard } from "@/components/needs/ExecutionStrategyCard";
import { ReverseCapabilityScanner } from "@/components/needs/ReverseCapabilityScanner";
import { ConfidenceProvenanceModal } from "@/components/needs/ConfidenceProvenanceModal";
import { HardwareSelector } from "@/features/hardware/HardwareSelector";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ThumbsUp,
  Ban,
  Zap,
  Gauge,
  DollarSign,
  SlidersHorizontal,
  Info,
  Laptop,
} from "lucide-react";

// Exhaustive TypeScript presentation mapping for FitStatus
const FIT_STATUS_MAP: Record<
  FitStatus,
  {
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  excellent: {
    badgeClass: "bg-status-success/15 text-status-success border-status-success/30",
    icon: CheckCircle2,
    label: "YES — EXCELLENT FIT",
  },
  good: {
    badgeClass: "bg-brand-primary/15 text-brand-primary border-brand-primary/30",
    icon: ThumbsUp,
    label: "YES — GOOD FIT",
  },
  borderline: {
    badgeClass: "bg-status-warning/15 text-status-warning border-status-warning/30",
    icon: AlertTriangle,
    label: "BORDERLINE FIT",
  },
  poor: {
    badgeClass: "bg-status-danger/15 text-status-danger border-status-danger/30",
    icon: XCircle,
    label: "POOR FIT FOR WORKLOAD",
  },
  incompatible: {
    badgeClass: "bg-status-danger/15 text-status-danger border-status-danger/30",
    icon: Ban,
    label: "INCOMPATIBLE HARDWARE",
  },
  unknown: {
    badgeClass: "bg-status-unknown/15 text-status-unknown border-status-unknown/30",
    icon: HelpCircle,
    label: "INSUFFICIENT DATA",
  },
};

export default function FitForMePage() {
  const stressSectionRef = useRef<HTMLDivElement>(null);
  const hardwareSectionRef = useRef<HTMLDivElement>(null);

  // Hardware State (With explicit Demo state tracking)
  const [isDemoHardware, setIsDemoHardware] = useState(true);
  const [hardware, setHardware] = useState<HardwareProfile>({
    cpu: {
      model: "Intel Core i7-13700K",
      manufacturer: "Intel",
      architecture: "x86_64",
      physicalCores: 16,
      performanceScore: 90,
      isVerified: true,
    },
    gpu: {
      model: "NVIDIA GeForce RTX 4070",
      manufacturer: "NVIDIA",
      type: "dedicated",
      performanceScore: 88,
      vramGb: 12.0,
      supportsCuda: true,
      supportsDirectX12: true,
      supportsVulkan: true,
      isVerified: true,
    },
    ram: { totalGb: 32, type: "DDR5" },
    storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 450, isSystemDrive: true }],
    os: { family: "windows", version: "11", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "desktop",
    supportsVirtualization: true,
    isVirtualizationEnabled: true,
  });

  // User Needs Profile
  const [needsProfile, setNeedsProfile] = useState<UserNeedsProfile>({
    id: "profile-default",
    personaId: "persona-fullstack-dev",
    primaryGoal: "Full-stack developer running VS Code, Docker, Chrome 30 tabs, Postgres, and local coding AI.",
    weights: PERSONAS_CATALOG[0].weights,
    workloads: PERSONAS_CATALOG[0].typicalWorkloads,
    agentProfile: PERSONAS_CATALOG[0].defaultAgentProfile,
    targetLongevityYears: 3,
  });

  // Optional Purchase Price State
  const [priceInput, setPriceInput] = useState<string>("");
  const [currency, setCurrency] = useState<"ILS" | "USD" | "EUR">("ILS");
  const [showPriceInput, setShowPriceInput] = useState(false);

  // Provenance Modal State
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);

  // Dynamic Evaluation
  const evaluation = useMemo(() => {
    const enrichedProfile: UserNeedsProfile = {
      ...needsProfile,
      budget: priceInput && Number(priceInput) > 0 ? { amount: Number(priceInput), currency } : undefined,
    };
    return evaluateNeedsFit(hardware, enrichedProfile);
  }, [hardware, needsProfile, priceInput, currency]);

  const statusConfig = FIT_STATUS_MAP[evaluation.overallFit] || FIT_STATUS_MAP.good;
  const StatusIcon = statusConfig.icon;

  const scrollToStress = () => {
    stressSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToHardware = () => {
    hardwareSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSimulateLimitation = () => {
    if (evaluation.mainLimitation?.simulateValue) {
      if (evaluation.mainLimitation.resource === "ram") {
        setHardware((prev) => ({
          ...prev,
          ram: { ...prev.ram, totalGb: evaluation.mainLimitation!.simulateValue! },
        }));
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 mobile-safe-bottom">
      {/* Header */}
      <div className="border-b border-border-subtle pb-5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary">
          Needs → Workload → Hardware → Experience
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content-strong tracking-tight mt-1">
          Is this computer right for you?
        </h1>
        <p className="text-xs sm:text-sm text-content-body max-w-3xl mt-1.5 leading-relaxed">
          We'll test it against the way you actually work, play, create, and use AI.
        </p>
      </div>

      {/* STEP 1: Needs Intake Wizard */}
      <NeedsIntakeWizard
        onProfileGenerated={(profile) => setNeedsProfile(profile)}
        initialProfile={needsProfile}
      />

      {/* STEP 2: Target Hardware Selector */}
      <div ref={hardwareSectionRef} className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-brand-primary" />
            <h2 className="text-base font-bold text-content-strong">
              2. Target Computer Specification
            </h2>
            {isDemoHardware && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Demo Configuration
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-content-muted">
            {hardware.cpu.model} • {hardware.ram.totalGb}GB RAM • {hardware.gpu?.model || "Integrated Graphics"}
          </span>
        </div>

        <HardwareSelector
          value={hardware}
          onChange={(updated) => {
            setHardware(updated);
            setIsDemoHardware(false);
          }}
        />

        {/* Optional Price Input Toggle */}
        <div className="pt-2 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-content-muted">
            <DollarSign className="h-4 w-4 text-status-success" />
            <span>Know the purchase price? Add it for value ROI analysis:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-surface-elevated border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-content-strong font-mono focus:ring-2 focus:ring-brand-primary"
            >
              <option value="ILS">₪ ILS</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="e.g. 4500"
              className="w-28 bg-surface-elevated border border-border-subtle rounded-xl px-3 py-1.5 text-xs font-mono text-content-strong placeholder-content-muted focus:ring-2 focus:ring-brand-primary"
            />
            {priceInput && (
              <button
                type="button"
                onClick={() => setPriceInput("")}
                className="text-[11px] text-content-muted hover:text-content-strong underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STEP 3: THE DECISION EXPERIENCE (Strict Mobile Hierarchy) */}
      <div className="space-y-6 pt-2">
        {/* 1. HERO VERDICT BANNER */}
        <div className="bg-surface-card p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-content-muted block">
                Decision Outcome
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-extrabold ${statusConfig.badgeClass}`}
                >
                  <StatusIcon className="h-4 w-4 shrink-0" />
                  <span>{statusConfig.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowProvenanceModal(true)}
                  className="touch-target px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-secondary border border-border-subtle text-xs text-content-body hover:text-content-strong flex items-center gap-1.5 transition-all shadow-sm"
                  title="Click to see factual verification details"
                >
                  <span className="font-mono font-bold text-content-strong">{evaluation.fitScore}/100</span>
                  <span className="text-content-muted">•</span>
                  <span className="flex items-center gap-1 text-status-success font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                    {evaluation.provenance.confidenceTier}
                  </span>
                  <Info className="h-3.5 w-3.5 text-content-muted ml-0.5" />
                </button>
              </div>

              <p className="text-sm sm:text-base text-content-strong font-medium max-w-2xl leading-relaxed pt-1">
                {evaluation.verdictSummary}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={scrollToStress}
                className="touch-target px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Gauge className="h-4 w-4" />
                <span>Stress My Setup</span>
              </button>

              <button
                type="button"
                onClick={scrollToHardware}
                className="touch-target px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-secondary border border-border-subtle text-xs text-content-strong font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <SlidersHorizontal className="h-4 w-4 text-brand-primary" />
                <span>Change / Compare PC</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. MAIN LIMITATION / BOTTLENECK CARD */}
        {evaluation.mainLimitation ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-status-warning/10 border border-status-warning/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-status-warning">
                  Main Bottleneck
                </span>
                <span className="text-xs font-bold text-content-strong">
                  {evaluation.mainLimitation.title}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-content-strong font-semibold">
                <span className="font-mono text-content-muted">{evaluation.mainLimitation.currentCapacity}</span>
                <span className="mx-2 text-content-muted">→</span>
                <span className="text-status-warning font-mono">{evaluation.mainLimitation.recommendedCapacity}</span>
              </div>
              <p className="text-xs text-content-body max-w-2xl leading-relaxed">
                {evaluation.mainLimitation.impactExplanation}
              </p>
            </div>

            {evaluation.mainLimitation.simulateValue && (
              <button
                type="button"
                onClick={handleSimulateLimitation}
                className="touch-target px-4 py-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated border border-status-warning/40 text-content-strong text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-all"
              >
                <span>Simulate {evaluation.mainLimitation.simulateValue} GB</span>
                <ArrowRight className="h-3.5 w-3.5 text-status-warning" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-status-success/10 border border-status-success/30 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-status-success shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-content-strong">No Hardware Bottleneck Detected: </span>
              <span className="text-content-body">Installed CPU, GPU, and RAM subsystems provide sufficient headroom for all active tasks.</span>
            </div>
          </div>
        )}

        {/* 3. WHAT YOU SHOULD DO (Upgrade Advisor Banner with Live Pricing Tiers) */}
        <div
          className={`p-6 rounded-3xl border shadow-sm ${
            evaluation.upgradeVerdict.shouldUpgrade
              ? "bg-surface-card border-border-subtle"
              : "bg-status-success/5 border-status-success/30"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2 text-xs font-bold">
              {evaluation.upgradeVerdict.shouldUpgrade ? (
                <Zap className="h-4 w-4 text-status-warning" />
              ) : (
                <Ban className="h-4 w-4 text-status-success" />
              )}
              <span
                className={
                  evaluation.upgradeVerdict.shouldUpgrade
                    ? "text-status-warning"
                    : "text-status-success"
                }
              >
                {evaluation.upgradeVerdict.headline}
              </span>
            </div>
            <span className="text-[10px] text-content-muted uppercase font-semibold">Actionable Guidance</span>
          </div>

          <p className="text-xs sm:text-sm text-content-body mt-2.5 leading-relaxed">
            {evaluation.upgradeVerdict.reason}
          </p>

          {evaluation.upgradeVerdict.primaryUpgrade && (
            <div className="mt-4 p-4 rounded-2xl bg-surface-elevated border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-content-muted uppercase font-bold">
                    Highest Impact Upgrade
                  </span>
                  <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                    Live Market Estimate
                  </span>
                </div>
                <div className="font-bold text-content-strong text-sm mt-0.5">
                  {evaluation.upgradeVerdict.primaryUpgrade.component}:{" "}
                  <span className="font-mono">{evaluation.upgradeVerdict.primaryUpgrade.from}</span> →{" "}
                  <span className="font-mono text-brand-primary">{evaluation.upgradeVerdict.primaryUpgrade.to}</span>
                </div>
                <div className="text-[11px] text-content-muted mt-0.5">
                  {evaluation.upgradeVerdict.primaryUpgrade.justification}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-content-muted uppercase font-semibold block">Market Price Range</span>
                <div className="text-sm font-extrabold text-content-strong font-mono">
                  {evaluation.upgradeVerdict.primaryUpgrade.priceRangeIls || `~₪${evaluation.upgradeVerdict.primaryUpgrade.estimatedCostIls}`}
                </div>
                <span className="text-[10px] text-content-muted">(${evaluation.upgradeVerdict.primaryUpgrade.estimatedCostUsd} USD indicative)</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. SUPPORTING 4-DIMENSION MATRIX (Supporting evidence row, not equal hero cards) */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
            Supporting Evidence Dimensions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {/* Dimension 1: CAN RUN */}
            <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle space-y-1.5 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-content-muted">1. Can Run?</div>
              <div
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  evaluation.canRun.status ? "text-status-success" : "text-status-danger"
                }`}
              >
                {evaluation.canRun.status ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span>{evaluation.canRun.status ? "✓ Fully Compatible" : "✕ Incompatible"}</span>
              </div>
              <p className="text-[11px] text-content-body leading-normal">
                {evaluation.canRun.label}
              </p>
            </div>

            {/* Dimension 2: RUNS WELL */}
            <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle space-y-1.5 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-content-muted">2. Runs Well?</div>
              <div className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
                <ThumbsUp className="h-4 w-4" />
                <span>{evaluation.runsWell.label}</span>
              </div>
              <p className="text-[11px] text-content-body leading-normal">
                {evaluation.runsWell.summary}
              </p>
            </div>

            {/* Dimension 3: GOOD FOR WORKLOAD */}
            <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle space-y-1.5 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-content-muted">3. Fits Daily Workload?</div>
              <div
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  evaluation.fitsWorkload.status ? "text-status-success" : "text-status-warning"
                }`}
              >
                {evaluation.fitsWorkload.status ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span>{evaluation.fitsWorkload.label}</span>
              </div>
              <p className="text-[11px] text-content-body leading-normal">
                {evaluation.fitsWorkload.summary}
              </p>
            </div>

            {/* Dimension 4: GOOD PURCHASE */}
            <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle space-y-1.5 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-content-muted">4. Good Purchase?</div>
              <div
                className={`text-xs font-bold flex items-center gap-1.5 ${
                  evaluation.goodPurchase.priceKnown
                    ? evaluation.goodPurchase.status
                      ? "text-status-success"
                      : "text-status-warning"
                    : "text-content-muted"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{evaluation.goodPurchase.label}</span>
              </div>
              <p className="text-[11px] text-content-body leading-normal">
                {evaluation.goodPurchase.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* 5 & 6. FIT FINGERPRINT & REVERSE CAPABILITY SCANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FitFingerprintRadar metrics={evaluation.fitFingerprint} />
          <ReverseCapabilityScanner capabilityMap={evaluation.capabilityMap} />
        </div>

        {/* 7. MULTI-AGENT SIZING & STRESS SIMULATOR */}
        <div ref={stressSectionRef}>
          {evaluation.agentSimulation && (
            <AgentConcurrencySimulator
              agentSimulation={evaluation.agentSimulation}
              modelName={needsProfile.agentProfile?.modelName}
            />
          )}
        </div>

        {/* 8. LOCAL VS HYBRID VS CLOUD STRATEGY ADVISOR */}
        <ExecutionStrategyCard strategy={evaluation.executionStrategy} />
      </div>

      {/* Confidence Provenance Modal */}
      <ConfidenceProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
        provenance={evaluation.provenance}
        fitScore={evaluation.fitScore}
        verdictHeadline={evaluation.verdictHeadline}
      />
    </div>
  );
}
