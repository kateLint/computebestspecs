import { HardwareProfile } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { EvaluationReason } from "../../domain/evaluation";

export interface CapabilityEvaluationResult {
  isCompatible: boolean;
  reasons: EvaluationReason[];
}

export function evaluateCapabilities(
  hardware: HardwareProfile,
  version: SoftwareVersion,
  softwareName: string
): CapabilityEvaluationResult {
  const reasons: EvaluationReason[] = [];
  let isCompatible = true;
  const minReqs = version.minimumRequirements;

  // 1. Virtualization Check
  if (minReqs.requiresVirtualization) {
    if (hardware.supportsVirtualization === false) {
      isCompatible = false;
      reasons.push({
        code: "VIRTUALIZATION_UNSUPPORTED",
        severity: "critical",
        messageKey: "compatibility.virtualization_unsupported",
        parameters: { software: softwareName },
      });
    } else if (hardware.isVirtualizationEnabled === false) {
      isCompatible = false;
      reasons.push({
        code: "VIRTUALIZATION_DISABLED_BIOS",
        severity: "critical",
        messageKey: "compatibility.virtualization_disabled",
        parameters: { software: softwareName },
      });
    }
  }

  // 2. CPU Instruction Sets (e.g. AVX2)
  if (minReqs.cpu?.requiredCapabilities?.avx2 && hardware.cpu.capabilities?.avx2 === false) {
    isCompatible = false;
    reasons.push({
      code: "CPU_AVX2_MISSING",
      severity: "critical",
      messageKey: "compatibility.avx2_missing",
      parameters: { software: softwareName, cpuModel: hardware.cpu.model },
    });
  }

  // 3. GPU APIs (CUDA, Metal)
  if (minReqs.gpu?.requiresCuda && !hardware.gpu?.supportsCuda) {
    isCompatible = false;
    reasons.push({
      code: "GPU_CUDA_MISSING",
      severity: "critical",
      messageKey: "compatibility.cuda_missing",
      parameters: {
        software: softwareName,
        gpuModel: hardware.gpu?.model || "Integrated Graphics",
      },
    });
  }

  if (minReqs.gpu?.requiresMetal && !hardware.gpu?.supportsMetal) {
    isCompatible = false;
    reasons.push({
      code: "GPU_METAL_MISSING",
      severity: "critical",
      messageKey: "compatibility.metal_missing",
      parameters: { software: softwareName },
    });
  }

  return { isCompatible, reasons };
}
