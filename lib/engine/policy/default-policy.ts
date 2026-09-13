/**
 * Default Policy Configuration for ComputeBestSpecs Engine
 */

export interface EvaluationPolicy {
  policyVersion: string;
  concurrency: {
    foregroundFactor: number;   // 1.0
    backgroundFactor: number;   // 0.65
    occasionalFactor: number;   // 0.25
  };
  memory: {
    safetyHeadroomPercent: number;       // 15% safety headroom
    recommendedHeadroomPercent: number;  // 25% professional headroom
    osReserveGb: {
      windows: number;                   // 2.5 GB
      macos: number;                     // 2.0 GB
      linux: number;                     // 1.5 GB
      other: number;                     // 2.0 GB
    };
    bottleneckPressureThreshold: number; // 1.0 (Demand > Installed)
    severePressureThreshold: number;     // 1.25 (Heavy thrashing)
  };
  storage: {
    minimumFreeSpacePercent: number;     // 10%
  };
}

export const DEFAULT_POLICY: EvaluationPolicy = {
  policyVersion: "2026.1",
  concurrency: {
    foregroundFactor: 1.0,
    backgroundFactor: 0.65,
    occasionalFactor: 0.25,
  },
  memory: {
    safetyHeadroomPercent: 15,
    recommendedHeadroomPercent: 25,
    osReserveGb: {
      windows: 2.5,
      macos: 2.0,
      linux: 1.5,
      other: 2.0,
    },
    bottleneckPressureThreshold: 1.0,
    severePressureThreshold: 1.25,
  },
  storage: {
    minimumFreeSpacePercent: 10,
  },
};
