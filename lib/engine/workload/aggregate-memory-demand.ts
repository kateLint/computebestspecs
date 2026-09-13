import { SelectedWorkload, SoftwareVersion } from "../../domain/software";
import { OperatingSystemFamily } from "../../domain/hardware";
import { EvaluationPolicy, DEFAULT_POLICY } from "../policy/default-policy";

export interface MemoryDemandSummary {
  osReserveGb: number;
  appsTypicalGb: number;
  appsPeakGb: number;
  safetyHeadroomGb: number;
  totalTypicalGb: number;
  totalPeakGb: number;
  typicalPressureRatio: number;
  peakPressureRatio: number;
  status: "ADEQUATE" | "BORDERLINE" | "INSUFFICIENT";
  isBottleneck: boolean;
}

export function aggregateMemoryDemand(
  installedRamGb: number,
  osFamily: OperatingSystemFamily,
  workloads: SelectedWorkload[],
  versions: SoftwareVersion[],
  policy: EvaluationPolicy = DEFAULT_POLICY
): MemoryDemandSummary {
  let appsTypical = 0;
  const appDeltas: number[] = [];

  for (const sw of workloads) {
    const version = versions.find(v => v.id === sw.softwareVersionId) ||
                    versions.find(v => v.softwareId === sw.softwareId);

    const profile = version?.workloads?.find(w => w.id === sw.workloadId) ||
                    version?.workloads?.[0];

    const concurrencyWeight = sw.concurrency === "background"
      ? policy.concurrency.backgroundFactor
      : sw.concurrency === "occasional"
      ? policy.concurrency.occasionalFactor
      : policy.concurrency.foregroundFactor;

    if (profile) {
      const typical = (profile.typical?.ramGb ?? profile.estimatedRamGb?.typical ?? 4.0) * concurrencyWeight;
      const peak = (profile.peak?.ramGb ?? profile.estimatedRamGb?.high ?? 8.0) * concurrencyWeight;

      appsTypical += typical;
      appDeltas.push(Math.max(0, peak - typical));
    } else {
      const minReq = version?.minimumRequirements?.minimumRamGb ?? 4.0;
      const typical = minReq * concurrencyWeight;
      appsTypical += typical;
      appDeltas.push(typical * 0.5);
    }
  }

  const maxBurst = appDeltas.length > 0 ? Math.max(...appDeltas) : 0;
  const appsPeak = appsTypical + maxBurst;

  const osReserve = policy.memory.osReserveGb[osFamily] ?? policy.memory.osReserveGb.other;
  const safetyHeadroom = appsPeak * (policy.memory.safetyHeadroomPercent / 100);

  const totalTypical = Math.round((osReserve + appsTypical) * 10) / 10;
  const totalPeak = Math.round((osReserve + appsPeak + safetyHeadroom) * 10) / 10;

  const availableRam = Math.max(1, installedRamGb);
  const typicalPressureRatio = Math.round((totalTypical / availableRam) * 100) / 100;
  const peakPressureRatio = Math.round((totalPeak / availableRam) * 100) / 100;

  let status: "ADEQUATE" | "BORDERLINE" | "INSUFFICIENT" = "ADEQUATE";
  if (peakPressureRatio > policy.memory.severePressureThreshold) {
    status = "INSUFFICIENT";
  } else if (peakPressureRatio > policy.memory.bottleneckPressureThreshold) {
    status = "BORDERLINE";
  }

  const isBottleneck = peakPressureRatio > policy.memory.bottleneckPressureThreshold;

  return {
    osReserveGb: osReserve,
    appsTypicalGb: Math.round(appsTypical * 10) / 10,
    appsPeakGb: Math.round(appsPeak * 10) / 10,
    safetyHeadroomGb: Math.round(safetyHeadroom * 10) / 10,
    totalTypicalGb: totalTypical,
    totalPeakGb: totalPeak,
    typicalPressureRatio,
    peakPressureRatio,
    status,
    isBottleneck,
  };
}
