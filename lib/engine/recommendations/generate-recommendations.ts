import { HardwareProfile } from "../../domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../domain/software";
import { Bottleneck, UpgradeRecommendation } from "../../domain/compatibility";
import { ConcurrencyEvaluationResult } from "../workload/evaluate-concurrency";

export function generateRecommendations(
  hardware: HardwareProfile,
  workloads: SelectedWorkload[],
  versions: SoftwareVersion[],
  bottlenecks: Bottleneck[],
  concurrency: ConcurrencyEvaluationResult
): UpgradeRecommendation[] {
  const recommendations: UpgradeRecommendation[] = [];

  const ramBottleneck = bottlenecks.find(b => b.component === "memory");
  if (ramBottleneck) {
    const currentRam = hardware.ram.totalGb;
    const isUpgradeable = hardware.ram.upgradeable !== false &&
      !hardware.ram.soldered &&
      hardware.upgradeFeasibility?.isRamUpgradeable !== false;

    const maxSupported = hardware.upgradeFeasibility?.maxSupportedRamGb ?? 128;
    const targetRam = currentRam <= 16 ? 32 : currentRam <= 32 ? 64 : 128;

    if (!isUpgradeable || targetRam > maxSupported) {
      recommendations.push({
        component: "memory",
        from: `${currentRam} GB`,
        to: `${targetRam} GB`,
        impact: "high",
        feasibility: isUpgradeable ? "full_system_recommended" : "non_upgradeable",
        feasibilityDetails: {
          possible: false,
          confidence: 95,
          constraints: [
            !isUpgradeable
              ? "RAM is soldered or unified on this machine."
              : `Board max capacity (${maxSupported} GB) reached.`,
          ],
        },
        reasonKey: "upgrade.ram_non_upgradeable_replacement_required",
        reasonText: `RAM is non-upgradeable on this device. Upgrading requires replacing the machine or provisioning cloud dev environments.`,
        priority: 1,
      });
    } else {
      // Simulate improvement
      const scoreBefore = concurrency.peakPressureRatio > 1.25 ? 45 : 65;
      const scoreAfter = 92;
      const deltaScore = scoreAfter - scoreBefore;

      recommendations.push({
        component: "memory",
        from: `${currentRam} GB`,
        to: `${targetRam} GB`,
        impact: deltaScore > 30 ? "high" : "medium",
        feasibility: "direct_upgrade",
        feasibilityDetails: {
          possible: true,
          confidence: 95,
          constraints: [],
        },
        reasonKey: "upgrade.ram_benefit",
        reasonText: `Upgrading to ${targetRam} GB RAM eliminates swap paging under simultaneous workload pressure.`,
        priority: 1,
        simulationDelta: {
          upgradeTarget: `${targetRam} GB RAM`,
          scoreBefore,
          scoreAfter,
          deltaScore,
          clearsPrimaryBottleneck: true,
        },
      });
    }
  }

  const storageBottleneck = bottlenecks.find(b => b.component === "storage");
  if (storageBottleneck) {
    const isStorageUpgradeable = hardware.upgradeFeasibility?.isStorageUpgradeable !== false;
    recommendations.push({
      component: "storage",
      from: `${hardware.storage[0]?.freeGb ?? 0} GB Free`,
      to: "1 TB+ NVMe SSD",
      impact: "medium",
      feasibility: isStorageUpgradeable ? "direct_upgrade" : "external_only",
      feasibilityDetails: {
        possible: true,
        confidence: 90,
        constraints: isStorageUpgradeable ? [] : ["Internal drive is soldered; use high-speed external Thunderbolt / USB4 NVMe storage."],
      },
      reasonKey: "upgrade.storage_space",
      reasonText: isStorageUpgradeable
        ? "Expand internal NVMe storage to accommodate project assets and scratch disks."
        : "Attach a high-speed external Thunderbolt NVMe drive for project caches and scratch space.",
      priority: 2,
    });
  }

  return recommendations;
}
