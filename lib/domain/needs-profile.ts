import { HardwareProfile } from "./hardware";

export type WorkloadIntensity = "light" | "medium" | "heavy" | "professional" | "extreme";
export type ConcurrencyGroup = "usually_together" | "occasionally" | "never_together";

export interface WorkloadItem {
  softwareId: string;
  softwareName: string;
  intensity: WorkloadIntensity;
  concurrencyGroup: ConcurrencyGroup;
  quantity: number;
  notes?: string;
}

export interface UserNeedsProfile {
  id: string;
  personaId?: string;
  primaryGoal: string;
  budget?: { amount: number; currency: string };
  targetLongevityYears?: number; // e.g. 3-4 years
  
  // Multi-dimensional Priority Weights (1-5 scale)
  weights: {
    rawPerformance: number;
    multitaskingMemory: number;
    localAi: number;
    gamingGraphics: number;
    portabilityWeight: number;
    batteryLife: number;
    quietOperation: number;
    upgradeability: number;
    displayQuality: number;
  };

  // Structured Workload Needs
  workloads: WorkloadItem[];

  // Agentic & AI Specific Profile
  agentProfile?: AgentWorkloadProfile;
}

export interface AgentWorkloadProfile {
  llmModelId: string;
  modelName: string;
  quantization: string;
  contextLengthTokens: number;
  concurrentAgents: number; // 1 to 5 agents
  includesEmbeddingModel: boolean;
  includesVectorDb: boolean;
  includesDockerContainers: number;
  includesBrowserAutomation: boolean;
  includesMcpToolServers: number;
  executionPreference: "LOCAL_ONLY" | "HYBRID_PREFERRED" | "ANY";
}

export interface PersonaTemplate {
  id: string;
  title: string;
  category: "Development" | "AI & ML" | "Creative" | "Education" | "Gaming & Streaming" | "Business";
  description: string;
  badge: string;
  icon: string;
  typicalWorkloads: WorkloadItem[];
  defaultAgentProfile?: AgentWorkloadProfile;
  recommendedHardwareBaseline: {
    minRamGb: number;
    recRamGb: number;
    minVramGb: number;
    recVramGb: number;
    cpuCores: number;
  };
  weights: UserNeedsProfile["weights"];
}

export type FitStatus = "excellent" | "good" | "borderline" | "poor" | "incompatible" | "unknown";

export interface FitEvaluationResult {
  overallFit: FitStatus;
  fitScore: number; // 0-100
  verdictTitle: string;
  verdictHeadline: string; // e.g. "YES — GOOD FIT"
  verdictSummary: string;
  
  // Provenance & Evidence
  provenance: {
    cpuIdentified: boolean;
    cpuModel: string;
    gpuIdentified: boolean;
    gpuModel: string;
    requirementsVerifiedCount: number;
    workloadEstimatesCount: number;
    concurrencyModelled: boolean;
    confidenceTier: "High confidence" | "Medium confidence" | "Indicative";
    engineVersion: string;
    datasetDate: string;
    evidencePoints: Array<{ status: "exact" | "estimate" | "modeled"; label: string; detail: string }>;
  };

  // Main Hardware Limitation / Bottleneck
  mainLimitation?: {
    resource: "ram" | "vram" | "cpu" | "gpu" | "storage";
    title: string;
    currentCapacity: string;
    recommendedCapacity: string;
    simulateValue?: number;
    impactExplanation: string;
  };

  // 4 Core Dimensions (Supporting Evidence)
  canRun: { 
    status: boolean; 
    label: string;
    reasons: string[];
  };
  runsWell: { 
    status: boolean; 
    label: string;
    tier: "poor" | "minimum" | "usable" | "recommended" | "excellent"; 
    score: number;
    summary: string;
  };
  fitsWorkload: { 
    status: boolean; 
    label: string;
    ramPressureRatio: number; 
    concurrencyLimit: string;
    summary: string;
  };
  goodPurchase: { 
    status: boolean;
    priceKnown: boolean;
    label: string;
    valueScore: number; 
    longevityYears: number; 
    longevityAssumptions: string;
    recommendation: string;
  };

  // Category Fit Radar / Fingerprint (0-100 values)
  fitFingerprint: {
    development: number;
    localAi: number;
    multitasking: number;
    creative: number;
    gaming: number;
    portability: number;
    futureHeadroom: number;
  };

  // Multi-Agent Execution Simulation (1 to 5 agents)
  agentSimulation?: {
    maxRecommendedAgents: number;
    bottleneckAtCount: number;
    limitingResource: "vram" | "ram" | "cpu" | "none";
    perAgentMetrics: Array<{
      agentCount: number;
      ramUsageGb: number;
      vramUsageGb: number;
      cpuUsagePct: number;
      tokensPerSec: number;
      fitTier: "excellent" | "good" | "borderline" | "not_recommended";
      statusLabel: string;
    }>;
  };

  // Execution Strategy (Local vs Hybrid vs Cloud)
  executionStrategy: {
    recommendedStrategy: "LOCAL" | "HYBRID" | "CLOUD";
    headline: string;
    strategyExplanation: string;
    localViability: string;
    costAndPrivacy: {
      localMonthlyElectricityEstimateUsd: number;
      cloudMonthlyApiEstimateUsd: number;
      privacyRating: "Maximum (Airgapped / Local)" | "Medium (Hybrid)" | "External Cloud";
      latencyTier: "Ultra-Low (<15ms)" | "Low (50-100ms)" | "Network Dependent (>300ms)";
    };
  };

  // Reverse Capability Profile ("What is this PC good at?")
  capabilityMap: {
    excellentFor: string[];
    goodFor: string[];
    poorFitFor: string[];
  };

  // Actionable Upgrade Advisor (Including "No Upgrade Needed")
  upgradeVerdict: {
    shouldUpgrade: boolean;
    headline: string;
    reason: string;
    pricingTier: "LIVE_MARKET" | "ESTIMATED" | "NO_PRICE_DATA";
    primaryUpgrade?: { 
      component: string; 
      from: string; 
      to: string; 
      estimatedCostIls?: number;
      estimatedCostUsd?: number;
      priceRangeIls?: string;
      pricingSource: "LIVE_MARKET" | "ESTIMATED" | "NO_PRICE_DATA";
      impact: "high" | "medium" | "low";
      justification: string;
    };
    secondaryUpgrade?: { 
      component: string; 
      from: string; 
      to: string; 
      estimatedCostIls?: number;
      estimatedCostUsd?: number;
      pricingSource: "LIVE_MARKET" | "ESTIMATED" | "NO_PRICE_DATA";
      impact: "high" | "medium" | "low";
      justification: string;
    };
  };
}
