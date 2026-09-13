import { GpuSelection } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { RuleEvaluation } from "../../domain/capabilities";

export function evaluateGpuRule(
  gpu: GpuSelection | undefined,
  version: SoftwareVersion,
  softwareName: string
): RuleEvaluation {
  const minGpuReq = version.minimumRequirements.gpu;

  if (!minGpuReq) {
    return {
      ruleId: "RULE_GPU_REQUIREMENT",
      capability: "GPU",
      outcome: "PASS",
      observedState: gpu?.model ?? "Integrated GPU",
      requiredState: "Standard GPU",
    };
  }

  // Check dedicated GPU requirement
  if (minGpuReq.requiresDedicatedGpu) {
    if (!gpu || gpu.type === "integrated") {
      return {
        ruleId: "RULE_GPU_DEDICATED_REQUIRED",
        capability: "GPU",
        outcome: "FAIL",
        observedState: gpu?.model ?? "Integrated Graphics",
        requiredState: "Dedicated GPU required",
        reasonCode: "DEDICATED_GPU_REQUIRED",
        message: `${softwareName} strictly requires a dedicated graphics card (dGPU). Integrated graphics are unsupported.`,
      };
    }
  }

  // Check performance score
  const requiredScore = minGpuReq.minimumPerformanceScore ?? 30;
  const actualScore = gpu?.performanceScore ?? (gpu?.type === "integrated" ? 25 : 55);

  if (actualScore < requiredScore * 0.6) {
    return {
      ruleId: "RULE_GPU_PERFORMANCE",
      capability: "GPU",
      outcome: "FAIL",
      observedState: `Score ${actualScore} (${gpu?.model ?? "Generic GPU"})`,
      requiredState: `Minimum score ${requiredScore}`,
      reasonCode: "GPU_BELOW_MINIMUM_PERFORMANCE",
      message: `${softwareName} graphics workload exceeds the capability of ${gpu?.model ?? "the current GPU"}.`,
    };
  }

  return {
    ruleId: "RULE_GPU_REQUIREMENT",
    capability: "GPU",
    outcome: "PASS",
    observedState: `Score ${actualScore} (${gpu?.model ?? "Standard GPU"})`,
    requiredState: `Minimum score ${requiredScore}`,
  };
}
