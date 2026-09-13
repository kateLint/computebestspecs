/**
 * Canonical Evaluation, Compatibility & Performance Domain Contracts
 */

import { Confidence, Evidence, FieldUncertainty, UncertaintyState } from "./common";
import { EvaluationVersions } from "./versions";

export type ScenarioMode = "LIGHT" | "TYPICAL" | "HEAVY" | "PEAK";

/**
 * 1. Compatibility Status: Absolute functional and vendor viability
 */
export type CompatibilityStatus =
  | "SUPPORTED"
  | "TECHNICALLY_POSSIBLE"
  | "UNSUPPORTED_BY_VENDOR"
  | "INCOMPATIBLE"
  | "UNKNOWN";

/**
 * 2. Performance Tier: Real-world speed and responsiveness
 */
export type PerformanceTier =
  | "EXCELLENT"
  | "GOOD"
  | "ACCEPTABLE"
  | "BORDERLINE"
  | "POOR"
  | "UNKNOWN";

export type ThreeValuedStatus = "PASS" | "FAIL" | "UNKNOWN";

export type BottleneckComponent =
  | "cpu"
  | "memory"
  | "gpu"
  | "vram"
  | "storage"
  | "os"
  | "virtualization"
  | "hardware_api"
  | "software_conflict"
  | "none";

export interface Bottleneck {
  component: BottleneckComponent;
  resource?: "CPU" | "RAM" | "GPU" | "VRAM" | "STORAGE" | "PLATFORM" | "API" | "NONE";
  severity: "low" | "medium" | "high" | "critical";
  messageKey: string;
  reason: string;
  mitigation?: string;
  parameters: Record<string, string | number | boolean>;
}

export interface EvaluationReason {
  code: string;
  severity: "info" | "warning" | "critical";
  messageKey: string;
  parameters: Record<string, string | number | boolean>;
}

export interface ComponentEvaluation {
  status: ThreeValuedStatus;
  performanceTier?: PerformanceTier;
  score: number; // 0-100
  confidence: number | Confidence; // 0-100 or structured Confidence
  actualValue?: string | number;
  requiredValue?: string | number;
  recommendedValue?: string | number;
  reasons: EvaluationReason[];
}

export interface UpgradeSensitivityDelta {
  upgradeTarget: string;
  scoreBefore: number;
  scoreAfter: number;
  deltaScore: number;
  clearsPrimaryBottleneck: boolean;
}

export interface UpgradeRecommendation {
  component: BottleneckComponent;
  type?: "MEMORY_UPGRADE" | "GPU_UPGRADE" | "STORAGE_UPGRADE" | "CPU_UPGRADE" | "PLATFORM_UPGRADE";
  from: string;
  to: string;
  impact: "low" | "medium" | "high" | "critical";
  feasibility: "direct_upgrade" | "non_upgradeable" | "external_only" | "full_system_recommended";
  reasonKey: string;
  reasonText: string;
  priority: number;
  simulationDelta?: UpgradeSensitivityDelta;
}

export interface ConcurrencyMetrics {
  steadyStateRamGb: number;
  peakConcurrentRamGb: number;
  totalEstimatedRamUsageGb: number;
  safetyHeadroomGb: number;
  osBackgroundReserveGb: number;
  memoryPressureRatio: number;
  swapLikelihood: "NONE" | "LOW" | "MODERATE" | "HIGH" | "SEVERE";
}

export interface PerAppEvaluation {
  softwareId: string;
  softwareName: string;
  version: string;
  compatibilityStatus: CompatibilityStatus | "compatible" | "incompatible" | "unknown";
  performanceTier: PerformanceTier | "poor" | "minimum" | "usable" | "recommended" | "excellent";
  score: number;
  isHardIncompatible: boolean;
  hardIncompatibilityReasons: string[];
  requirementProvenance?: {
    dataQuality: string;
    sourcePublisher?: string;
    sourceUrl?: string;
    retrievedAt?: string;
    isFresh: boolean;
  };
}

/**
 * The Canonical Evaluation Output Contract
 */
export interface CompatibilityResult {
  compatibility: CompatibilityStatus | "compatible" | "incompatible" | "unknown";
  performance: PerformanceTier | "poor" | "minimum" | "usable" | "recommended" | "excellent";
  workloadFit: PerformanceTier | { tier: PerformanceTier; score: number } | "poor" | "minimum" | "usable" | "recommended" | "excellent";
  
  overallScore: number; // 0-100
  confidence: Confidence | number; // structured or legacy numeric
  uncertainty?: FieldUncertainty;
  scenarioMode?: ScenarioMode;
  
  primaryBottleneck?: Bottleneck;
  bottlenecks?: Bottleneck[];
  
  componentEvaluations: {
    cpu: ComponentEvaluation;
    gpu: ComponentEvaluation;
    memory: ComponentEvaluation;
    storage: StorageEvaluation;
    os: ComponentEvaluation;
  };
  
  perAppEvaluations: PerAppEvaluation[];
  concurrencyMetrics: ConcurrencyMetrics;
  recommendations: UpgradeRecommendation[];
  
  evidence?: Evidence[];
  
  engineVersion: string;
  policyVersion: string;
  requirementsDatasetVersion: string;
  benchmarkDatasetVersion: string;
  
  evaluatedAt: string;
}

export interface StorageEvaluation extends ComponentEvaluation {
  totalRequiredGb: number;
  scratchSpaceRequiredGb: number;
  driveTypeAdequate: boolean;
}
