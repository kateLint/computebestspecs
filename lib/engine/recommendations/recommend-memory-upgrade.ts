import { HardwareProfile } from "../../domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../domain/software";
import { UpgradeRecommendation } from "../../domain/compatibility";
import { MemoryDemandSummary, aggregateMemoryDemand } from "../workload/aggregate-memory-demand";
import { EvaluationPolicy, DEFAULT_POLICY } from "../policy/default-policy";

export function recommendMemoryUpgrade(
  hardware: HardwareProfile,
  workloads: SelectedWorkload[],
  versions: SoftwareVersion[],
  demand: MemoryDemandSummary,
  policy: EvaluationPolicy = DEFAULT_POLICY
): UpgradeRecommendation[] {
  // If memory is already adequate, no recommendation needed
  if (!demand.isBottleneck) {
    return [];
  }

  const currentRam = hardware.ram.totalGb;
  const isUpgradeable = hardware.ram.upgradeable !== false &&
    !hardware.ram.soldered &&
    hardware.upgradeFeasibility?.isRamUpgradeable !== false;

  const maxSupported = hardware.upgradeFeasibility?.maxSupportedRamGb ?? 128;
  const standardTiers = [32, 64, 128].filter(t => t <= maxSupported);
  
  // Find standard upgrade candidates above current RAM
  const candidates = standardTiers.filter(t => t > currentRam);

  // If machine cannot be upgraded physically or exceeds max board RAM
  if (!isUpgradeable || candidates.length === 0) {
    return [
      {
        component: "memory",
        from: `${currentRam} GB`,
        to: `${Math.max(32, Math.ceil(demand.totalPeakGb / 8) * 8)} GB`,
        impact: "high",
        feasibility: isUpgradeable ? "full_system_recommended" : "non_upgradeable",
        feasibilityDetails: {
          possible: false,
          confidence: 95,
          constraints: [
            !isUpgradeable
              ? "RAM is soldered / unified / non-user-serviceable on this device."
              : `System motherboard max RAM capacity reached (${maxSupported} GB).`,
          ],
        },
        reasonKey: "upgrade.ram_non_upgradeable_replacement_advised",
        reasonText: `Memory is non-upgradeable on this device. For this concurrent workload (${demand.totalPeakGb} GB peak), a replacement device with 32 GB+ unified/system memory is recommended.`,
        priority: 1,
      },
    ];
  }

  // Simulate each candidate
  let bestTarget = candidates[0];
  let bestScoreAfter = 0;
  const baselineScore = demand.peakPressureRatio > 1.25 ? 40 : 60;

  for (const candidateRam of candidates) {
    const simDemand = aggregateMemoryDemand(candidateRam, hardware.os.family, workloads, versions, policy);
    
    let candidateScore = 95;
    if (simDemand.peakPressureRatio > 1.0) candidateScore = 65;
    else if (simDemand.peakPressureRatio > 0.8) candidateScore = 88;

    // Pick the smallest target that satisfies peak demand without unnecessary overkill
    if (simDemand.peakPressureRatio <= 1.0) {
      bestTarget = candidateRam;
      bestScoreAfter = candidateScore;
      break; // Stop at first tier that comfortably clears the bottleneck (e.g. 32 GB)
    }
  }

  const deltaScore = bestScoreAfter - baselineScore;

  return [
    {
      component: "memory",
      from: `${currentRam} GB`,
      to: `${bestTarget} GB`,
      impact: deltaScore >= 30 ? "high" : "medium",
      feasibility: "direct_upgrade",
      feasibilityDetails: {
        possible: true,
        confidence: 95,
        constraints: [],
      },
      reasonKey: "upgrade.memory_upgrade_optimal",
      reasonText: `Upgrading to ${bestTarget} GB RAM resolves memory pressure under peak multitasking demand (${demand.totalPeakGb} GB).`,
      priority: 1,
      simulationDelta: {
        upgradeTarget: `${bestTarget} GB RAM`,
        scoreBefore: baselineScore,
        scoreAfter: bestScoreAfter,
        deltaScore,
        clearsPrimaryBottleneck: true,
      },
    },
  ];
}
