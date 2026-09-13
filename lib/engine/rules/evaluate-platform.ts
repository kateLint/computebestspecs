import { OperatingSystem, CpuArchitecture } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { RuleEvaluation } from "../../domain/capabilities";

export function evaluatePlatformRule(
  os: OperatingSystem,
  arch: CpuArchitecture,
  version: SoftwareVersion,
  softwareName: string
): RuleEvaluation {
  // Missing OS requirement check
  if (!version.supportedOperatingSystems || version.supportedOperatingSystems.length === 0) {
    return {
      ruleId: `platform.${version.softwareId}`,
      outcome: "UNKNOWN",
      severity: "HARD",
      reasonCode: "REQUIREMENT_DATA_INSUFFICIENT",
      evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
      parameters: { software: softwareName },
    };
  }

  // OS family support
  const osSupported = version.supportedOperatingSystems.some(req => req.family === os.family);
  if (!osSupported) {
    return {
      ruleId: `platform.os.${version.softwareId}`,
      outcome: "FAIL",
      severity: "HARD",
      reasonCode: "OS_VERSION_UNSUPPORTED",
      evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
      parameters: {
        software: softwareName,
        actualOs: os.family,
        supportedFamilies: version.supportedOperatingSystems.map(s => s.family).join(", "),
      },
    };
  }

  // Architecture support
  const reqArchs = version.minimumRequirements?.architectures;
  if (reqArchs && reqArchs.length > 0 && !reqArchs.includes(arch)) {
    return {
      ruleId: `platform.arch.${version.softwareId}`,
      outcome: "FAIL",
      severity: "HARD",
      reasonCode: "ARCHITECTURE_UNSUPPORTED",
      evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
      parameters: {
        software: softwareName,
        actualArch: arch,
        requiredArchs: reqArchs.join(" / "),
      },
    };
  }

  return {
    ruleId: `platform.${version.softwareId}`,
    outcome: "PASS",
    severity: "HARD",
    reasonCode: "PLATFORM_COMPATIBLE",
    evidenceIds: version.sourceRecords?.map(s => s.id || "source_fixture") || [],
    parameters: { software: softwareName, os: os.family, arch },
  };
}
