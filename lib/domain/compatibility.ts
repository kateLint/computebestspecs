import { HardwareProfile, StorageDevice } from "./hardware";
import { SelectedWorkload, DataQualityStatus } from "./software";
import { FieldUncertainty, UncertaintyState } from "./common";

export type { FieldUncertainty, UncertaintyState };
export type ScenarioMode = "LIGHT" | "TYPICAL" | "HEAVY" | "PEAK";

export type HardCompatibilityStatus = "compatible" | "incompatible" | "unknown";

export type PerformanceTier =
  | "poor"
  | "minimum"
  | "usable"
  | "recommended"
  | "excellent";

export type ThreeValuedStatus = "PASS" | "FAIL" | "UNKNOWN";

export type ReasonSeverity = "info" | "warning" | "critical";

export interface EvaluationReason {
  code: string;
  severity: ReasonSeverity;
  messageKey: string;
  parameters: Record<string, string | number | boolean>;
}

export type BottleneckComponent =
  | "cpu"
  | "memory"
  | "gpu"
  | "vram"
  | "storage"
  | "os"
  | "virtualization"
  | "hardware_api"
  | "software_conflict";

export interface Bottleneck {
  component: BottleneckComponent;
  severity: "low" | "medium" | "high" | "critical";
  messageKey: string;
  reason: string;
  mitigation?: string;
  parameters: Record<string, string | number | boolean>;
}

export interface UpgradeSensitivityDelta {
  upgradeTarget: string;
  scoreBefore: number;
  scoreAfter: number;
  deltaScore: number;
  clearsPrimaryBottleneck: boolean;
}

export interface CalculationTrace {
  step: string;
  inputs: Record<string, unknown>;
  output: Record<string, unknown>;
  ruleIds: string[];
}

export interface UpgradeFeasibility {
  possible: boolean;
  confidence: number;
  constraints: string[];
}

export interface UpgradeRecommendation {
  component: BottleneckComponent;
  from: string;
  to: string;
  impact: "low" | "medium" | "high" | "critical";
  feasibility: "direct_upgrade" | "non_upgradeable" | "external_only" | "full_system_recommended";
  feasibilityDetails?: UpgradeFeasibility;
  reasonKey: string;
  reasonText: string;
  priority: number;
  simulationDelta?: UpgradeSensitivityDelta;
}

export interface ComponentEvaluation {
  status: ThreeValuedStatus;
  performanceTier?: PerformanceTier;
  score: number; // 0-100
  confidence: number; // 0-100
  actualValue?: string | number;
  requiredValue?: string | number;
  recommendedValue?: string | number;
  reasons: EvaluationReason[];
}

export interface PerAppEvaluation {
  softwareId: string;
  softwareName: string;
  version: string;
  compatibilityStatus: HardCompatibilityStatus;
  performanceTier: PerformanceTier;
  score: number;
  isHardIncompatible: boolean;
  hardIncompatibilityReasons: string[];
  requirementProvenance: {
    dataQuality: DataQualityStatus;
    sourcePublisher?: string;
    sourceUrl?: string;
    retrievedAt?: string;
    isFresh: boolean;
  };
}

export type CompatibilityStatus = HardCompatibilityStatus;

export interface ConcurrencyMetrics {
  steadyStateRamGb: number;
  peakConcurrentRamGb: number;
  totalEstimatedRamUsageGb: number;
  safetyHeadroomGb: number;
  osBackgroundReserveGb: number;
  effectiveRequiredRamGb: number;
  ramPressureRatio: number;
  isSwappingLikely: boolean;
  activeWorkloadCount: number;
  isSimultaneous: boolean;
}

export interface CompatibilityResult {
  compatibilityStatus: HardCompatibilityStatus;
  compatibility?: HardCompatibilityStatus; // Canonical alias
  performanceTier: PerformanceTier;
  performance?: PerformanceTier;           // Canonical alias
  workloadFit?: PerformanceTier;           // Canonical alias
  score: number; // 0-100 normalized bottleneck-aware score
  overallScore?: number;                   // Canonical alias
  baseScore: number;
  criticalPenalty: number;
  confidence: number; // 0-100
  uncertainty?: FieldUncertainty;
  scenarioMode?: ScenarioMode;
  isHardIncompatible: boolean;

  components: {
    cpu: ComponentEvaluation;
    memory: ComponentEvaluation;
    gpu: ComponentEvaluation;
    vram: ComponentEvaluation;
    storage: ComponentEvaluation;
    os: ComponentEvaluation;
  };
  componentEvaluations?: {
    cpu: ComponentEvaluation;
    memory: ComponentEvaluation;
    gpu: ComponentEvaluation;
    vram: ComponentEvaluation;
    storage: ComponentEvaluation;
    os: ComponentEvaluation;
  };

  perAppEvaluations: PerAppEvaluation[];
  concurrencyMetrics: ConcurrencyMetrics;
  bottlenecks: Bottleneck[];
  primaryBottleneck?: Bottleneck;          // Canonical alias
  upgradeRecommendations: UpgradeRecommendation[];
  recommendations?: UpgradeRecommendation[]; // Canonical alias
  explanations: EvaluationReason[];
  assumptions: string[];
  caveats: string[];

  meta: {
    engineVersion: string;
    policyVersion: string;
    benchmarkDatasetVersion: string;
    normalizationAlgorithmVersion: string;
    evaluationFingerprint: string;
    evaluatedAt: string;
    isVerifiedHardware: boolean;
    calculationTrace?: any;
  };
}

export interface EvaluationSnapshot {
  id: string;
  publicId: string;
  hardwareProfile: HardwareProfile;
  selectedWorkloads: SelectedWorkload[];
  result: CompatibilityResult;
  engineVersion: string;
  benchmarkDatasetVersion: string;
  normalizationAlgorithmVersion: string;
  createdAt: string;
}
