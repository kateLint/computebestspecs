import { HardwareProfile } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { RuleEvaluation } from "../../domain/capabilities";

export function evaluateVirtualizationRule(
  hardware: HardwareProfile,
  version: SoftwareVersion,
  softwareName: string
): RuleEvaluation {
  const requiresVirt = version.minimumRequirements?.requiresVirtualization;

  if (!requiresVirt) {
    return {
      ruleId: `virtualization.${version.softwareId}`,
      outcome: "NOT_APPLICABLE",
      severity: "HARD",
      reasonCode: "VIRTUALIZATION_NOT_REQUIRED",
      evidenceIds: [],
    };
  }

  // CPU virtualization support
  if (hardware.supportsVirtualization === undefined) {
    return {
      ruleId: `virtualization.${version.softwareId}`,
      outcome: "UNKNOWN",
      severity: "HARD",
      reasonCode: "HARDWARE_CAPABILITY_UNKNOWN",
      evidenceIds: [],
      parameters: { software: softwareName, capability: "virtualization" },
    };
  }

  if (hardware.supportsVirtualization === false) {
    return {
      ruleId: `virtualization.${version.softwareId}`,
      outcome: "FAIL",
      severity: "HARD",
      reasonCode: "VIRTUALIZATION_UNSUPPORTED",
      evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
      parameters: { software: softwareName, cpuModel: hardware.cpu.model },
    };
  }

  // BIOS/OS virtualization enabled state
  if (hardware.isVirtualizationEnabled === false) {
    return {
      ruleId: `virtualization.${version.softwareId}`,
      outcome: "FAIL",
      severity: "HARD",
      reasonCode: "VIRTUALIZATION_DISABLED",
      evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
      parameters: { software: softwareName },
    };
  }

  return {
    ruleId: `virtualization.${version.softwareId}`,
    outcome: "PASS",
    severity: "HARD",
    reasonCode: "VIRTUALIZATION_ENABLED",
    evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
    parameters: { software: softwareName },
  };
}
