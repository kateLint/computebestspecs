import { DeviceType, OperatingSystemFamily, StorageType } from "./hardware";
import { SelectedWorkload } from "./software";

export interface RecommendationPreferences {
  deviceType?: DeviceType | "any";
  usageLevel?: "minimum" | "recommended" | "professional";
  preferredOs?: OperatingSystemFamily | "any";
  upgradeabilityImportant?: boolean;
  portabilityImportant?: boolean;
  maxBudgetUsd?: number;
}

export interface ComponentRecommendation {
  performanceScore: number;
  description: string;
  minCores?: number;
  architecture?: string;
  exampleModels: string[];
}

export interface GpuRecommendation {
  performanceScore: number;
  minVramGb: number;
  description: string;
  isDedicatedRequired: boolean;
  requiredApis?: string[];
  exampleModels: string[];
}

export interface StorageRecommendation {
  capacityGb: number;
  recommendedType: StorageType;
  description: string;
}

export interface RecommendedHardwareTier {
  tierName: "Minimum" | "Recommended" | "Professional / Ideal";
  tierDescription: string;
  targetExperience: string;
  cpu: ComponentRecommendation;
  gpu: GpuRecommendation;
  ramGb: number;
  ramType: string;
  storage: StorageRecommendation;
  os: string;
  isSimultaneousReady: boolean;
}

export interface ExplanationSection {
  title: string;
  messageKey: string;
  details: string;
  factors: string[];
}

export interface HardwareRecommendation {
  minimum: RecommendedHardwareTier;
  recommended: RecommendedHardwareTier;
  professional: RecommendedHardwareTier;
  explanations: ExplanationSection[];
  concurrencyInsights: {
    individualAppMaxRam: number;
    concurrentRamNeeded: number;
    memoryReason: string;
  };
  confidence: number;
  caveats: string[];
  engineVersion: string;
}
