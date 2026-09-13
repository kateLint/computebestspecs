/**
 * Canonical Hardware & System Capabilities Domain Contracts (§Capability Graph)
 */

export type Capability =
  | "VIRTUALIZATION"
  | "CUDA"
  | "VULKAN"
  | "DIRECTX_12"
  | "METAL"
  | "AVX2"
  | "AVX512"
  | "ARM64"
  | "HYPERVISOR"
  | "RAY_TRACING"
  | "NPU"
  | "HARDWARE_DECODE"
  | "HARDWARE_ENCODE";

export type CapabilityOperator =
  | "REQUIRED"
  | "MIN_VERSION"
  | "ONE_OF";

export interface CapabilityRequirement {
  capability: Capability;
  operator: CapabilityOperator;
  severity: "HARD" | "SOFT";
  minimumVersion?: string;
  description?: string;
}

export type RuleOutcome =
  | "PASS"
  | "FAIL"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export interface RuleEvaluation {
  ruleId: string;
  capability?: Capability | string;
  outcome: RuleOutcome;
  severity?: "HARD" | "SOFT";
  reasonCode?: string;
  evidenceIds?: string[];
  observedState?: string;
  requiredState?: string;
  message?: string;
  parameters?: Record<string, string | number | boolean>;
}

export type CpuInstructionSet =
  | "AVX"
  | "AVX2"
  | "AVX512"
  | "NEON"
  | "AMX"
  | "SVE";

export type GpuGraphicsApi =
  | "DIRECTX_11"
  | "DIRECTX_12"
  | "DIRECTX_12_ULTIMATE"
  | "VULKAN_1_2"
  | "VULKAN_1_3"
  | "METAL_2"
  | "METAL_3"
  | "OPENGL_4_5";

export type ComputeAcceleratorApi =
  | "CUDA"
  | "ROCM"
  | "ONEAPI"
  | "METAL_COMPUTE"
  | "DIRECTML"
  | "OPENCL";

export type HardwareVideoCodec =
  | "H264"
  | "HEVC"
  | "AV1"
  | "PRORES"
  | "VP9";

export interface HardwareCapabilities {
  instructionSets?: CpuInstructionSet[];
  avx2?: boolean;
  avx512?: boolean;
  neon?: boolean;
  virtualization?: boolean;
  
  graphicsApis?: GpuGraphicsApi[];
  computeApis?: ComputeAcceleratorApi[];
  cudaComputeCapability?: string; // e.g. "8.6", "8.9"
  metalFeatureSet?: string;      // e.g. "Metal 3"
  directXFeatureLevel?: string;  // e.g. "12_2"
  
  rayTracing?: boolean;
  tensorCores?: boolean;
  npuTops?: number;
  
  hardwareVideoEncode?: HardwareVideoCodec[] | string[];
  hardwareVideoDecode?: HardwareVideoCodec[] | string[];
}
