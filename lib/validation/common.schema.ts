import { z } from "zod";

export const KnowledgeStateSchema = z.enum([
  "KNOWN",
  "UNKNOWN",
  "CONFLICTING",
  "STALE",
  "INSUFFICIENT",
]);

export const UncertaintyStateSchema = z.enum([
  "KNOWN",
  "ESTIMATED",
  "UNKNOWN",
  "CONFLICTING",
]);

export const ScenarioModeSchema = z.enum([
  "LIGHT",
  "TYPICAL",
  "HEAVY",
  "PEAK",
]);

export const FieldUncertaintySchema = z.object({
  compatibility: UncertaintyStateSchema,
  performance: UncertaintyStateSchema,
  workloadFit: UncertaintyStateSchema,
  bottlenecks: UncertaintyStateSchema,
  recommendations: UncertaintyStateSchema,
  components: z.object({
    cpu: UncertaintyStateSchema,
    gpu: UncertaintyStateSchema,
    memory: UncertaintyStateSchema,
    storage: UncertaintyStateSchema,
    os: UncertaintyStateSchema,
    virtualization: UncertaintyStateSchema.optional(),
  }),
});

export const ConfidenceLevelSchema = z.enum([
  "HIGH",
  "MEDIUM",
  "LOW",
  "INSUFFICIENT",
]);

export const ConfidenceSchema = z.object({
  level: ConfidenceLevelSchema,
  score: z.number().min(0).max(100).optional(),
  reasons: z.array(z.string()).default([]),
});

export const EvidenceKindSchema = z.enum([
  "OFFICIAL_REQUIREMENT",
  "BENCHMARK",
  "WORKLOAD_ESTIMATE",
  "MEASURED",
  "INFERRED",
]);

export const EvidenceSchema = z.object({
  kind: EvidenceKindSchema,
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  retrievedAt: z.string().optional(),
  verifiedAt: z.string().optional(),
  confidence: ConfidenceLevelSchema,
});

export const ResourceVectorSchema = z.object({
  cpu: z.number().min(0).max(100).optional(),
  cpuSingleThread: z.number().min(0).max(100).optional(),
  ramGb: z.number().min(0).max(4096).optional(),
  gpu: z.number().min(0).max(100).optional(),
  vramGb: z.number().min(0).max(512).optional(),
  storageGb: z.number().min(0).max(100000).optional(),
  tempStorageGb: z.number().min(0).max(100000).optional(),
  diskReadMBps: z.number().min(0).optional(),
  diskWriteMBps: z.number().min(0).optional(),
  networkMbps: z.number().min(0).optional(),
});

export const ResourceDemandSchema = z.object({
  idle: ResourceVectorSchema,
  typical: ResourceVectorSchema,
  peak: ResourceVectorSchema,
  confidence: ConfidenceSchema,
  evidence: z.array(EvidenceSchema).default([]),
});
