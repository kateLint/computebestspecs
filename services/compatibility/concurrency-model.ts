import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion, WorkloadProfile } from "../../lib/domain/software";
import { ConcurrencyMetrics } from "../../lib/domain/compatibility";

export const CONCURRENCY_MODE_FACTORS = {
  foreground: 1.0,
  background: 0.65,
  occasional: 0.35,
};

export const OS_MEMORY_RESERVE_GB = {
  windows: 2.5,
  macos: 2.0,
  linux: 1.5,
};

export const BACKGROUND_APPS_RESERVE_GB = 1.5;
export const SAFETY_HEADROOM_PERCENT = 0.15; // 15% configurable policy headroom

export interface AggregatedWorkloadDemands {
  steadyStateRamGb: number;
  peakConcurrentRamGb: number;
  totalEstimatedRamUsageGb: number;
  safetyHeadroomGb: number;
  osBackgroundReserveGb: number;
  effectiveRequiredRamGb: number;
  peakSingleAppRamGb: number;
  peakSingleAppVramGb: number;
  totalVramDemandGb: number;
  maxCpuScoreRequired: number;
  maxGpuScoreRequired: number;
  requiresVirtualization: boolean;
  requiresDedicatedGpu: boolean;
  requiredGpuApis: {
    cuda: boolean;
    metal: boolean;
    directx12: boolean;
    vulkan: boolean;
  };
  totalDiskInstallGb: number;
  totalDiskScratchGb: number;
  totalTemporaryPeakGb: number;
}

