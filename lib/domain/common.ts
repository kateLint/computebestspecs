/**
 * Canonical Common Domain Types & Invariants for ComputeBestSpecs
 */

/**
 * Fundamental invariant: Knowledge state across requirements and specifications.
 * Missing data is NEVER turned into an invented number.
 */
export type KnowledgeState =
  | "KNOWN"
  | "UNKNOWN"
  | "CONFLICTING"
  | "STALE"
  | "INSUFFICIENT";

/**
 * Result uncertainty at field level
 */
export type UncertaintyState =
  | "KNOWN"
  | "ESTIMATED"
  | "UNKNOWN"
  | "CONFLICTING";

export interface FieldUncertainty {
  compatibility: UncertaintyState;
  performance: UncertaintyState;
  workloadFit: UncertaintyState;
  bottlenecks: UncertaintyState;
  recommendations: UncertaintyState;
  components: {
    cpu: UncertaintyState;
    gpu: UncertaintyState;
    memory: UncertaintyState;
    storage: UncertaintyState;
    os: UncertaintyState;
    virtualization?: UncertaintyState;
  };
}

/**
 * Confidence rating level
 */
export type ConfidenceLevel =
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INSUFFICIENT";

export interface Confidence {
  level: ConfidenceLevel;
  score?: number; // 0-100 normalized score
  reasons: string[];
}

/**
 * Provenance & Evidence category
 */
export type EvidenceKind =
  | "OFFICIAL_REQUIREMENT"
  | "BENCHMARK"
  | "WORKLOAD_ESTIMATE"
  | "MEASURED"
  | "INFERRED";

export interface Evidence {
  kind: EvidenceKind;
  sourceName: string;
  sourceUrl?: string;
  retrievedAt?: string;
  verifiedAt?: string;
  confidence: ConfidenceLevel;
}

/**
 * Continuous multidimensional resource vector
 */
export interface ResourceVector {
  cpu?: number;              // Aggregate CPU load percentage (0-100)
  cpuSingleThread?: number;  // Single-thread critical load (0-100)
  ramGb?: number;            // System memory in GB
  gpu?: number;              // GPU compute utilization percentage (0-100)
  vramGb?: number;           // Video RAM in GB
  storageGb?: number;        // Storage space in GB
  tempStorageGb?: number;    // Scratch/temporary workspace storage in GB
  diskReadMBps?: number;     // Disk sequential read throughput
  diskWriteMBps?: number;    // Disk sequential write throughput
  networkMbps?: number;      // Network bandwidth requirement
}

/**
 * Phase-dependent resource demand across lifecycle states
 */
export interface ResourceDemand {
  idle: ResourceVector;
  typical: ResourceVector;
  peak: ResourceVector;
  burst?: ResourceVector;    // Instantaneous peak / compile burst / model load
  confidence: Confidence;
  evidence: Evidence[];
}
