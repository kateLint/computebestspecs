import { OperatingSystem, CpuArchitecture } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { EvaluationReason } from "../../domain/evaluation";

export interface PlatformEvaluationResult {
  isCompatible: boolean;
  reasons: EvaluationReason[];
}

export function evaluatePlatform(
  os: OperatingSystem,
  arch: CpuArchitecture,
  version: SoftwareVersion,
  softwareName: string
): PlatformEvaluationResult {
  const reasons: EvaluationReason[] = [];
  let isCompatible = true;

  // 1. Operating System Family Check
  const osSupported = version.supportedOperatingSystems.some(
    req => req.family === os.family
  );

  if (!osSupported) {
    isCompatible = false;
    reasons.push({
      code: "OS_UNSUPPORTED",
      severity: "critical",
      messageKey: "compatibility.os_unsupported",
      parameters: {
        software: softwareName,
        osFamily: os.family,
        osVersion: os.version || "",
        supportedFamilies: version.supportedOperatingSystems.map(s => s.family).join(", "),
      },
    });
  }

  // 2. CPU Architecture Check
  const reqArchs = version.minimumRequirements.architectures;
  if (reqArchs && reqArchs.length > 0 && !reqArchs.includes(arch)) {
    isCompatible = false;
    reasons.push({
      code: "ARCH_MISMATCH",
      severity: "critical",
      messageKey: "compatibility.architecture_mismatch",
      parameters: {
        software: softwareName,
        actualArch: arch,
        requiredArchs: reqArchs.join(" / "),
      },
    });
  }

  return { isCompatible, reasons };
}