export function aggregateWorkloadDemands(
  hardware: HardwareProfile,
  selectedWorkloads: SelectedWorkload[],
  softwareVersions: SoftwareVersion[],
  isSimultaneous: boolean
): AggregatedWorkloadDemands {
  const osReserve = OS_MEMORY_RESERVE_GB[hardware.os.family] || 2.0;
  const backgroundReserve = BACKGROUND_APPS_RESERVE_GB;
  const osAndBgTotal = osReserve + backgroundReserve;

  let steadyWorkloadRam = 0;
  let peakWorkloadRam = 0;
  let peakSingleAppRam = 0;
  let peakSingleAppVram = 0;
  let totalVram = 0;
  let maxCpuScore = 0;
  let maxGpuScore = 0;
  let requiresVirtualization = false;
  let requiresDedicatedGpu = false;
  const requiredGpuApis = { cuda: false, metal: false, directx12: false, vulkan: false };
  let totalDiskInstall = 0;
  let totalDiskScratch = 0;
  let totalTemporaryPeak = 0;

  for (const sw of selectedWorkloads) {
    const version = softwareVersions.find(v => v.id === sw.softwareVersionId) ||
                    softwareVersions.find(v => v.softwareId === sw.softwareId);

    const workload = version?.workloads.find(w => w.id === sw.workloadId) ||
                     version?.workloads[0];

    const quantity = sw.quantity || 1;
    const modeFactor = isSimultaneous ? (CONCURRENCY_MODE_FACTORS[sw.concurrency] || 1.0) : 0;
    const workloadFactor = workload?.workloadConcurrencyFactor ?? (workload as any)?.workloadConcurrencyFactor ?? 1.0;
    const effectiveConcurrencyWeight = modeFactor * workloadFactor;

    let appTypicalRam = 4;
    let appPeakRam = 6;
    let appVram = 0;
    let appScratch = 5;
    let appTempPeak = 10;

    if (workload) {
      const ramMin = workload.estimatedRamGb?.min ?? (workload as any).estimatedRamMin ?? 4;
      const ramTyp = workload.estimatedRamGb?.typical ?? (workload as any).estimatedRamTypical ?? 6;
      const ramHigh = workload.estimatedRamGb?.high ?? (workload as any).estimatedRamHigh ?? 12;

      const vramMin = workload.vramGb?.min ?? (workload as any).vramMin ?? 0;
      const vramTyp = workload.vramGb?.typical ?? (workload as any).vramTypical ?? 1;
      const vramHigh = workload.vramGb?.high ?? (workload as any).vramHigh ?? 2;

      const scratchMin = workload.diskWorkingSpaceGb?.min ?? (workload as any).diskScratchMin ?? 5;
      const scratchTyp = workload.diskWorkingSpaceGb?.typical ?? (workload as any).diskScratchTypical ?? 10;
      const scratchHigh = workload.diskWorkingSpaceGb?.high ?? (workload as any).diskScratchHigh ?? 20;

      appTempPeak = (workload as any).temporaryPeakGb ?? 15;

      if (sw.intensity === "light") {
        appTypicalRam = ramMin;
        appPeakRam = ramTyp;
        appVram = vramMin;
        appScratch = scratchMin;
      } else if (sw.intensity === "heavy" || sw.intensity === "professional") {
        appTypicalRam = ramTyp;
        appPeakRam = ramHigh;
        appVram = vramHigh;
        appScratch = scratchHigh;
      } else {
        appTypicalRam = ramTyp;
        appPeakRam = ramHigh;
        appVram = vramTyp;
        appScratch = scratchTyp;
      }

      if (workload.usesVirtualization) requiresVirtualization = true;
      if (workload.requiresDedicatedGpu) requiresDedicatedGpu = true;
    } else if (version) {
      appTypicalRam = version.minimumRequirements.minimumRamGb || 8;
      appPeakRam = version.recommendedRequirements?.minimumRamGb || 16;
      appVram = version.recommendedRequirements?.gpu?.minimumVramGb || 0;
      appScratch = version.minimumRequirements.storage.scratchSpaceGb || 10;
      appTempPeak = version.minimumRequirements.storage.temporaryPeakGb || 15;
    }

    if (version?.minimumRequirements.requiresVirtualization) {
      requiresVirtualization = true;
    }

    if (version?.minimumRequirements.gpu?.requiresCuda) requiredGpuApis.cuda = true;
    if (version?.minimumRequirements.gpu?.requiresMetal) requiredGpuApis.metal = true;
    if (version?.minimumRequirements.gpu?.requiresDirectX12) requiredGpuApis.directx12 = true;
    if (version?.minimumRequirements.gpu?.requiresVulkan) requiredGpuApis.vulkan = true;

    const reqCpuScore = version?.recommendedRequirements?.cpu?.recommendedPerformanceScore ||
                        version?.minimumRequirements.cpu?.minimumPerformanceScore || 40;
    const reqGpuScore = version?.recommendedRequirements?.gpu?.recommendedPerformanceScore ||
                        version?.minimumRequirements.gpu?.minimumPerformanceScore || 30;

    if (reqCpuScore > maxCpuScore) maxCpuScore = reqCpuScore;
    if (reqGpuScore > maxGpuScore) maxGpuScore = reqGpuScore;

    const installSpace = version?.minimumRequirements.storage.installGb || 5;
    totalDiskInstall += installSpace;
    totalDiskScratch += appScratch * quantity;
    totalTemporaryPeak += appTempPeak * quantity;

    if (appPeakRam > peakSingleAppRam) peakSingleAppRam = appPeakRam;
    if (appVram > peakSingleAppVram) peakSingleAppVram = appVram;

    if (isSimultaneous) {
      steadyWorkloadRam += appTypicalRam * quantity * effectiveConcurrencyWeight;
      peakWorkloadRam += appPeakRam * quantity * effectiveConcurrencyWeight;
      totalVram += appVram * quantity * (sw.concurrency === "foreground" ? 1.0 : 0.5);
    }
  }

  const effectiveWorkloadRam = isSimultaneous ? steadyWorkloadRam : peakSingleAppRam;
  const effectiveVram = isSimultaneous ? Math.max(peakSingleAppVram, totalVram) : peakSingleAppVram;

  const subtotalRam = osAndBgTotal + effectiveWorkloadRam;
  const safetyHeadroom = subtotalRam * SAFETY_HEADROOM_PERCENT;
  const effectiveRequiredRamGb = Math.round((subtotalRam + safetyHeadroom) * 10) / 10;

  return {
    steadyStateRamGb: Math.round((osAndBgTotal + steadyWorkloadRam) * 10) / 10,
    peakConcurrentRamGb: Math.round((osAndBgTotal + peakWorkloadRam) * 10) / 10,
    totalEstimatedRamUsageGb: Math.round(subtotalRam * 10) / 10,
    safetyHeadroomGb: Math.round(safetyHeadroom * 10) / 10,
    osBackgroundReserveGb: Math.round(osAndBgTotal * 10) / 10,
    effectiveRequiredRamGb,
    peakSingleAppRamGb: peakSingleAppRam,
    peakSingleAppVramGb: peakSingleAppVram,
    totalVramDemandGb: Math.round(effectiveVram * 10) / 10,
    maxCpuScoreRequired: maxCpuScore,
    maxGpuScoreRequired: maxGpuScore,
    requiresVirtualization,
    requiresDedicatedGpu,
    requiredGpuApis,
    totalDiskInstallGb: totalDiskInstall,
    totalDiskScratchGb: totalDiskScratch,
    totalTemporaryPeakGb: totalTemporaryPeak,
  };
}

export function computeConcurrencyMetrics(
  hardware: HardwareProfile,
  demands: AggregatedWorkloadDemands,
  selectedWorkloads: SelectedWorkload[],
  isSimultaneous: boolean
): ConcurrencyMetrics {
  const physicalRam = hardware.ram.totalGb;
  const ramPressureRatio = Math.round((demands.effectiveRequiredRamGb / physicalRam) * 100) / 100;
  const isSwappingLikely = demands.totalEstimatedRamUsageGb > physicalRam;

  return {
    steadyStateRamGb: demands.steadyStateRamGb,
    peakConcurrentRamGb: demands.peakConcurrentRamGb,
    totalEstimatedRamUsageGb: demands.totalEstimatedRamUsageGb,
    safetyHeadroomGb: demands.safetyHeadroomGb,
    osBackgroundReserveGb: demands.osBackgroundReserveGb,
    effectiveRequiredRamGb: demands.effectiveRequiredRamGb,
    ramPressureRatio,
    isSwappingLikely,
    activeWorkloadCount: selectedWorkloads.length,
    isSimultaneous,
  };
}
