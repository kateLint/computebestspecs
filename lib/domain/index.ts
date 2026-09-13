/**
 * Canonical Domain Root Export for ComputeBestSpecs
 */

export * from "./errors";
export {
  type KnowledgeState,
  type UncertaintyState,
  type FieldUncertainty,
  type ConfidenceLevel as CanonicalConfidenceLevel,
  type Confidence as CanonicalConfidence,
  type EvidenceKind,
  type Evidence,
  type ResourceVector as CanonicalResourceVector,
  type ResourceDemand,
} from "./common";
export * from "./hardware";
export * from "./software";
export {
  type CpuInstructionSet,
  type GpuGraphicsApi,
  type ComputeAcceleratorApi,
  type HardwareVideoCodec,
  type CapabilityRequirement,
} from "./capabilities";
export * from "./compatibility";
export * from "./recommendation";
export * from "./versions";
export * from "./provenance";
export {
  type AiModelSpec,
  type LocalAiCompatibilityResult,
  type ModelResidency,
  type AcceleratorBackend,
  type ModelFormat,
  type LlmPerformanceEstimate,
  type InferenceRuntime,
  type InferenceBenchmark,
  type CalibrationEvidence,
} from "./ai-workload";
export {
  type UserNeedsProfile,
  type WorkloadItem,
  type FitEvaluationResult,
  type PersonaTemplate,
} from "./needs-profile";
