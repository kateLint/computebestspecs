import { z } from "zod";
import { ConfidenceSchema, FieldUncertaintySchema, ScenarioModeSchema } from "./common.schema";

export const CompatibilityStatusSchema = z.enum([
  "SUPPORTED",
  "TECHNICALLY_POSSIBLE",
  "UNSUPPORTED_BY_VENDOR",
  "INCOMPATIBLE",
  "UNKNOWN",
  // Legacy aliases
  "compatible",
  "incompatible",
  "unknown",
]);

export const PerformanceTierSchema = z.enum([
  "EXCELLENT",
  "GOOD",
  "ACCEPTABLE",
  "BORDERLINE",
  "POOR",
  "UNKNOWN",
  // Legacy aliases
  "excellent",
  "recommended",
  "usable",
  "minimum",
  "poor",
]);

export const BottleneckComponentSchema = z.enum([
  "cpu",
  "memory",
  "gpu",
  "vram",
  "storage",
  "os",
  "virtualization",
  "hardware_api",
  "software_conflict",
  "none",
]);

export const BottleneckSchema = z.object({
  component: BottleneckComponentSchema,
  resource: z.enum(["CPU", "RAM", "GPU", "VRAM", "STORAGE", "PLATFORM", "API", "NONE"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  messageKey: z.string(),
  reason: z.string(),
  mitigation: z.string().optional(),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const EvaluationReasonSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  messageKey: z.string(),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const ComponentEvaluationSchema = z.object({
  status: z.enum(["PASS", "FAIL", "UNKNOWN"]),
  performanceTier: PerformanceTierSchema.optional(),
  score: z.number().min(0).max(100),
  confidence: z.union([z.number().min(0).max(100), ConfidenceSchema]).default(70),
  actualValue: z.union([z.string(), z.number()]).optional(),
  requiredValue: z.union([z.string(), z.number()]).optional(),
  recommendedValue: z.union([z.string(), z.number()]).optional(),
  reasons: z.array(EvaluationReasonSchema).default([]),
});

export const StorageEvaluationSchema = ComponentEvaluationSchema.extend({
  totalRequiredGb: z.number().min(0).default(0),
  scratchSpaceRequiredGb: z.number().min(0).default(0),
  driveTypeAdequate: z.boolean().default(true),
});

export const UpgradeRecommendationSchema = z.object({
  component: BottleneckComponentSchema,
  type: z.enum(["MEMORY_UPGRADE", "GPU_UPGRADE", "STORAGE_UPGRADE", "CPU_UPGRADE", "PLATFORM_UPGRADE"]).optional(),
  from: z.string(),
  to: z.string(),
  impact: z.enum(["low", "medium", "high", "critical"]),
  feasibility: z.enum(["direct_upgrade", "non_upgradeable", "external_only", "full_system_recommended"]),
  reasonKey: z.string(),
  reasonText: z.string(),
  priority: z.number().int(),
  simulationDelta: z
    .object({
      upgradeTarget: z.string(),
      scoreBefore: z.number(),
      scoreAfter: z.number(),
      deltaScore: z.number(),
      clearsPrimaryBottleneck: z.boolean(),
    })
    .optional(),
});

export const ConcurrencyMetricsSchema = z.object({
  steadyStateRamGb: z.number().min(0),
  peakConcurrentRamGb: z.number().min(0),
  totalEstimatedRamUsageGb: z.number().min(0),
  safetyHeadroomGb: z.number().min(0),
  osBackgroundReserveGb: z.number().min(0),
  memoryPressureRatio: z.number().min(0).default(0),
  swapLikelihood: z.enum(["NONE", "LOW", "MODERATE", "HIGH", "SEVERE"]).default("LOW"),
});

export const PerAppEvaluationSchema = z.object({
  softwareId: z.string(),
  softwareName: z.string(),
  version: z.string(),
  compatibilityStatus: CompatibilityStatusSchema,
  performanceTier: PerformanceTierSchema,
  score: z.number().min(0).max(100),
  isHardIncompatible: z.boolean().default(false),
  hardIncompatibilityReasons: z.array(z.string()).default([]),
  requirementProvenance: z
    .object({
      dataQuality: z.string(),
      sourcePublisher: z.string().optional(),
      sourceUrl: z.string().optional(),
      retrievedAt: z.string().optional(),
      isFresh: z.boolean(),
    })
    .optional(),
});

export const CompatibilityResultSchema = z.object({
  compatibility: CompatibilityStatusSchema,
  performance: PerformanceTierSchema,
  workloadFit: z.union([PerformanceTierSchema, z.object({ tier: PerformanceTierSchema, score: z.number() })]),
  overallScore: z.number().min(0).max(100),
  confidence: z.union([z.number().min(0).max(100), ConfidenceSchema]),
  uncertainty: FieldUncertaintySchema.optional(),
  scenarioMode: ScenarioModeSchema.optional(),
  primaryBottleneck: BottleneckSchema.optional(),
  bottlenecks: z.array(BottleneckSchema).optional(),
  componentEvaluations: z.object({
    cpu: ComponentEvaluationSchema,
    gpu: ComponentEvaluationSchema,
    memory: ComponentEvaluationSchema,
    storage: StorageEvaluationSchema,
    os: ComponentEvaluationSchema,
  }),
  perAppEvaluations: z.array(PerAppEvaluationSchema),
  concurrencyMetrics: ConcurrencyMetricsSchema,
  recommendations: z.array(UpgradeRecommendationSchema).default([]),
  evidence: z.array(z.any()).optional(),
  engineVersion: z.string().default("1.0.0"),
  policyVersion: z.string().default("2026.1"),
  requirementsDatasetVersion: z.string().default("2026.1"),
  benchmarkDatasetVersion: z.string().default("2026.1"),
  evaluatedAt: z.string().default(() => new Date().toISOString()),
});
