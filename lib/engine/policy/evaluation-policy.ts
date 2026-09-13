/**
 * Canonical Evaluation Policy Configuration
 * Versioned tuning parameters for headroom, concurrency weights, and reserve margins.
 */

export interface EvaluationPolicy {
  policyVersion: string;
  safetyHeadroomRatio: number;      // e.g. 0.15 (15% safety margin on memory)
  osBackgroundReserveGb: {
    windows: number;               // 2.5 GB
    macos: number;                 // 2.0 GB
    linux: number;                 // 1.5 GB
    other: number;                 // 2.0 GB
  };
  concurrencyIntensityWeights: {
    foreground: number;            // 1.0
    background: number;            // 0.6
    occasional: number;            // 0.25
  };
  bottleneckThresholds: {
    ramPressureWarning: number;    // 0.85 (85% utilization)
    ramPressureCritical: number;   // 1.00 (100% - paging likely)
    ramPressureSevere: number;     // 1.25 (125% - heavy thrashing)
    vramPressureWarning: number;   // 0.90
  };
}

export const DEFAULT_EVALUATION_POLICY: EvaluationPolicy = {
  policyVersion: "2026.1",
  safetyHeadroomRatio: 0.15,
  osBackgroundReserveGb: {
    windows: 2.5,
    macos: 2.0,
    linux: 1.5,
    other: 2.0,
  },
  concurrencyIntensityWeights: {
    foreground: 1.0,
    background: 0.6,
    occasional: 0.25,
  },
  bottleneckThresholds: {
    ramPressureWarning: 0.85,
    ramPressureCritical: 1.00,
    ramPressureSevere: 1.25,
    vramPressureWarning: 0.90,
  },
};
