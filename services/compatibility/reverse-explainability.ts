import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";
import { aggregateWorkloadDemands } from "./concurrency-model";

export interface ReverseExplainabilityBreakdown {
  component: "memory" | "vram";
  lowerTierLabel: string;
  lowerTierValueGb: number;
  recommendedTierLabel: string;
  recommendedTierValueGb: number;
  osReserveGb: number;
  backgroundBufferGb: number;
  workloadAllocations: {
    softwareName: string;
    workloadName: string;
    concurrencyMode: string;
    concurrencyFactor: number;
    estimatedActiveGb: number;
  }[];
  expectedActiveUsageGb: number;
  recommendedHeadroomPercent: number;
  recommendedHeadroomGb: number;
  calculatedTargetGb: number;
  deficitUnderLowerTierGb: number;
  isLowerTierInsufficient: boolean;
  explanationSummary: string;
  disclaimer: string;
}

export function generateReverseExplainability(
  hardware: HardwareProfile,
  selectedWorkloads: SelectedWorkload[],
  softwareVersions: SoftwareVersion[],
  hypotheticalLowerTierRamGb: number = 16
): ReverseExplainabilityBreakdown {
  const demands = aggregateWorkloadDemands(hardware, selectedWorkloads, softwareVersions, true);

  const osReserve = hardware.os.family === "windows" ? 2.5 : (hardware.os.family === "macos" ? 2.0 : 1.5);
  const backgroundBuffer = 1.5;

  const workloadAllocations = selectedWorkloads.map(sw => {
    const version = softwareVersions.find(v => v.id === sw.softwareVersionId) ||
                    softwareVersions.find(v => v.softwareId === sw.softwareId);
    const workload = version?.workloads.find(w => w.id === sw.workloadId) || version?.workloads[0];

    const typRam = workload?.typical?.ramGb ?? workload?.estimatedRamGb?.typical ?? 4;
    const factor = sw.concurrency === "foreground" ? 1.0 : (sw.concurrency === "background" ? 0.65 : 0.35);
    const workloadFactor = workload?.workloadConcurrencyFactor ?? 0.8;
    const effectiveWeight = factor * workloadFactor;
    const quantity = sw.quantity || 1;

    const estimatedActiveGb = Math.round(typRam * quantity * effectiveWeight * 10) / 10;

    return {
      softwareName: sw.softwareName,
      workloadName: sw.workloadName,
      concurrencyMode: sw.concurrency,
      concurrencyFactor: effectiveWeight,
      estimatedActiveGb,
    };
  });

  const totalWorkloadActive = workloadAllocations.reduce((sum, w) => sum + w.estimatedActiveGb, 0);
  const expectedActiveUsageGb = Math.round((osReserve + backgroundBuffer + totalWorkloadActive) * 10) / 10;
  const headroomPercent = 25; // 25% professional policy headroom
  const recommendedHeadroomGb = Math.round((expectedActiveUsageGb * (headroomPercent / 100)) * 10) / 10;
  const calculatedTargetGb = Math.round((expectedActiveUsageGb + recommendedHeadroomGb) * 10) / 10;

  // Nearest practical standard RAM tiers (8, 16, 24, 32, 48, 64, 96, 128)
  const practicalTiers = [8, 16, 24, 32, 48, 64, 96, 128];
  const recommendedTierValueGb = practicalTiers.find(t => t >= calculatedTargetGb) || 128;

  const isLowerTierInsufficient = hypotheticalLowerTierRamGb < calculatedTargetGb;
  const deficitUnderLowerTierGb = Math.max(0, Math.round((calculatedTargetGb - hypotheticalLowerTierRamGb) * 10) / 10);

  const explanationSummary = isLowerTierInsufficient
    ? `Under simultaneous multi-tasking, active system working sets total ~${expectedActiveUsageGb}GB. With 25% stability headroom for peak garbage collection and buffers, the target is ${calculatedTargetGb}GB, resulting in a ${deficitUnderLowerTierGb}GB deficit under a ${hypotheticalLowerTierRamGb}GB configuration.`
    : `A ${hypotheticalLowerTierRamGb}GB configuration provides sufficient capacity for this stack with active working sets requiring ~${expectedActiveUsageGb}GB.`;

  return {
    component: "memory",
    lowerTierLabel: `${hypotheticalLowerTierRamGb}GB RAM`,
    lowerTierValueGb: hypotheticalLowerTierRamGb,
    recommendedTierLabel: `${recommendedTierValueGb}GB RAM`,
    recommendedTierValueGb,
    osReserveGb: osReserve,
    backgroundBufferGb: backgroundBuffer,
    workloadAllocations,
    expectedActiveUsageGb,
    recommendedHeadroomPercent: headroomPercent,
    recommendedHeadroomGb,
    calculatedTargetGb,
    deficitUnderLowerTierGb,
    isLowerTierInsufficient,
    explanationSummary,
    disclaimer: "Workload memory allocations represent estimated active working sets under concurrency, rather than official vendor minimums.",
  };
}
