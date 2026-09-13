/**
 * Canonical Result Presenter
 * Converts pure CompatibilityResult into a clean, display-ready ViewModel for UI components.
 * React components consume this ViewModel rather than implementing ad-hoc score thresholds or string concatenation.
 */

import { CompatibilityResult, Bottleneck, UpgradeRecommendation } from "../../domain/compatibility";

export type HeroVerdict = "GOOD_FIT" | "ACCEPTABLE_FIT" | "BORDERLINE_FIT" | "INCOMPATIBLE" | "UNKNOWN";

export interface HeroPresentation {
  verdict: HeroVerdict;
  headlineCode: string;
  headlineText: string;
  summaryText: string;
  score: number;
  confidencePercent: number;
  badgeClass: string;
}

export interface BottleneckCardViewModel {
  component: string;
  severity: "low" | "medium" | "high" | "critical";
  headline: string;
  description: string;
  mitigationText?: string;
  isPrimary: boolean;
}

export interface CompatibilityResultViewModel {
  hero: HeroPresentation;
  primaryBottleneck?: BottleneckCardViewModel;
  bottlenecks: BottleneckCardViewModel[];
  topRecommendation?: UpgradeRecommendation;
  recommendations: UpgradeRecommendation[];
  concurrencySummary: {
    typicalGb: number;
    peakGb: number;
    isPagingLikely: boolean;
    activeWorkloadCount: number;
  };
  provenanceSummary: {
    engineVersion: string;
    policyVersion: string;
    datasetVersion: string;
    fingerprint: string;
    evaluatedAt: string;
  };
}

export function presentEvaluationResult(result: CompatibilityResult): CompatibilityResultViewModel {
  let verdict: HeroVerdict = "GOOD_FIT";
  let headlineCode = "HERO_GOOD_FIT";
  let headlineText = "Good Fit for Your Workload";
  let summaryText = "This machine comfortably handles your requested workloads with adequate headroom.";
  let badgeClass = "text-[var(--status-success)] bg-[var(--status-success-bg)] border-[var(--status-success-border)]";

  if (result.isHardIncompatible || result.compatibilityStatus === "incompatible") {
    verdict = "INCOMPATIBLE";
    headlineCode = "HERO_INCOMPATIBLE";
    headlineText = "Hardware or Platform Incompatible";
    summaryText = "One or more selected applications cannot run due to hard architectural or platform incompatibilities.";
    badgeClass = "text-[var(--status-danger)] bg-[var(--status-danger-bg)] border-[var(--status-danger-border)]";
  } else if (result.score < 50 || result.performanceTier === "poor") {
    verdict = "BORDERLINE_FIT";
    headlineCode = "HERO_BORDERLINE";
    headlineText = "Borderline / Severe Performance Degradation";
    summaryText = "This setup experiences severe memory or compute bottlenecks under simultaneous usage.";
    badgeClass = "text-[var(--status-warning)] bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]";
  } else if (result.score < 70 || result.performanceTier === "usable" || result.performanceTier === "minimum") {
    verdict = "ACCEPTABLE_FIT";
    headlineCode = "HERO_ACCEPTABLE";
    headlineText = "Acceptable with Performance Caveats";
    summaryText = "Workloads will run, but multitasking pressure may cause occasional slowdowns or swap paging.";
    badgeClass = "text-[var(--status-warning)] bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]";
  }

  const bottlenecks: BottleneckCardViewModel[] = (result.bottlenecks || []).map((b, index) => ({
    component: b.component,
    severity: b.severity,
    headline: b.reason,
    description: b.mitigation || b.reason,
    mitigationText: b.mitigation,
    isPrimary: index === 0,
  }));

  const confidenceValue = typeof result.confidence === "number" ? result.confidence : 70;

  return {
    hero: {
      verdict,
      headlineCode,
      headlineText,
      summaryText,
      score: result.score,
      confidencePercent: confidenceValue,
      badgeClass,
    },
    primaryBottleneck: bottlenecks[0],
    bottlenecks,
    topRecommendation: result.upgradeRecommendations?.[0],
    recommendations: result.upgradeRecommendations || [],
    concurrencySummary: {
      typicalGb: result.concurrencyMetrics.steadyStateRamGb,
      peakGb: result.concurrencyMetrics.peakConcurrentRamGb,
      isPagingLikely: result.concurrencyMetrics.isSwappingLikely,
      activeWorkloadCount: result.concurrencyMetrics.activeWorkloadCount,
    },
    provenanceSummary: {
      engineVersion: result.meta?.engineVersion || "1.0.0",
      policyVersion: result.meta?.policyVersion || "2026.1",
      datasetVersion: result.meta?.benchmarkDatasetVersion || "2026.1",
      fingerprint: result.meta?.evaluationFingerprint || "verified",
      evaluatedAt: result.meta?.evaluatedAt || new Date().toISOString(),
    },
  };
}
