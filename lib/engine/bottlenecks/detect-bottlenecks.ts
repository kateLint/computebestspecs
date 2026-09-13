import { HardwareProfile } from "../../domain/hardware";
import { AggregatedDemands } from "../workload/aggregate-resource-demand";
import { ConcurrencyEvaluationResult } from "../workload/evaluate-concurrency";
import { Bottleneck, ComponentEvaluation } from "../../domain/compatibility";

export interface RankedBottleneck extends Bottleneck {
  impactScore: number; // 0.0 to 1.0 ranking impact
}

export function detectBottlenecks(
  hardware: HardwareProfile,
  demands: AggregatedDemands,
  concurrency: ConcurrencyEvaluationResult,
  cpuEval: ComponentEvaluation,
  gpuEval: ComponentEvaluation,
  vramEval: ComponentEvaluation,
  storageEval: ComponentEvaluation,
  osEval: ComponentEvaluation,
  hasHardBlocker: boolean
): RankedBottleneck[] {
  const bottlenecks: RankedBottleneck[] = [];

  // 1. Hard Platform Blocker
  if (hasHardBlocker) {
    bottlenecks.push({
      component: "os",
      severity: "critical",
      impactScore: 1.0,
      messageKey: "bottleneck.platform_blocker",
      reason: "Platform or architectural requirement is incompatible with this system.",
      parameters: { os: hardware.os.family, arch: hardware.architecture },
    });
  }

  // 2. RAM Memory Pressure Bottleneck
  if (concurrency.peakPressureRatio > 1.25) {
    bottlenecks.push({
      component: "memory",
      severity: "critical",
      impactScore: 0.95,
      messageKey: "bottleneck.ram_severe_pressure",
      reason: `Peak memory demand (${concurrency.peakTotalGb} GB) exceeds installed memory (${hardware.ram.totalGb} GB).`,
      mitigation: "Upgrade system RAM to at least 32 GB to eliminate swap thrashing.",
      parameters: {
        installedGb: hardware.ram.totalGb,
        peakGb: concurrency.peakTotalGb,
        typicalGb: concurrency.typicalTotalGb,
      },
    });
  } else if (concurrency.peakPressureRatio > 1.0) {
    bottlenecks.push({
      component: "memory",
      severity: "high",
      impactScore: 0.85,
      messageKey: "bottleneck.ram_moderate_pressure",
      reason: `Memory demand under heavy multi-app load (${concurrency.peakTotalGb} GB) exceeds ${hardware.ram.totalGb} GB RAM.`,
      mitigation: "Upgrade system RAM for smoother multitasking.",
      parameters: {
        installedGb: hardware.ram.totalGb,
        peakGb: concurrency.peakTotalGb,
      },
    });
  }

  // 3. VRAM Bottleneck
  const actualVram = hardware.gpu?.vramGb ?? (hardware.gpu?.type === "integrated" ? 0 : 2);
  if (demands.peakVramGb > 0 && actualVram < demands.peakVramGb) {
    bottlenecks.push({
      component: "vram",
      severity: actualVram === 0 ? "critical" : "high",
      impactScore: 0.88,
      messageKey: "bottleneck.vram_deficit",
      reason: `Workload requires ${demands.peakVramGb} GB dedicated VRAM, but GPU has ${actualVram} GB.`,
      mitigation: "A dedicated GPU with higher VRAM is recommended.",
      parameters: { requiredVram: demands.peakVramGb, availableVram: actualVram },
    });
  }

  // 4. CPU Performance Bottleneck
  const cpuPerf = hardware.cpu.performanceScore ?? 50;
  if (demands.maxCpuScoreRequired > 0 && cpuPerf < demands.maxCpuScoreRequired * 0.75) {
    bottlenecks.push({
      component: "cpu",
      severity: "high",
      impactScore: 0.75,
      messageKey: "bottleneck.cpu_insufficient",
      reason: `CPU compute performance (${cpuPerf}/100) is lower than recommended for this workload.`,
      parameters: { cpuModel: hardware.cpu.model, cpuScore: cpuPerf, requiredScore: demands.maxCpuScoreRequired },
    });
  }

  // 5. Storage Free Space Bottleneck
  const primaryDrive = hardware.storage[0] || { totalGb: 512, freeGb: 200, type: "NVME_SSD" };
  const totalDiskReq = demands.totalDiskInstallGb + demands.totalDiskScratchGb;
  if (primaryDrive.freeGb !== undefined && primaryDrive.freeGb < totalDiskReq) {
    bottlenecks.push({
      component: "storage",
      severity: "high",
      impactScore: 0.70,
      messageKey: "bottleneck.storage_space_low",
      reason: `Free storage (${primaryDrive.freeGb} GB) is less than required installation and scratch space (${totalDiskReq} GB).`,
      mitigation: "Free up storage or add an additional NVMe SSD.",
      parameters: { freeGb: primaryDrive.freeGb, requiredGb: totalDiskReq },
    });
  }

  // Sort by descending impact
  return bottlenecks.sort((a, b) => b.impactScore - a.impactScore);
}
