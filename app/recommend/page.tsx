"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SelectedWorkload } from "@/lib/domain/software";
import { RecommendationPreferences, HardwareRecommendation } from "@/lib/domain/recommendation";
import { parseNaturalLanguageNeeds } from "@/services/needs/natural-language-needs-parser";
import { SoftwarePicker } from "@/features/software/SoftwarePicker";
import { RecommendationTierCard } from "@/features/recommendations/RecommendationTierCard";
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Laptop,
  Monitor,
  Server,
  Layers,
  Info,
  DollarSign,
  Compass,
  MessageSquareText,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gauge,
  Cpu,
  Zap,
} from "lucide-react";

const DEVICE_TYPES = [
  { id: "any", label: "No Preference" },
  { id: "desktop", label: "Desktop" },
  { id: "laptop", label: "Laptop" },
  { id: "mini-pc", label: "Mini PC" },
] as const satisfies readonly {
  id: NonNullable<RecommendationPreferences["deviceType"]>;
  label: string;
}[];

const OS_OPTIONS = [
  { id: "any", label: "Any" },
  { id: "windows", label: "Windows" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
] as const satisfies readonly {
  id: NonNullable<RecommendationPreferences["preferredOs"]>;
  label: string;
}[];

const EXAMPLE_WORKLOAD: SelectedWorkload[] = [
  {
    softwareId: "adobe-photoshop",
    softwareName: "Adobe Photoshop",
    softwareVersionId: "ps_v1",
    versionString: "2024",
    workloadId: "w_ps",
    workloadName: "Standard Photo Editing",
    intensity: "medium",
    concurrency: "foreground",
    quantity: 1,
  },
  {
    softwareId: "android-studio",
    softwareName: "Android Studio",
    softwareVersionId: "as_v1",
    versionString: "2024",
    workloadId: "w_as",
    workloadName: "Standard IDE Code Editing & Gradle Builds",
    intensity: "medium",
    concurrency: "foreground",
    quantity: 1,
  },
  {
    softwareId: "android-emulator",
    softwareName: "Android Emulator",
    softwareVersionId: "emu_v1",
    versionString: "2024",
    workloadId: "w_emu",
    workloadName: "Single Active Virtual Device (1080p)",
    intensity: "medium",
    concurrency: "background",
    quantity: 1,
  },
  {
    softwareId: "google-chrome",
    softwareName: "Google Chrome",
    softwareVersionId: "chrome_v1",
    versionString: "2024",
    workloadId: "w_chrome",
    workloadName: "Heavy Dev & Multitasking (20-40+ tabs + DevTools)",
    intensity: "heavy",
    concurrency: "background",
    quantity: 1,
  },
];

export default function RecommendSpecPage() {
  const resultRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dual Intake Mode
  const [intakeMode, setIntakeMode] = useState<"catalog" | "describe">("catalog");
  const [naturalText, setNaturalText] = useState(
    "Full-stack developer with VS Code, Docker, Android Studio, 30 Chrome tabs, and local AI."
  );

  // Selected Workloads (Starts empty by default in production)
  const [workloads, setWorkloads] = useState<SelectedWorkload[]>([]);
  const [isSimultaneous, setIsSimultaneous] = useState(true);

  // Extended Preferences
  const [preferences, setPreferences] = useState<RecommendationPreferences>({
    deviceType: "any",
    preferredOs: "any",
    usageLevel: "recommended",
  });

  const [budgetAmount, setBudgetAmount] = useState<string>("");
  const [budgetCurrency, setBudgetCurrency] = useState<"ILS" | "USD" | "EUR">("ILS");
  const [targetLongevity, setTargetLongevity] = useState<number>(3);
  const [prioritizeLocalAi, setPrioritizeLocalAi] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<HardwareRecommendation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleParseNaturalText = () => {
    if (!naturalText.trim()) return;
    const parsed = parseNaturalLanguageNeeds(naturalText);
    const mapped: SelectedWorkload[] = parsed.workloads.map((w, idx) => ({
      softwareId: w.softwareId,
      softwareName: w.softwareName,
      softwareVersionId: `${w.softwareId}_v2024`,
      versionString: "2024",
      workloadId: `w_${w.softwareId}_${idx}`,
      workloadName: `${w.softwareName} (${w.intensity})`,
      intensity: w.intensity === "extreme" || w.intensity === "professional" ? "heavy" : (w.intensity as "light" | "medium" | "heavy"),
      concurrency: w.concurrencyGroup === "usually_together" ? "foreground" : "background",
      quantity: w.quantity || 1,
    }));

    setWorkloads(mapped);
    if (parsed.budget?.amount) {
      setBudgetAmount(String(parsed.budget.amount));
      if (parsed.budget.currency === "ILS" || parsed.budget.currency === "USD" || parsed.budget.currency === "EUR") {
        setBudgetCurrency(parsed.budget.currency);
      }
    }
    if (parsed.agentProfile) {
      setPrioritizeLocalAi(true);
    }
    setIntakeMode("catalog");
  };

  const handleRecommend = async () => {
    if (workloads.length === 0) {
      setErrorMsg("Please select at least one software application or describe your needs.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          workloads,
          simultaneousUse: isSimultaneous,
          preferences: {
            ...preferences,
            prioritizeLocalAi,
            targetLongevityYears: targetLongevity,
            budget: budgetAmount ? { amount: Number(budgetAmount), currency: budgetCurrency } : undefined,
          },
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Server returned an invalid non-JSON response.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Recommendation calculation failed");
      }

      setRecommendation(data.recommendation);

      // Smooth scroll respecting prefers-reduced-motion
      requestAnimationFrame(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        resultRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMsg(err instanceof Error ? err.message : "An unexpected network error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Best Fit encode for Compatibility Check link
  const bestFitCheckParams = recommendation
    ? new URLSearchParams({
        cpu: recommendation.recommended.cpu.exampleModels[0] || recommendation.recommended.cpu.description,
        gpu: recommendation.recommended.gpu.exampleModels[0] || recommendation.recommended.gpu.description,
        ram: String(recommendation.recommended.ramGb),
      }).toString()
    : "";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-10 mobile-safe-bottom">
      {/* Header */}
      <div className="space-y-2 border-b border-border-subtle pb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold border border-brand-primary/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Workload-Driven Sizing Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-content-strong tracking-tight font-mono">
          Find the Ideal PC Spec for Your Needs
        </h1>
        <p className="text-xs sm:text-sm text-content-body max-w-3xl leading-relaxed">
          Select what you run or describe your typical day. We calculate concurrent RAM pressure, CPU cores, GPU compute, and longevity headroom to generate target hardware specifications.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="bg-surface-card p-6 sm:p-8 rounded-3xl border border-border-subtle shadow-sm space-y-8">
        {/* Step 1: Workload Intake Selection */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
            <h2 className="text-base font-bold text-content-strong flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-primary" />
              1. What software and tools do you use?
            </h2>

            <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-border-subtle text-xs">
              <button
                type="button"
                onClick={() => setIntakeMode("catalog")}
                className={`touch-target px-3 py-1 rounded-lg font-bold transition-all ${
                  intakeMode === "catalog"
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-content-muted hover:text-content-strong"
                }`}
              >
                App Catalog
              </button>
              <button
                type="button"
                onClick={() => setIntakeMode("describe")}
                className={`touch-target px-3 py-1 rounded-lg font-bold transition-all ${
                  intakeMode === "describe"
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-content-muted hover:text-content-strong"
                }`}
              >
                Describe in Words
              </button>
            </div>
          </div>

          {intakeMode === "describe" ? (
            <div className="space-y-3 p-4 rounded-2xl bg-surface-elevated border border-border-subtle">
              <label className="text-xs font-bold text-content-strong flex items-center gap-1.5">
                <MessageSquareText className="h-4 w-4 text-brand-primary" />
                Describe your daily workflow:
              </label>
              <textarea
                rows={3}
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder="e.g. Full-stack developer with VS Code, Docker 6 containers, 30 Chrome tabs, and local 14B coding AI..."
                className="w-full p-3 rounded-xl bg-surface-card border border-border-subtle text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none"
              />
              <button
                type="button"
                onClick={handleParseNaturalText}
                className="touch-target px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>Extract Apps & Requirements</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {workloads.length === 0 && (
                <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-content-body">
                    No applications selected yet. Pick tools below or load an example:
                  </span>
                  <button
                    type="button"
                    onClick={() => setWorkloads(EXAMPLE_WORKLOAD)}
                    className="touch-target px-3.5 py-1.5 rounded-xl bg-surface-card hover:bg-surface-secondary border border-border-subtle font-semibold text-brand-primary text-xs shrink-0 shadow-sm transition-all"
                  >
                    + Load Full-Stack Example
                  </button>
                </div>
              )}

              <SoftwarePicker
                selectedWorkloads={workloads}
                onChange={setWorkloads}
                isSimultaneous={isSimultaneous}
                onSimultaneousChange={setIsSimultaneous}
              />
            </div>
          )}
        </div>

        {/* Step 2: Form Factor, Budget & Expanded Preferences */}
        <div className="space-y-6 pt-4 border-t border-border-subtle">
          <h2 className="text-base font-bold text-content-strong flex items-center gap-2 pb-2 border-b border-border-subtle">
            <Sliders className="h-5 w-5 text-brand-primary" />
            2. Hardware Preferences & Budget
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Form Factor */}
            <div>
              <label className="block text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
                Preferred Form Factor
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEVICE_TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreferences({ ...preferences, deviceType: item.id })}
                    className={`touch-target min-h-[44px] px-3 rounded-xl border text-xs font-semibold transition-all ${
                      preferences.deviceType === item.id
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                        : "border-border-subtle bg-surface-elevated text-content-body hover:text-content-strong hover:bg-surface-secondary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Operating System */}
            <div>
              <label className="block text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
                Preferred Operating System
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OS_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreferences({ ...preferences, preferredOs: item.id })}
                    className={`touch-target min-h-[44px] px-3 rounded-xl border text-xs font-semibold transition-all ${
                      preferences.preferredOs === item.id
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                        : "border-border-subtle bg-surface-elevated text-content-body hover:text-content-strong hover:bg-surface-secondary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget & Target Lifetime */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
                  Target Budget (Optional)
                </label>
                <div className="flex gap-2">
                  <select
                    value={budgetCurrency}
                    onChange={(e) => setBudgetCurrency(e.target.value as any)}
                    className="touch-target bg-surface-elevated border border-border-subtle rounded-xl px-2.5 text-xs text-content-strong font-mono focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="ILS">₪ ILS</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={budgetAmount}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setBudgetAmount("");
                        return;
                      }
                      const num = Number(val);
                      if (!isNaN(num) && num >= 0) {
                        setBudgetAmount(val);
                      }
                    }}
                    placeholder="e.g. 5000"
                    className="touch-target flex-1 bg-surface-elevated border border-border-subtle rounded-xl px-3 text-xs font-mono text-content-strong placeholder-content-muted focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-medium text-content-body">Target Lifetime:</label>
                <div className="flex gap-1">
                  {[2, 3, 4, 5].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setTargetLongevity(yr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        targetLongevity === yr
                          ? "bg-brand-primary text-white"
                          : "bg-surface-elevated text-content-muted hover:text-content-strong"
                      }`}
                    >
                      {yr}y
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleRecommend}
            disabled={loading || workloads.length === 0}
            className="touch-target min-h-[48px] px-8 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm sm:text-base rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Calculating target specification…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Calculate Target Specification</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* RESULTS SECTION */}
      {recommendation && (
        <div ref={resultRef} className="pt-6 space-y-8 animate-fade-in">
          {/* HERO SUMMARY: TARGET CONFIGURATION */}
          <div className="bg-surface-card p-6 sm:p-8 rounded-3xl border border-brand-primary/40 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border-subtle pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary block">
                  Target Hardware Specification
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-content-strong tracking-tight mt-0.5">
                  Target Specification for Selected Workloads
                </h2>
                <p className="text-xs sm:text-sm text-content-body mt-1">
                  Engineered to support {workloads.length} selected apps with reliable multitasking capacity.
                </p>
              </div>

              <Link
                href={`/check?${bestFitCheckParams}`}
                className="touch-target px-5 py-3 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
              >
                <Zap className="h-4 w-4" />
                <span>Evaluate in Compatibility Check</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Spec Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-border-subtle">
                <span className="text-[10px] text-content-muted uppercase font-bold block">Processor</span>
                <span className="text-sm font-bold text-content-strong block mt-0.5">
                  {recommendation.recommended.cpu.exampleModels[0] || recommendation.recommended.cpu.description}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-border-subtle">
                <span className="text-[10px] text-content-muted uppercase font-bold block">System RAM</span>
                <span className="text-sm font-bold text-brand-primary block mt-0.5">
                  {recommendation.recommended.ramGb} GB RAM
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-border-subtle">
                <span className="text-[10px] text-content-muted uppercase font-bold block">Graphics GPU</span>
                <span className="text-sm font-bold text-content-strong block mt-0.5">
                  {recommendation.recommended.gpu.exampleModels[0] || recommendation.recommended.gpu.description}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-border-subtle">
                <span className="text-[10px] text-content-muted uppercase font-bold block">Storage</span>
                <span className="text-sm font-bold text-content-strong block mt-0.5">
                  {recommendation.recommended.storage.description}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-status-success/10 border border-status-success/30 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-status-success shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-content-strong">Why this fits your profile: </span>
                <span className="text-content-body">{recommendation.recommended.tierDescription}</span>
              </div>
            </div>
          </div>

          {/* 3 Tier Cards: Entry, Best Fit, High Headroom */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
              Tier Comparison & Trade-offs
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RecommendationTierCard tier={recommendation.minimum} tierRole="entry" />
              <RecommendationTierCard tier={recommendation.recommended} tierRole="best_fit" isPopular />
              <RecommendationTierCard tier={recommendation.professional} tierRole="high_headroom" />
            </div>
          </div>

          {/* Collapsible Technical Sizing Rationale */}
          {recommendation.explanations.length > 0 && (
            <div className="bg-surface-card p-6 rounded-3xl border border-border-subtle shadow-sm space-y-4">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-sm font-bold text-content-strong">
                    How Did We Calculate This? (Decision Factors)
                  </h3>
                </div>
                {showTechnicalDetails ? (
                  <ChevronUp className="h-4 w-4 text-content-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-content-muted" />
                )}
              </button>

              {showTechnicalDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border-subtle">
                  {recommendation.explanations.map((exp, idx) => (
                    <div key={idx} className="p-4 bg-surface-elevated rounded-2xl border border-border-subtle space-y-2">
                      <h4 className="text-xs font-mono font-bold text-brand-primary">{exp.title}</h4>
                      <p className="text-xs text-content-body leading-relaxed">{exp.details}</p>
                      <ul className="text-[11px] text-content-muted space-y-1 list-disc pl-4 pt-1">
                        {exp.factors.map((f, fIdx) => (
                          <li key={fIdx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
