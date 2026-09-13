import { HardwareProfile } from "../domain/hardware";
import { SelectedWorkload, SoftwareVersion, HardwareRequirements } from "../domain/software";
import { EvaluationVersions } from "../domain/versions";
import { CompatibilityResult, ScenarioMode } from "../domain/evaluation";

export type { ScenarioMode };

export interface EvaluationPolicy {
  safetyHeadroomRatio: number; // e.g. 0.15 (15% RAM safety margin)
  osBackgroundReserveGb: number; // e.g. 2.5 GB on Windows, 2.0 GB on macOS/Linux
  concurrencyIntensityWeights: {
    light: number;
    medium: number;
    heavy: number;
    professional: number;
  };
}

export const DEFAULT_EVALUATION_POLICY: EvaluationPolicy = {
  safetyHeadroomRatio: 0.15,
  osBackgroundReserveGb: 2.5,
  concurrencyIntensityWeights: {
    light: 0.5,
    medium: 0.75,
    heavy: 0.9,
    professional: 1.0,
  },
};

export interface EvaluationInput {
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
  softwareVersions: SoftwareVersion[];
  scenarioMode?: ScenarioMode;
  policy?: EvaluationPolicy;
  versions?: EvaluationVersions;
  options?: {
    prioritizeUpgradeFeasibility?: boolean;
    benchmarkDatasetVersion?: string;
  };
}

export type PureEngineEvaluator = (input: EvaluationInput) => CompatibilityResult;
