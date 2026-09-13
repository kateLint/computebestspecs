import { UpgradeRecommendation } from "../../lib/domain/compatibility";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";
import { AggregatedWorkloadDemands } from "./concurrency-model";
import { evaluateCompatibility } from "./compatibility-engine";

export function generateUpgradeRecommendations(
  hardware: HardwareProfile,
  demands: AggregatedWorkloadDemands,
  selectedWorkloads: SelectedWorkload[],
  softwareVersions: SoftwareVersion[],
  baselineScore: number,
  appsList: string
): UpgradeRecommendation[] {
  const recommendations: UpgradeRecommendation[] = [];

  const isSolderedRam = hardware.ram.soldered || (hardware.cpu.architecture === "arm64" && hardware.cpu.manufacturer === "Apple");
  const isLaptop = hardware.deviceType === "laptop";

  // 1. Simulate RAM Upgrade
  if (hardware.ram.totalGb < demands.effectiveRequiredRamGb) {
    const nextTargetGb = demands.effectiveRequiredRamGb <= 32 ? 32 : demands.effectiveRequiredRamGb <= 64 ? 64 : 128;
    const simulatedRamProfile: HardwareProfile = {
      ...hardware,
      ram: { ...hardware.ram, totalGb: nextTargetGb },
    };

    // Run simulation to measure true delta (Sensitivity Analysis §14-§15)
    const simResult = evaluateCompatibility(simulatedRamProfile, selectedWorkloads, softwareVersions, true, false);
    const delta = Math.max(0, simResult.score - baselineScore);

    let feasibility: UpgradeRecommendation["feasibility"] = "direct_upgrade";
    let reasonText = `Upgrading RAM from ${hardware.ram.totalGb}GB to ${nextTargetGb}GB will eliminate swap slowdowns and allow full multitasking between ${appsList}.`;

    if (isSolderedRam) {
      feasibility = "non_upgradeable";
      reasonText = `RAM is the primary limiting factor (${hardware.ram.totalGb}GB installed vs ~${demands.effectiveRequiredRamGb}GB needed), but this device model features non-upgradeable / unified memory.`;
    }

    recommendations.push({
      component: "memory",
      from: `${hardware.ram.totalGb}GB`,
      to: `${nextTargetGb}GB`,
      impact: delta >= 15 ? "critical" : delta >= 8 ? "high" : "medium",
      feasibility,
      reasonKey: "upgrade.ram.reason",
      reasonText,
      priority: 1,
      simulationDelta: {
        upgradeTarget: `${nextTargetGb}GB RAM`,
        scoreBefore: baselineScore,
        scoreAfter: simResult.score,
        deltaScore: delta,
        clearsPrimaryBottleneck: true,
      },
    });
  }

  // 2. Simulate Storage Upgrade
  const primaryDrive = hardware.storage[0];
  if (primaryDrive && (primaryDrive.type === "HDD" || (primaryDrive.type === "SATA_SSD" && demands.totalDiskScratchGb > 30))) {
    const simulatedStorageProfile: HardwareProfile = {
      ...hardware,
      storage: [{ ...primaryDrive, type: "NVME_SSD", totalGb: 1000 }],
    };

    const simResult = evaluateCompatibility(simulatedStorageProfile, selectedWorkloads, softwareVersions, true, false);
    const delta = Math.max(0, simResult.score - baselineScore);

    recommendations.push({
      component: "storage",
      from: primaryDrive.type === "HDD" ? "HDD" : "SATA SSD",
      to: "1TB / 2TB NVMe PCIe 4.0 SSD",
      impact: primaryDrive.type === "HDD" ? "high" : "medium",
      feasibility: "direct_upgrade",
      reasonKey: "upgrade.storage.reason",
      reasonText: primaryDrive.type === "HDD"
        ? "Upgrading from mechanical HDD to a fast NVMe SSD delivers 10x-30x faster project loading and instant scratch cache writes."
        : "Heavy video/3D scratch space benefits significantly from PCIe NVMe throughput over SATA limits.",
      priority: 2,
      simulationDelta: {
        upgradeTarget: "NVMe SSD",
        scoreBefore: baselineScore,
        scoreAfter: simResult.score,
        deltaScore: delta,
        clearsPrimaryBottleneck: primaryDrive.type === "HDD",
      },
    });
  }

  // 3. Simulate GPU Upgrade
  const currentVram = hardware.gpu?.vramGb || 0;
  if (demands.requiresDedicatedGpu && (hardware.gpu?.type === "integrated" || currentVram < demands.peakSingleAppVramGb)) {
    const targetVram = demands.peakSingleAppVramGb <= 6 ? 8 : 12;
    const simulatedGpuProfile: HardwareProfile = {
      ...hardware,
      gpu: {
        model: "Dedicated High-Performance GPU",
        type: "dedicated",
        vramGb: targetVram,
        performanceScore: Math.max(75, demands.maxGpuScoreRequired),
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
      },
    };

    const simResult = evaluateCompatibility(simulatedGpuProfile, selectedWorkloads, softwareVersions, true, false);
    const delta = Math.max(0, simResult.score - baselineScore);

    const feasibility: UpgradeRecommendation["feasibility"] = isLaptop ? "full_system_recommended" : "direct_upgrade";
    const reasonText = isLaptop
      ? `Dedicated GPU with ${targetVram}GB VRAM is recommended for heavy 3D/video workflows. Laptop GPUs cannot be upgraded separately.`
      : `Upgrading to a dedicated graphics card with ${targetVram}GB+ VRAM will provide hardware acceleration and real-time render preview.`;

    recommendations.push({
      component: "gpu",
      from: hardware.gpu ? `${hardware.gpu.model} (${currentVram}GB)` : "Integrated Graphics",
      to: `Dedicated GPU (${targetVram}GB VRAM)`,
      impact: delta >= 12 ? "high" : "medium",
      feasibility,
      reasonKey: "upgrade.gpu.reason",
      reasonText,
      priority: 3,
      simulationDelta: {
        upgradeTarget: `Dedicated GPU (${targetVram}GB VRAM)`,
        scoreBefore: baselineScore,
        scoreAfter: simResult.score,
        deltaScore: delta,
        clearsPrimaryBottleneck: demands.requiresDedicatedGpu && hardware.gpu?.type === "integrated",
      },
    });
  }

  // Rank strictly by simulated delta impact
  return recommendations.sort((a, b) => (b.simulationDelta?.deltaScore || 0) - (a.simulationDelta?.deltaScore || 0));
}
