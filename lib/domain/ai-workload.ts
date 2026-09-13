import { CapabilityRequirement } from "./platform-compliance";
import { CpuArchitecture, OperatingSystemFamily } from "./hardware";

export type AiWorkloadType =
  | "LLM_INFERENCE"
  | "EMBEDDING"
  | "VISION_LANGUAGE"
  | "IMAGE_GENERATION"
  | "SPEECH_TO_TEXT";

export type ModelModality =
  | "TEXT"
  | "VISION"
  | "AUDIO"
  | "IMAGE_GENERATION"
  | "EMBEDDING";

export type QuantizationType =
  | "FP32"
  | "FP16"
  | "BF16"
  | "INT8"
  | "Q8"
  | "Q6"
  | "Q5"
  | "Q4"
  | "Q3"
  | "Q2";

export type ModelResidency =
  | "FULL_GPU"
  | "FULL_UNIFIED_MEMORY"
  | "PARTIAL_GPU_OFFLOAD"
  | "CPU_ONLY"
  | "INSUFFICIENT_MEMORY";

export type AcceleratorBackend = "cuda" | "metal" | "rocm" | "vulkan" | "sycl" | "cpu";
export type ModelFormat = "GGUF" | "Safetensors" | "MLX" | "EXL2" | "ONNX";

export interface CpuFeatureRequirement {
  feature: "AVX" | "AVX2" | "AVX512" | "AMX" | "NEON";
  level: "REQUIRED" | "RECOMMENDED" | "ACCELERATION_ONLY";
}

export interface ModelArchitecture {
  architectureType: "DENSE" | "MOE";
  totalParametersBillions: number;
  activeParametersPerTokenBillions?: number;
  expertCount?: number;
  activeExpertsPerToken?: number;
  layers?: number;
  hiddenDim?: number;
  kvHeads?: number;
}

export interface ContextMemoryEstimate {
  contextTokens: number;
  kvCacheGb: number;
  runtimeOverheadGb: number;
}

export interface InferenceRuntime {
  id: string; // e.g. "llama.cpp", "ollama", "mlx", "vllm", "exllamav2"
  name: string;
  supportedFormats: ModelFormat[];
  supportedAccelerators: AcceleratorBackend[];
  supportedArchitectures: CpuArchitecture[];
  cpuFeatures?: CpuFeatureRequirement[];
  supportedOperatingSystems: OperatingSystemFamily[];
  supportsPartialOffload: boolean;
}

export interface AiModelSpec {
  id: string;
  name: string;
  family: string;
  type: AiWorkloadType;
  modality: ModelModality;
  architecture: ModelArchitecture;
  quantization: QuantizationType;
  modelFileSizeGb: number;
  minimumRamGb: number;
  recommendedRamGb: number;
  minimumVramGb: number;
  recommendedVramGb: number;
  supportsCpuOnly: boolean;
  requiresDedicatedGpu: boolean;
  requiresCudaOrMetal: boolean;
  supportedBackends: AcceleratorBackend[];
  contextProfiles?: ContextMemoryEstimate[];
  capabilities?: CapabilityRequirement[];
}

export interface LlmPerformanceRange {
  min: number;
  max: number;
}

export interface LlmPerformanceEstimate {
  prefill: {
    estimatedPromptTokensPerSecond: LlmPerformanceRange;
    confidence: "high" | "medium" | "low";
  };
  decode: {
    estimatedGenerationTokensPerSecond: LlmPerformanceRange;
    confidence: "high" | "medium" | "low";
  };
}

export interface InferenceBenchmark {
  id?: string;
  hardwareProfileId?: string;
  gpuFamily?: string;
  cpuArchitecture?: CpuArchitecture;
  modelVariantId: string;
  runtimeVersion: string;
  backend: AcceleratorBackend;
  contextTokens: number;
  gpuLayers?: number;
  promptTokensPerSecond: number;
  generationTokensPerSecond: number;
  peakRamGb: number;
  peakVramGb?: number;
  measuredAt?: string;
}

export interface CalibrationEvidence {
  matchedBenchmarksCount: number;
  hardwareBasis: string;
  runtimeBackendBasis: string;
  confidenceScore: "high" | "medium" | "low";
  calibrationNotes: string[];
}

export interface LocalAiCompatibilityResult {
  modelId: string;
  modelName: string;
  canRun: boolean;
  residency: ModelResidency;
  compatibilityTier: "poor" | "minimum" | "usable" | "recommended" | "excellent";
  score: number; // 0-100
  
  performance: LlmPerformanceEstimate;
  calibration?: CalibrationEvidence;

  memoryBreakdown: {
    modelWeightsGb: number;
    kvCacheGb: number;
    visionEncoderOverheadGb?: number;
    runtimeOverheadGb: number;
    totalModelDemandGb: number;
    vramAllocatedGb: number;
    systemRamAllocatedGb: number;
    availableVramGb: number;
    availableRamGb: number;
    isMemoryPressured: boolean;
  };

  topology: {
    isUnifiedMemory: boolean;
    gpuVramBandwidthGbps?: number;
    systemMemoryBandwidthGbps: number;
    pcieBandwidthConstraint: boolean;
  };

  contextAnalysis: {
    selectedContextTokens: number;
    maxSupportedContextTokens: number;
    contextWarning?: string;
  };

  runtimeStack: {
    recommendedRuntime: string;
    recommendedBackend: AcceleratorBackend;
    modelFormat: ModelFormat;
  };

  assumptions: string[];
  recommendations: string[];
  caveats: string[];
}

export interface EnterpriseFleetSla {
  slaName: string;
  minDecodeTokensPerSec: number;
  minPrefillTokensPerSec: number;
  maxFirstTokenLatencySec: number;
  minContextTokens: number;
  targetModel: AiModelSpec;
}

export interface FleetMachineAnalysis {
  machineId: string;
  machineName: string;
  tier: "TIER_A_MEETS_SLA" | "TIER_B_LOCAL_BELOW_SLA" | "TIER_C_CLOUD_RECOMMENDED" | "UNSUPPORTED";
  compatibilityResult: LocalAiCompatibilityResult;
  recommendedHardwareUpgrade?: string;
  upgradeMovesToTierA: boolean;
}

export interface FleetSlaSummary {
  sla: EnterpriseFleetSla;
  totalMachinesAnalyzed: number;
  tierCounts: {
    tierA: number;
    tierB: number;
    tierC: number;
    unsupported: number;
  };
  tierPercentages: {
    tierA: number;
    tierB: number;
    tierC: number;
    unsupported: number;
  };
  upgradeActionPlan: {
    ramUpgradesCount: number;
    gpuUpgradesCount: number;
    impactSummary: string;
  };
  machines: FleetMachineAnalysis[];
}
