import { CpuSelection } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { RuleEvaluation } from "../../domain/capabilities";

export function evaluateCpuRule(
  cpu: CpuSelection,
  version: SoftwareVersion,
  softwareName: string
): RuleEvaluation {
  const minCpuReq = version.minimumRequirements.cpu;
  const recCpuReq = version.recommendedRequirements?.cpu;

  if (!minCpuReq && !recCpuReq) {
    return {
      ruleId: "RULE_CPU_REQUIREMENT",
      capability: "CPU",
      outcome: "PASS",
      observedState: `${cpu.model} (${cpu.physicalCores ?? 4} cores)`,
      requiredState: "Standard CPU",
    };
  }

  // Check physical cores
  if (minCpuReq?.minimumCores && cpu.physicalCores !== undefined) {
    if (cpu.physicalCores < minCpuReq.minimumCores) {
      return {
        ruleId: "RULE_CPU_CORES",
        capability: "CPU",
        outcome: "FAIL",
        observedState: `${cpu.physicalCores} physical cores`,
        requiredState: `Minimum ${minCpuReq.minimumCores} cores`,
        reasonCode: "CPU_INSUFFICIENT_CORES",
        message: `${softwareName} requires at least ${minCpuReq.minimumCores} CPU cores. Detected ${cpu.physicalCores} cores on ${cpu.model}.`,
      };
    }
  }

  // Check performance benchmark score
  const requiredScore = minCpuReq?.minimumPerformanceScore ?? 35;
  const actualScore = cpu.performanceScore ?? (cpu.physicalCores ? Math.min(100, cpu.physicalCores * 12) : 50);

  if (actualScore < requiredScore * 0.7) {
    return {
      ruleId: "RULE_CPU_PERFORMANCE",
      capability: "CPU",
      outcome: "FAIL",
      observedState: `Score ${actualScore} (${cpu.model})`,
      requiredState: `Minimum score ${requiredScore}`,
      reasonCode: "CPU_BELOW_MINIMUM_PERFORMANCE",
      message: `${softwareName} requires higher CPU processing capacity than ${cpu.model} delivers.`,
    };
  }

  return {
    ruleId: "RULE_CPU_REQUIREMENT",
    capability: "CPU",
    outcome: "PASS",
    observedState: `Score ${actualScore} (${cpu.model})`,
    requiredState: `Minimum score ${requiredScore}`,
  };
}
