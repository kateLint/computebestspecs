import { SelectedWorkload, SoftwareVersion } from "../../domain/software";
import { EvaluationPolicy, DEFAULT_EVALUATION_POLICY } from "../policy/evaluation-policy";

export interface AggregatedDemands {
  typicalRamGb: number;
  peakRamGb: number;
  typicalCpuPercent: number;
  peakCpuPercent: number;
  typicalGpuPercent: number;
  peakGpuPercent: number;
  typicalVramGb: number;
  peakVramGb: number;
  totalDiskInstallGb: number;
  totalDiskScratchGb: number;
  maxCpuScoreRequired: number;
  maxGpuScoreRequired: number;
}

export function aggregateResourceDemand(
  workloads: SelectedWorkload[],
  versions: SoftwareVersion[],
  policy: EvaluationPolicy = DEFAULT_EVALUATION_POLICY
): AggregatedDemands {
  let typicalRam = 0;
  let maxAppPeakRam = 0;
  let typicalCpu = 0;
  let peakCpu = 0;
  let typicalGpu = 0;
  let peakGpu = 0;
  let typicalVram = 0;
  let peakVram = 0;
  let totalInstall = 0;
  let totalScratch = 0;
  let maxCpuScore = 0;
  let maxGpuScore = 0;

  const appDeltas: number[] = [];

  for (const sw of workloads) {
    const version = versions.find(v => v.id === sw.softwareVersionId) ||
                    versions.find(v => v.softwareId === sw.softwareId);

    const minReq = version?.minimumRequirements;
    const recReq = version?.recommendedRequirements;

    // Baseline requirements
    if (minReq?.cpu?.minimumPerformanceScore) {
      maxCpuScore = Math.max(maxCpuScore, minReq.cpu.minimumPerformanceScore);
    }
    if (minReq?.gpu?.minimumPerformanceScore) {
      maxGpuScore = Math.max(maxGpuScore, minReq.gpu.minimumPerformanceScore);
    }
    if (minReq?.storage?.installGb) {
      totalInstall += minReq.storage.installGb;
    }
    if (minReq?.storage?.scratchSpaceGb) {
      totalScratch = Math.max(totalScratch, minReq.storage.scratchSpaceGb);
    }

    // Workload Profile matching
    const profile = version?.workloads?.find(w => w.id === sw.workloadId) ||
                    version?.workloads?.[0];

    const concurrencyWeight = policy.concurrencyIntensityWeights[sw.concurrency || "foreground"] ?? 1.0;

    if (profile) {
      const ramTyp = (profile.typical?.ramGb ?? profile.estimatedRamGb?.typical ?? 4.0) * concurrencyWeight;
      const ramPk = (profile.peak?.ramGb ?? profile.estimatedRamGb?.high ?? 8.0) * concurrencyWeight;
      const vramTyp = (profile.typical?.vramGb ?? profile.vramGb?.typical ?? 1.0) * concurrencyWeight;
      const vramPk = profile.peak?.vramGb ?? profile.vramGb?.high ?? 2.0;

      typicalRam += ramTyp;
      maxAppPeakRam = Math.max(maxAppPeakRam, ramPk);
      appDeltas.push(Math.max(0, ramPk - ramTyp));

      typicalVram += vramTyp;
      peakVram = Math.max(peakVram, vramPk);

      typicalCpu += (profile.typical?.cpuLoadPercent ?? profile.cpuLoad ?? 30) * concurrencyWeight;
      peakCpu = Math.min(100, peakCpu + (profile.peak?.cpuLoadPercent ?? 75) * concurrencyWeight);

      typicalGpu += (profile.typical?.gpuLoadPercent ?? profile.gpuLoad ?? 20) * concurrencyWeight;
      peakGpu = Math.min(100, peakGpu + (profile.peak?.gpuLoadPercent ?? 50) * concurrencyWeight);
    } else {
      const baselineRam = (recReq?.recommendedRamGb ?? minReq?.minimumRamGb ?? 4.0) * concurrencyWeight;
      typicalRam += baselineRam;
      maxAppPeakRam = Math.max(maxAppPeakRam, baselineRam * 1.5);
      appDeltas.push(baselineRam * 0.5);
    }
  }

  // Realistic statistical peak: Typical baseline of all concurrent apps + maximum peak burst of the heaviest foreground app
  const maxBurst = appDeltas.length > 0 ? Math.max(...appDeltas) : 0;
  const peakRam = typicalRam + maxBurst;

  return {
    typicalRamGb: Math.round(typicalRam * 10) / 10,
    peakRamGb: Math.round(peakRam * 10) / 10,
    typicalCpuPercent: Math.min(100, Math.round(typicalCpu)),
    peakCpuPercent: Math.min(100, Math.round(peakCpu)),
    typicalGpuPercent: Math.min(100, Math.round(typicalGpu)),
    peakGpuPercent: Math.min(100, Math.round(peakGpu)),
    typicalVramGb: Math.round(typicalVram * 10) / 10,
    peakVramGb: Math.round(peakVram * 10) / 10,
    totalDiskInstallGb: Math.round(totalInstall * 10) / 10,
    totalDiskScratchGb: Math.round(totalScratch * 10) / 10,
    maxCpuScoreRequired: maxCpuScore,
    maxGpuScoreRequired: maxGpuScore,
  };
}
