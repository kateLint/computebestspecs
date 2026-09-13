import { SoftwareVersion } from "../../domain/software";
import { RuleEvaluation } from "../../domain/capabilities";

export function evaluateMemoryRule(
  installedRamGb: number,
  version: SoftwareVersion,
  softwareName: string
): RuleEvaluation {
  const minRam = version.minimumRequirements?.minimumRamGb;

  if (minRam === undefined || minRam === null) {
    return {
      ruleId: `memory.minimum.${version.softwareId}`,
      outcome: "UNKNOWN",
      severity: "HARD",
      reasonCode: "REQUIREMENT_DATA_INSUFFICIENT",
      evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
      parameters: { software: softwareName, field: "minimumRamGb" },
    };
  }

  if (installedRamGb < minRam) {
    return {
      ruleId: `memory.minimum.${version.softwareId}`,
      outcome: "FAIL",
      severity: "HARD",
      reasonCode: "RAM_BELOW_MINIMUM",
      evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
      parameters: {
        software: softwareName,
        installedGb: installedRamGb,
        minimumRequiredGb: minRam,
      },
    };
  }

  return {
    ruleId: `memory.minimum.${version.softwareId}`,
    outcome: "PASS",
    severity: "HARD",
    reasonCode: "RAM_MEETS_MINIMUM",
    evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
    parameters: {
      software: softwareName,
      installedGb: installedRamGb,
      minimumRequiredGb: minRam,
    },
  };
}
