export type PlatformSupportStatus =
  | "SUPPORTED"
  | "TECHNICALLY_POSSIBLE"
  | "UNSUPPORTED_BY_VENDOR"
  | "INCOMPATIBLE"
  | "UNKNOWN";

export interface CapabilityRequirement {
  capability: string; // e.g. "virtualization", "avx2", "cuda", "hypervisor_framework"
  operator: "REQUIRED" | "MIN_VERSION" | "ONE_OF";
  value?: unknown;
  severity: "HARD" | "SOFT";
  description?: string;
}

export interface PlatformLayerEvaluation {
  status: PlatformSupportStatus;
  reasons: string[];
  warnings: string[];
}

export interface PlatformEvaluation {
  hardwareCapabilities: PlatformLayerEvaluation;
  osEligibility: PlatformLayerEvaluation;
  applicationPlatformSupport: PlatformLayerEvaluation;
  overallStatus: PlatformSupportStatus;
}
