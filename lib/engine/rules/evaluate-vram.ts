import { HardwareProfile } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { RuleEvaluation } from "../../domain/capabilities";

export function evaluateVramRule(
  hardware: HardwareProfile,
  version: SoftwareVersion,
  softwareName: string
): RuleEvaluation {
  const minVramReq = version.minimumRequirements.gpu?.minimumVramGb;

  if (!minVramReq || minVramReq <= 0) {
    return {
      ruleId: "RULE_VRAM_REQUIREMENT",
      capability: "VRAM",
      outcome: "PASS",
      observedState: "Adequate",
      requiredState: "No minimum VRAM specified",
    };
  }

  // Calculate effective VRAM based on memory architecture topology
  let effectiveVram = 0;
  if (hardware.gpu?.type === "unified" || hardware.ram.topology === "UNIFIED_MEMORY") {
    // Unified memory architecture (e.g. Apple Silicon M-series) shares system RAM with GPU dynamically
    effectiveVram = hardware.ram.totalGb * 0.75;
  } else if (hardware.gpu?.type === "dedicated") {
    effectiveVram = hardware.gpu.vramGb ?? 4;
  } else {
    // Shared iGPU allocates up to 50% of system RAM
    effectiveVram = Math.min(4, hardware.ram.totalGb * 0.5);
  }

  if (effectiveVram < minVramReq) {
    return {
      ruleId: "RULE_VRAM_CAPACITY",
      capability: "VRAM",
      outcome: "FAIL",
      observedState: `${effectiveVram} GB Effective VRAM (${hardware.gpu?.model ?? "GPU"})`,
      requiredState: `Minimum ${minVramReq} GB VRAM`,
      reasonCode: "VRAM_INSUFFICIENT",
      message: `${softwareName} requires at least ${minVramReq} GB VRAM. Detected ${effectiveVram} GB effective VRAM.`,
    };
  }

  return {
    ruleId: "RULE_VRAM_REQUIREMENT",
    capability: "VRAM",
    outcome: "PASS",
    observedState: `${effectiveVram} GB Effective VRAM`,
    requiredState: `Minimum ${minVramReq} GB VRAM`,
  };
}
