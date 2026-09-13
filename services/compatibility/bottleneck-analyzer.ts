import { Bottleneck, ComponentEvaluation } from "../../lib/domain/compatibility";
import { AggregatedWorkloadDemands } from "./concurrency-model";
import { HardwareProfile } from "../../lib/domain/hardware";

export function analyzeBottlenecks(
  hardware: HardwareProfile,
  demands: AggregatedWorkloadDemands,
  components: {
    cpu: ComponentEvaluation;
    memory: ComponentEvaluation;
    gpu: ComponentEvaluation;
    vram: ComponentEvaluation;
    storage: ComponentEvaluation;
    os: ComponentEvaluation;
  },
  appsList: string
): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  // Memory Bottleneck
  if (components.memory.status === "FAIL") {
    bottlenecks.push({
      component: "memory",
      severity: "critical",
      messageKey: "ram.fail_deficit",
      reason: `Installed RAM (${hardware.ram.totalGb}GB) is severely insufficient for your concurrent workload which requires ~${demands.effectiveRequiredRamGb}GB.`,
      mitigation: "Upgrade system RAM to at least 32GB.",
      parameters: {
        totalGb: hardware.ram.totalGb,
        requiredGb: demands.effectiveRequiredRamGb,
        apps: appsList,
      },
    });
  } else if (components.memory.status === "PASS" && demands.totalEstimatedRamUsageGb > hardware.ram.totalGb * 0.85) {
    bottlenecks.push({
      component: "memory",
      severity: "high",
      messageKey: "ram.borderline_concurrency",
      reason: `RAM is the primary limiting factor. While individual apps run, simultaneous execution will cause paging / swap file slowdowns.`,
      mitigation: "Increasing RAM will provide smooth multi-app multitasking.",
      parameters: {
        totalGb: hardware.ram.totalGb,
        requiredGb: demands.effectiveRequiredRamGb,
        apps: appsList,
      },
    });
  }

  // VRAM Bottleneck
  if (components.vram.status === "FAIL") {
    bottlenecks.push({
      component: "vram",
      severity: "high",
      messageKey: "gpu.fail_vram_deficit",
      reason: `GPU VRAM (${hardware.gpu?.vramGb || 0}GB) is below the minimum threshold (${demands.peakSingleAppVramGb}GB) required for 3D/viewport buffers.`,
      mitigation: "A GPU with higher VRAM buffer is recommended.",
      parameters: {
        vramGb: hardware.gpu?.vramGb || 0,
        requiredVram: demands.peakSingleAppVramGb,
      },
    });
  }

  // CPU Bottleneck
  if (components.cpu.status === "FAIL") {
    bottlenecks.push({
      component: "cpu",
      severity: "high",
      messageKey: "cpu.fail_weak",
      reason: `Processor compute throughput is significantly below the baseline performance class for this workload.`,
      mitigation: "Consider a modern 8-core CPU upgrade.",
      parameters: {
        cpuModel: hardware.cpu.model,
        score: hardware.cpu.performanceScore || 30,
        requiredScore: demands.maxCpuScoreRequired,
      },
    });
  }

  // Storage Bottleneck
  if (hardware.storage[0]?.type === "HDD") {
    bottlenecks.push({
      component: "storage",
      severity: "medium",
      messageKey: "storage.hdd_warning",
      reason: "Mechanical hard drive detected. Disk I/O, cache generation, and project loading will be a major workflow bottleneck.",
      mitigation: "Replace mechanical boot drive with an NVMe SSD.",
      parameters: {
        driveType: "HDD",
      },
    });
  }

  return bottlenecks;
}
