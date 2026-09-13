import { z } from "zod";

export const CpuSelectionSchema = z.object({
  catalogCpuId: z.string().optional(),
  model: z.string().min(1, "CPU model is required").max(100),
  manufacturer: z.enum(["Intel", "AMD", "Apple", "Qualcomm", "Other"]).optional(),
  architecture: z.enum(["x86_64", "arm64", "other"]).default("x86_64"),
  physicalCores: z.number().int().positive().max(256).optional(),
  threads: z.number().int().positive().max(512).optional(),
  performanceScore: z.number().min(0).max(100).optional(),
  laptopVariant: z.boolean().optional(),
  isVerified: z.boolean().optional().default(true),
});

export const GpuSelectionSchema = z.object({
  catalogGpuId: z.string().optional(),
  model: z.string().min(1, "GPU model is required").max(100),
  manufacturer: z.enum(["NVIDIA", "AMD", "Intel", "Apple", "Qualcomm", "Other"]).optional(),
  type: z.enum(["integrated", "dedicated", "unified"]).default("dedicated"),
  performanceScore: z.number().min(0).max(100).optional(),
  vramGb: z.number().min(0).max(128).optional(),
  supportsCuda: z.boolean().optional(),
  supportsMetal: z.boolean().optional(),
  supportsVulkan: z.boolean().optional(),
  supportsDirectX12: z.boolean().optional(),
  laptopVariant: z.boolean().optional(),
  isVerified: z.boolean().optional().default(true),
});

export const MemoryConfigurationSchema = z.object({
  totalGb: z.number().positive("RAM must be greater than zero").max(2048, "RAM exceeds realistic limit"),
  type: z.enum(["DDR4", "DDR5", "LPDDR4X", "LPDDR5", "LPDDR5X", "Unified", "Other"]).optional(),
  channels: z.number().int().positive().max(8).optional(),
  speedMts: z.number().int().positive().max(15000).optional(),
  soldered: z.boolean().optional(),
  upgradeable: z.boolean().optional(),
});

export const StorageDeviceSchema = z.object({
  type: z.enum(["HDD", "SATA_SSD", "NVME_SSD", "UNKNOWN"]).default("NVME_SSD"),
  totalGb: z.number().positive("Total storage must be positive").max(100000),
  freeGb: z.number().min(0).max(100000).optional(),
  isSystemDrive: z.boolean().optional().default(true),
});

