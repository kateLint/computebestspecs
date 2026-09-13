import Link from "next/link";
import {
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Bot,
  Database,
} from "lucide-react";
import { InteractiveProofDemo } from "@/components/InteractiveProofDemo";
import { PERSONAS_CATALOG } from "@/services/needs/personas-catalog";
import { HomeAnalyticsTracker } from "@/components/analytics/HomeAnalyticsTracker";

export const metadata = {
  title: "ComputeBestSpecs — Find the Right PC for Your Workload",
  description:
    "Check whether your current computer can handle your real apps and games, or find the right machine to buy based on your workload and budget.",
};

export default function HomePage() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16 animate-fade-in font-sans">
      <HomeAnalyticsTracker />
      {/* 1. Precision Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-border-subtle text-content-muted text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
          <span>Workload • Concurrency • Hardware • Decision</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-content-strong tracking-tight leading-tight">
          Find the right computer for what you actually do.
        </h1>

        <p className="text-content-body text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Check whether your current computer can handle your real apps and games, or find the right machine to buy based on your workload and budget.
        </p>

        {/* Primary Two Choices */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/check"
            className="touch-target w-full sm:w-auto px-7 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Cpu className="h-5 w-5" />
            <span>Check My Computer</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/recommend"
            className="touch-target w-full sm:w-auto px-7 py-3.5 bg-surface-card hover:bg-surface-elevated text-content-strong font-bold text-sm sm:text-base rounded-2xl border border-border-subtle shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Compass className="h-5 w-5 text-brand-primary" />
            <span>Find a Computer</span>
          </Link>
        </div>

        {/* Discoverable Secondary Entry */}
        <div className="pt-1">
          <Link
            href="/ai"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
          >
            <Bot className="h-4 w-4" />
            <span>Looking for Local AI & LLM Sizing? Calculate VRAM & Speed →</span>
          </Link>
        </div>
      </section>

      {/* 2. Clear 3-Path Intent Routing */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-content-strong">
            Choose what you want to do
          </h2>
          <p className="text-xs text-content-muted">
            Direct access to deterministic diagnostics, recommendation, and AI sizing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Path 1: CHECK COMPUTER */}
          <Link
            href="/check"
            className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated/40 transition-all flex flex-col justify-between space-y-3 group shadow-xs"
          >
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary font-mono block">
                1. Test Existing Setup
              </span>
              <h3 className="text-base font-bold text-content-strong group-hover:text-brand-primary transition-colors">
                Check My Computer
              </h3>
              <p className="text-xs text-content-body leading-relaxed">
                Test your CPU, GPU, RAM, and Storage against simultaneous apps, browser tabs, and background daemons.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary pt-1">
              <span>Run compatibility check</span>
              <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Path 2: FIND COMPUTER */}
          <Link
            href="/recommend"
            className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated/40 transition-all flex flex-col justify-between space-y-3 group shadow-xs"
          >
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary font-mono block">
                2. Purchase Guide
              </span>
              <h3 className="text-base font-bold text-content-strong group-hover:text-brand-primary transition-colors">
                Find a Computer
              </h3>
              <p className="text-xs text-content-body leading-relaxed">
                Get optimal laptop or desktop target specs tailored to your software stack, portability, and budget.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary pt-1">
              <span>Find recommended computers</span>
              <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Path 3: LOCAL AI */}
          <Link
            href="/ai"
            className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle hover:border-brand-primary/50 hover:bg-surface-elevated/40 transition-all flex flex-col justify-between space-y-3 group shadow-xs"
          >
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary font-mono block">
                3. Transformer Sizing
              </span>
              <h3 className="text-base font-bold text-content-strong group-hover:text-brand-primary transition-colors">
                Local AI & LLMs
              </h3>
              <p className="text-xs text-content-body leading-relaxed">
                Calculate VRAM requirements, KV cache scaling, quantization loss (FP16–Q2), and tokens/sec.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary pt-1">
              <span>Open Local AI engine</span>
              <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Interactive Product Proof Demo */}
      <section className="space-y-3">
        <div className="max-w-4xl mx-auto w-full">
          <InteractiveProofDemo />
        </div>
      </section>

      {/* 4. What Can ComputeBestSpecs Answer? (Decision Framework) */}
      <section
        id="section-framework"
        className="landing-section min-h-[calc(100dvh-5rem)] flex flex-col justify-center py-8 sm:py-12"
      >
        <div className="space-y-6 max-w-5xl mx-auto w-full">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase font-bold text-brand-primary font-mono tracking-wider">
              Decision Framework
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-content-strong">
              Six questions answered with deterministic clarity
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="surface-card p-5 rounded-2xl border border-border-subtle space-y-2">
              <div className="text-xs font-bold text-brand-primary font-mono">01 • Compatibility</div>
              <h4 className="text-base font-bold text-content-strong">Can it run?</h4>
              <p className="text-xs text-content-body leading-relaxed">
                Hard OS compatibility, ISA instructions, hypervisor support, and hardware API baselines.
              </p>
            </div>

            <div className="surface-card p-5 rounded-2xl border border-border-subtle space-y-2">
              <div className="text-xs font-bold text-brand-primary font-mono">02 • Performance</div>
              <h4 className="text-base font-bold text-content-strong">Will it run well?</h4>
              <p className="text-xs text-content-body leading-relaxed">
                Real performance tiers under concurrent multitasking load, not theoretical single-app idle states.
              </p>
            </div>

            <div className="surface-card p-5 rounded-2xl border border-border-subtle space-y-2">
              <div className="text-xs font-bold text-brand-primary font-mono">03 • Holistic Fit</div>
              <h4 className="text-base font-bold text-content-strong">Is it right for me?</h4>
              <p className="text-xs text-content-body leading-relaxed">
                Tailored fit based on how many hours you work, multitasking intensity, and battery/noise needs.
              </p>
            </div>

            <div className="surface-card p-5 rounded-2xl border border-border-subtle space-y-2">
              <div className="text-xs font-bold text-brand-primary font-mono">04 • Upgrades</div>
              <h4 className="text-base font-bold text-content-strong">What should I upgrade?</h4>
              <p className="text-xs text-content-body leading-relaxed">
                Identify the exact primary bottleneck (RAM, VRAM, GPU, CPU, Storage) and simulate score improvements.
              </p>
            </div>

            <div className="surface-card p-5 rounded-2xl border border-border-subtle space-y-2">
              <div className="text-xs font-bold text-brand-primary font-mono">05 • Purchasing</div>
              <h4 className="text-base font-bold text-content-strong">What should I buy?</h4>
              <p className="text-xs text-content-body leading-relaxed">
                Get concrete hardware configurations matched to your software needs within your target budget.
              </p>
            </div>

            <div className="surface-card p-5 rounded-2xl border border-border-subtle space-y-2">
              <div className="text-xs font-bold text-brand-primary font-mono">06 • Local AI</div>
              <h4 className="text-base font-bold text-content-strong">Can it run local AI?</h4>
              <p className="text-xs text-content-body leading-relaxed">
                Model quantization limits, context window memory pressure, and subagent concurrency thresholds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Start with Your Workload (Workload Presets) */}
      <section
        id="section-presets"
        className="landing-section min-h-[calc(100dvh-5rem)] flex flex-col justify-center py-8 sm:py-12"
      >
        <div className="surface-card p-6 sm:p-8 rounded-3xl border border-border-subtle space-y-6 shadow-sm max-w-5xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border-subtle">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-primary">
                Workload Presets
              </span>
              <h3 className="text-xl font-bold text-content-strong">
                Start with a common setup
              </h3>
              <p className="text-xs text-content-body mt-0.5">
                Jump straight into holistic evaluation with curated multi-app stacks.
              </p>
            </div>
            <Link
              href="/fit"
              className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Launch Fit Engine</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {PERSONAS_CATALOG.slice(0, 3).map((persona) => (
              <div
                key={persona.id}
                className="p-5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-surface-card border border-border-subtle text-content-muted font-bold font-mono">
                    {persona.category}
                  </span>
                  <h4 className="font-bold text-content-strong text-sm">{persona.title}</h4>
                  <p className="text-[11px] text-content-body leading-relaxed">
                    {persona.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px]">
                  <span className="text-content-muted">
                    Starting Point: <strong className="text-content-strong font-mono">{persona.recommendedHardwareBaseline.minRamGb}GB RAM</strong>
                  </span>
                  <Link
                    href="/fit"
                    className="font-bold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <span>Evaluate</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Why Trust the Result? (Trust Layer) */}
      <section
        id="section-trust"
        className="landing-section min-h-[calc(100dvh-5rem)] flex flex-col justify-center py-8 sm:py-12"
      >
        <div className="surface-card p-6 sm:p-8 rounded-3xl border border-border-subtle space-y-6 shadow-sm max-w-5xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                <ShieldCheck className="h-4 w-4" />
                <span>Evidence & Verification Standard</span>
              </div>
              <h3 className="text-xl font-bold text-content-strong">Why trust ComputeBestSpecs?</h3>
            </div>
            <Link
              href="/software"
              className="touch-target px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated text-content-strong border border-border-subtle text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Database className="h-3.5 w-3.5 text-brand-primary" />
              <span>Browse Requirements Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="h-4 w-4" />
                <span>Official Sources</span>
              </div>
              <p className="text-content-body text-[11px] leading-relaxed">
                Every vendor requirement is verified against official documentation with recorded citations.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="h-4 w-4" />
                <span>Deterministic Engine</span>
              </div>
              <p className="text-content-body text-[11px] leading-relaxed">
                Evaluations are calculated by reproducible algorithms, not opaque AI guesses or marketing scores.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="h-4 w-4" />
                <span>Real Workload Modeling</span>
              </div>
              <p className="text-content-body text-[11px] leading-relaxed">
                We model background daemons, emulator memory, browser tab bloat, and peak compilation bursts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="h-4 w-4" />
                <span>Transparent Confidence</span>
              </div>
              <p className="text-content-body text-[11px] leading-relaxed">
                Every evaluation clearly displays a confidence score derived from requirement freshness and hardware accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Conversion Banner */}
      <section
        id="section-cta"
        className="landing-section min-h-[calc(100dvh-5rem)] flex flex-col justify-center py-8 sm:py-12"
      >
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-brand-primary/10 via-surface-card to-brand-cyan/10 border border-brand-primary/20 text-center space-y-6 max-w-4xl mx-auto shadow-md w-full">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-content-strong">
              Know what your computer can actually handle.
            </h2>
            <p className="text-xs sm:text-sm text-content-body">
              No account required. Run an instant, source-backed compatibility and workload sizing check.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/check"
              className="touch-target px-8 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-[var(--on-brand)] font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              <span>Start a Free Check</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/recommend"
              className="touch-target px-6 py-3.5 bg-surface-card hover:bg-surface-elevated text-content-strong border border-border-subtle font-bold text-sm rounded-xl transition-all"
            >
              <span>Recommend a PC</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

