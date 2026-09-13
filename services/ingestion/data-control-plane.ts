import { HardwareRequirements, SoftwareVersion, SelectedWorkload } from "../../lib/domain/software";
import { HardwareProfile } from "../../lib/domain/hardware";
import { evaluateCompatibility } from "../compatibility/compatibility-engine";

export type ChangeSeverity = "INFO" | "MINOR" | "MAJOR" | "BREAKING";

export interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface SemanticChangeItem {
  field: string;
  description: string;
  severity: ChangeSeverity;
  beforeValue?: any;
  afterValue?: any;
}

export interface CandidatePromotionResult {
  canAutoApprove: boolean;
  requiresHumanReview: boolean;
  overallSeverity: ChangeSeverity;
  changes: SemanticChangeItem[];
  regressionImpact?: {
    totalScenariosTested: number;
    unchangedCount: number;
    minorScoreShiftCount: number;
    tierShiftCount: number;
    newlyIncompatibleCount: number;
    newlyIncompatibleScenarios: string[];
  };
}

export function detectSemanticRequirementChanges(
  current: HardwareRequirements,
  candidate: Partial<HardwareRequirements>
): SemanticChangeItem[] {
  const changes: SemanticChangeItem[] = [];

  // 1. RAM changes
  if (candidate.minimumRamGb !== undefined && current.minimumRamGb !== undefined) {
    if (candidate.minimumRamGb > current.minimumRamGb) {
      const pctIncrease = (candidate.minimumRamGb - current.minimumRamGb) / current.minimumRamGb;
      const severity: ChangeSeverity = pctIncrease >= 0.5 || candidate.minimumRamGb - current.minimumRamGb >= 8 ? "BREAKING" : "MAJOR";
      changes.push({
        field: "minimumRamGb",
        description: `Minimum RAM increased from ${current.minimumRamGb}GB to ${candidate.minimumRamGb}GB (+${Math.round(pctIncrease * 100)}%)`,
        severity,
        beforeValue: current.minimumRamGb,
        afterValue: candidate.minimumRamGb,
      });
    }
  }

  // 2. Hardware API requirements (CUDA, Metal, DirectX 12)
  if (candidate.gpu?.requiresCuda && !current.gpu?.requiresCuda) {
    changes.push({
      field: "gpu.requiresCuda",
      description: "NVIDIA CUDA acceleration is now strictly required (Hardware API breaking requirement)",
      severity: "BREAKING",
      beforeValue: false,
      afterValue: true,
    });
  }

  if (candidate.gpu?.requiresDirectX12 && !current.gpu?.requiresDirectX12) {
    changes.push({
      field: "gpu.requiresDirectX12",
      description: "DirectX 12 feature level is now required",
      severity: "MAJOR",
      beforeValue: false,
      afterValue: true,
    });
  }

  // 3. Virtualization requirement
  if (candidate.requiresVirtualization && !current.requiresVirtualization) {
    changes.push({
      field: "requiresVirtualization",
      description: "Hardware Virtualization is now required",
      severity: "BREAKING",
      beforeValue: false,
      afterValue: true,
    });
  }

  // 4. OS support dropped
  if (candidate.operatingSystems && current.operatingSystems) {
    const candidateFamilies = new Set(candidate.operatingSystems.map(os => os.family));
    for (const os of current.operatingSystems) {
      if (!candidateFamilies.has(os.family)) {
        changes.push({
          field: "operatingSystems",
          description: `Operating system support for ${os.family} was removed`,
          severity: "BREAKING",
          beforeValue: os.family,
          afterValue: undefined,
        });
      }
    }
  }

  return changes;
}

export interface GoldenScenarioItem {
  name: string;
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
}

export function evaluateStagingPromotionImpact(
  currentVersion: SoftwareVersion,
  candidateRequirements: Partial<HardwareRequirements>,
  goldenScenarios: GoldenScenarioItem[]
): CandidatePromotionResult {
  const changes = detectSemanticRequirementChanges(currentVersion.minimumRequirements, candidateRequirements);

  const candidateVersion: SoftwareVersion = {
    ...currentVersion,
    minimumRequirements: {
      ...currentVersion.minimumRequirements,
      ...candidateRequirements,
    },
  };

  let unchangedCount = 0;
  let minorScoreShiftCount = 0;
  let tierShiftCount = 0;
  let newlyIncompatibleCount = 0;
  const newlyIncompatibleScenarios: string[] = [];

  for (const scenario of goldenScenarios) {
    const baselineResult = evaluateCompatibility(scenario.hardware, scenario.workloads, [currentVersion], true, false);
    const candidateResult = evaluateCompatibility(scenario.hardware, scenario.workloads, [candidateVersion], true, false);

    if (baselineResult.compatibilityStatus === "compatible" && candidateResult.compatibilityStatus === "incompatible") {
      newlyIncompatibleCount++;
      newlyIncompatibleScenarios.push(scenario.name);
    } else if (baselineResult.performanceTier !== candidateResult.performanceTier) {
      tierShiftCount++;
    } else if (Math.abs(baselineResult.score - candidateResult.score) >= 5) {
      minorScoreShiftCount++;
    } else {
      unchangedCount++;
    }
  }

  const hasBreakingChanges = changes.some(c => c.severity === "BREAKING") || newlyIncompatibleCount > 0;
  const overallSeverity: ChangeSeverity = hasBreakingChanges ? "BREAKING" : (changes.some(c => c.severity === "MAJOR") ? "MAJOR" : "INFO");

  return {
    canAutoApprove: !hasBreakingChanges && newlyIncompatibleCount === 0 && overallSeverity === "INFO",
    requiresHumanReview: hasBreakingChanges || overallSeverity === "MAJOR" || newlyIncompatibleCount > 0,
    overallSeverity,
    changes,
    regressionImpact: {
      totalScenariosTested: goldenScenarios.length,
      unchangedCount,
      minorScoreShiftCount,
      tierShiftCount,
      newlyIncompatibleCount,
      newlyIncompatibleScenarios,
    },
  };
}