export const OsRequirementSchema = z.object({
  family: z.enum(["windows", "macos", "linux"]),
  minVersion: z.string().optional(),
  supportedArchitectures: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const HardwareRequirementsSchema = z.object({
  cpu: z
    .object({
      minPerformanceScore: z.number().optional(),
      minPhysicalCores: z.number().optional(),
      minThreads: z.number().optional(),
      architectures: z.array(z.string()).optional(),
      avx2Required: z.boolean().optional(),
      avx512Required: z.boolean().optional(),
      description: z.string().optional(),
    })
    .optional(),
  gpu: z
    .object({
      type: z.enum(["integrated", "dedicated", "unified", "any"]).optional(),
      minPerformanceScore: z.number().optional(),
      minVramGb: z.number().optional(),
      recommendedVramGb: z.number().optional(),
      directX12Required: z.boolean().optional(),
      metalRequired: z.boolean().optional(),
      cudaRequired: z.boolean().optional(),
      vulkanRequired: z.boolean().optional(),
      openGlVersion: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  minimumRamGb: z.number().optional(),
  recommendedRamGb: z.number().optional(),
  professionalRamGb: z.number().optional(),
  storage: z
    .object({
      installGb: z.number().optional(),
      scratchDiskGb: z.number().optional(),
      preferredType: z.enum(["HDD", "SATA_SSD", "NVME_SSD", "UNKNOWN"]).optional(),
      notes: z.string().optional(),
    })
    .optional(),
  operatingSystems: z.array(OsRequirementSchema).optional(),
  requiresVirtualization: z.boolean().optional(),
  architectures: z.array(z.string()).optional(),
  dependencies: z.array(z.any()).optional(),
  conflicts: z.array(z.any()).optional(),
  additionalRequirements: z.array(z.string()).optional(),
});


export const OperatingSystemSchema = z.object({
  family: z.enum(["windows", "macos", "linux"]),
  version: z.string().max(50).optional(),
  build: z.string().max(50).optional(),
  architecture: z.enum(["x86_64", "arm64"]).default("x86_64"),
});

export const HardwareUpgradeFeasibilitySchema = z.object({
  isRamUpgradeable: z.boolean().optional(),
  isGpuUpgradeable: z.boolean().optional(),
  isStorageUpgradeable: z.boolean().optional(),
  maxSupportedRamGb: z.number().optional(),
  ramSlotsTotal: z.number().optional(),
  ramSlotsFree: z.number().optional(),
  notes: z.array(z.string()).optional(),
});

export const HardwareProfileSchema = z.object({
  cpu: CpuSelectionSchema,
  gpu: GpuSelectionSchema.optional(),
  ram: MemoryConfigurationSchema,
  storage: z.array(StorageDeviceSchema).min(1, "At least one storage drive is required").max(10),
  os: OperatingSystemSchema,
  architecture: z.enum(["x86_64", "arm64", "other"]).default("x86_64"),
  deviceType: z.enum(["desktop", "laptop", "mini-pc", "workstation"]).default("desktop"),
  supportsVirtualization: z.boolean().optional().default(true),
  isVirtualizationEnabled: z.boolean().optional().default(true),
  upgradeFeasibility: HardwareUpgradeFeasibilitySchema.optional(),
});

export const SelectedWorkloadSchema = z.object({
  softwareId: z.string().min(1),
  softwareName: z.string().min(1),
  softwareVersionId: z.string().min(1),
  versionString: z.string().default("Latest"),
  workloadId: z.string().min(1),
  workloadName: z.string().min(1),
  intensity: z.enum(["light", "medium", "heavy", "professional"]).default("medium"),
  concurrency: z.enum(["foreground", "background", "occasional"]).default("foreground"),
  quantity: z.number().int().positive().max(20).optional().default(1),
});

export const CompatibilityEvaluationRequestSchema = z.object({
  hardware: HardwareProfileSchema,
  workloads: z.array(SelectedWorkloadSchema).min(1, "Select at least one software application").max(30),
  isSimultaneous: z.boolean().optional().default(true),
});

export const EvaluationReasonSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  messageKey: z.string(),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const BottleneckSchema = z.object({
  component: z.enum([
    "cpu",
    "memory",
    "gpu",
    "vram",
    "storage",
    "os",
    "virtualization",
    "hardware_api",
    "software_conflict",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  messageKey: z.string(),
  reason: z.string(),
  mitigation: z.string().optional(),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
});

export const UpgradeRecommendationSchema = z.object({
  component: z.enum([
    "cpu",
    "memory",
    "gpu",
    "vram",
    "storage",
    "os",
    "virtualization",
    "hardware_api",
    "software_conflict",
  ]),
  from: z.string(),
  to: z.string(),
  impact: z.enum(["low", "medium", "high", "critical"]),
  feasibility: z.enum(["direct_upgrade", "non_upgradeable", "external_only", "full_system_recommended"]),
  reasonKey: z.string(),
  reasonText: z.string(),
  priority: z.number(),
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

export const ComponentEvaluationSchema = z.object({
  status: z.enum(["PASS", "FAIL", "UNKNOWN"]),
  performanceTier: z.enum(["poor", "minimum", "usable", "recommended", "excellent"]).optional(),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  actualValue: z.union([z.string(), z.number()]).optional(),
  requiredValue: z.union([z.string(), z.number()]).optional(),
  recommendedValue: z.union([z.string(), z.number()]).optional(),
  reasons: z.array(EvaluationReasonSchema).default([]),
});

export const PerAppEvaluationSchema = z.object({
  softwareId: z.string(),
  softwareName: z.string(),
  version: z.string(),
  compatibilityStatus: z.enum(["compatible", "incompatible", "unknown"]),
  performanceTier: z.enum(["poor", "minimum", "usable", "recommended", "excellent"]),
  score: z.number().min(0).max(100),
  isHardIncompatible: z.boolean().default(false),
  hardIncompatibilityReasons: z.array(z.string()).default([]),
  requirementProvenance: z
    .object({
      dataQuality: z.string().default("VERIFIED"),
      sourcePublisher: z.string().optional(),
      sourceUrl: z.string().optional(),
      retrievedAt: z.string().optional(),
      isFresh: z.boolean().default(true),
    })
    .default({
      dataQuality: "VERIFIED",
      isFresh: true,
    }),
});

export const ConcurrencyMetricsSchema = z.object({
  steadyStateRamGb: z.number().default(0),
  peakConcurrentRamGb: z.number().default(0),
  totalEstimatedRamUsageGb: z.number().default(0),
  safetyHeadroomGb: z.number().default(0),
  osBackgroundReserveGb: z.number().default(0),
  effectiveRequiredRamGb: z.number().default(0),
  ramPressureRatio: z.number().default(0),
  isSwappingLikely: z.boolean().default(false),
  activeWorkloadCount: z.number().default(1),
  isSimultaneous: z.boolean().default(true),
});

export const CompatibilityResultSchema = z.object({
  compatibilityStatus: z.enum(["compatible", "incompatible", "unknown"]),
  performanceTier: z.enum(["poor", "minimum", "usable", "recommended", "excellent"]),
  score: z.number().min(0).max(100),
  baseScore: z.number().min(0).max(100).default(0),
  criticalPenalty: z.number().default(0),
  confidence: z.number().min(0).max(100).default(70),
  isHardIncompatible: z.boolean().default(false),
  components: z.object({
    cpu: ComponentEvaluationSchema,
    memory: ComponentEvaluationSchema,
    gpu: ComponentEvaluationSchema,
    vram: ComponentEvaluationSchema,
    storage: ComponentEvaluationSchema,
    os: ComponentEvaluationSchema,
  }),
  perAppEvaluations: z.array(PerAppEvaluationSchema).default([]),
  concurrencyMetrics: ConcurrencyMetricsSchema.default({
    steadyStateRamGb: 0,
    peakConcurrentRamGb: 0,
    totalEstimatedRamUsageGb: 0,
    safetyHeadroomGb: 0,
    osBackgroundReserveGb: 0,
    effectiveRequiredRamGb: 0,
    ramPressureRatio: 0,
    isSwappingLikely: false,
    activeWorkloadCount: 1,
    isSimultaneous: true,
  }),
  bottlenecks: z.array(BottleneckSchema).default([]),
  upgradeRecommendations: z.array(UpgradeRecommendationSchema).default([]),
  explanations: z.array(EvaluationReasonSchema).default([]),
  assumptions: z.array(z.string()).default([]),
  caveats: z.array(z.string()).default([]),
  meta: z
    .object({
      engineVersion: z.string().default("2.4.0"),
      policyVersion: z.string().default("2026.09"),
      benchmarkDatasetVersion: z.string().default("2026.09.1"),
      normalizationAlgorithmVersion: z.string().default("v3"),
      evaluationFingerprint: z.string().default("sha256-verified"),
      evaluatedAt: z.string().default(new Date().toISOString()),
      isVerifiedHardware: z.boolean().default(true),
      calculationTrace: z.any().optional(),
    })
    .default({
      engineVersion: "2.4.0",
      policyVersion: "2026.09",
      benchmarkDatasetVersion: "2026.09.1",
      normalizationAlgorithmVersion: "v3",
      evaluationFingerprint: "sha256-verified",
      evaluatedAt: new Date().toISOString(),
      isVerifiedHardware: true,
    }),
});

export const RecommendationRequestSchema = z.object({
  workloads: z.array(SelectedWorkloadSchema).min(1, "Select at least one software application").max(30),
  simultaneousUse: z.boolean().optional().default(true),
  preferences: z.object({
    deviceType: z.enum(["desktop", "laptop", "mini-pc", "workstation", "any"]).optional().default("any"),
    usageLevel: z.enum(["minimum", "recommended", "professional"]).optional().default("recommended"),
    preferredOs: z.enum(["windows", "macos", "linux", "any"]).optional().default("any"),
    upgradeabilityImportant: z.boolean().optional().default(false),
    portabilityImportant: z.boolean().optional().default(false),
    maxBudgetUsd: z.number().positive().max(100000).optional(),
  }).optional(),
});

