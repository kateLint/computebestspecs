import { HardwareProfile } from "../../lib/domain/hardware";
import {
  EnterpriseFleetSla,
  FleetSlaSummary,
  FleetMachineAnalysis,
  AiModelSpec,
} from "../../lib/domain/ai-workload";
import { evaluateLocalAiCompatibility } from "./local-ai-engine";

export function evaluateFleetAgainstAiSla(
  fleetMachines: { machineId: string; machineName: string; hardware: HardwareProfile }[],
  sla: EnterpriseFleetSla
): FleetSlaSummary {
  const machineAnalyses: FleetMachineAnalysis[] = [];
  let tierACount = 0;
  let tierBCount = 0;
  let tierCCount = 0;
  let unsupportedCount = 0;

  let ramUpgradesNeeded = 0;
  let gpuUpgradesNeeded = 0;

  for (const machine of fleetMachines) {
    const evalResult = evaluateLocalAiCompatibility(
      machine.hardware,
      sla.targetModel,
      sla.minContextTokens,
      4.0
    );

    let tier: "TIER_A_MEETS_SLA" | "TIER_B_LOCAL_BELOW_SLA" | "TIER_C_CLOUD_RECOMMENDED" | "UNSUPPORTED" = "UNSUPPORTED";
    let recommendedUpgrade: string | undefined;
    let upgradeMovesToTierA = false;

    if (!evalResult.canRun) {
      tier = "UNSUPPORTED";
      unsupportedCount++;
      recommendedUpgrade = "Requires full workstation replacement";
    } else {
      const decodeTps = evalResult.performance.decode.estimatedGenerationTokensPerSecond.min;
      const prefillTps = evalResult.performance.prefill.estimatedPromptTokensPerSecond.min;
      const meetsDecode = decodeTps >= sla.minDecodeTokensPerSec;
      const meetsPrefill = prefillTps >= sla.minPrefillTokensPerSec;

      if (meetsDecode && meetsPrefill && (evalResult.residency === "FULL_GPU" || evalResult.residency === "FULL_UNIFIED_MEMORY")) {
        tier = "TIER_A_MEETS_SLA";
        tierACount++;
      } else if (evalResult.canRun && (decodeTps >= 8 || evalResult.residency === "PARTIAL_GPU_OFFLOAD")) {
        tier = "TIER_B_LOCAL_BELOW_SLA";
        tierBCount++;

        // Calculate if RAM or GPU upgrade brings machine into Tier A
        if (machine.hardware.ram.totalGb < sla.targetModel.recommendedRamGb) {
          recommendedUpgrade = `Upgrade RAM to ${sla.targetModel.recommendedRamGb}GB`;
          ramUpgradesNeeded++;
          upgradeMovesToTierA = (machine.hardware.gpu?.vramGb || 0) >= sla.targetModel.recommendedVramGb;
        } else if ((machine.hardware.gpu?.vramGb || 0) < sla.targetModel.recommendedVramGb) {
          recommendedUpgrade = `Upgrade GPU to ${sla.targetModel.recommendedVramGb}GB VRAM class`;
          gpuUpgradesNeeded++;
          upgradeMovesToTierA = true;
        }
      } else {
        tier = "TIER_C_CLOUD_RECOMMENDED";
        tierCCount++;
        recommendedUpgrade = "Use centralized Cloud API / Ollama server for this workstation";
      }
    }

    machineAnalyses.push({
      machineId: machine.machineId,
      machineName: machine.machineName,
      tier,
      compatibilityResult: evalResult,
      recommendedHardwareUpgrade: recommendedUpgrade,
      upgradeMovesToTierA,
    });
  }

  const total = Math.max(1, fleetMachines.length);

  return {
    sla,
    totalMachinesAnalyzed: fleetMachines.length,
    tierCounts: {
      tierA: tierACount,
      tierB: tierBCount,
      tierC: tierCCount,
      unsupported: unsupportedCount,
    },
    tierPercentages: {
      tierA: Math.round((tierACount / total) * 1000) / 10,
      tierB: Math.round((tierBCount / total) * 1000) / 10,
      tierC: Math.round((tierCCount / total) * 1000) / 10,
      unsupported: Math.round((unsupportedCount / total) * 1000) / 10,
    },
    upgradeActionPlan: {
      ramUpgradesCount: ramUpgradesNeeded,
      gpuUpgradesCount: gpuUpgradesNeeded,
      impactSummary: `${ramUpgradesNeeded} machines can be promoted to Tier A with targeted RAM upgrades, and ${gpuUpgradesNeeded} machines with GPU upgrades.`,
    },
    machines: machineAnalyses,
  };
}
