import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion, HardwareRequirements } from "../../lib/domain/software";

export interface PublicRequirementSet {
  softwareId: string;
  softwareName: string;
  version: string;
  minimumRequirements: HardwareRequirements;
  recommendedRequirements?: HardwareRequirements;
  workloads: {
    id: string;
    name: string;
    intensity: string;
    typicalRamGb: number;
    peakRamGb: number;
    concurrencyFactor: number;
    usesVirtualization: boolean;
  }[];
}

export interface SimulationBundle {
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
  requirements: PublicRequirementSet[];
  policy: {
    osMemoryReserveGb: Record<string, number>;
    backgroundReserveGb: number;
    safetyHeadroomPercent: number;
    policyVersion: string;
  };
  datasetRevision: string;
  engineVersion: string;
  isSanitized: boolean;
}

export function buildSanitizedSimulationBundle(
  hardware: HardwareProfile,
  workloads: SelectedWorkload[],
  softwareVersions: SoftwareVersion[],
  policyVersion: string = "2026.09-standard",
  datasetRevision: string = "2026.1"
): SimulationBundle {
  const sanitizedRequirements: PublicRequirementSet[] = workloads.map(sw => {
    const version = softwareVersions.find(v => v.id === sw.softwareVersionId) ||
                    softwareVersions.find(v => v.softwareId === sw.softwareId);

    return {
      softwareId: sw.softwareId,
      softwareName: sw.softwareName,
      version: sw.versionString || "Latest",
      minimumRequirements: version?.minimumRequirements || {
        minimumRamGb: 8,
        storage: { installGb: 10 },
        operatingSystems: [],
      },
      recommendedRequirements: version?.recommendedRequirements,
      workloads: (version?.workloads || []).map(w => ({
        id: w.id,
        name: w.name,
        intensity: w.intensity || "medium",
        typicalRamGb: w.typical?.ramGb ?? w.estimatedRamGb?.typical ?? 4,
        peakRamGb: w.peak?.ramGb ?? w.estimatedRamGb?.high ?? 8,
        concurrencyFactor: w.workloadConcurrencyFactor ?? 0.8,
        usesVirtualization: !!w.usesVirtualization,
      })),
    };
  });

  return {
    hardware,
    workloads,
    requirements: sanitizedRequirements,
    policy: {
      osMemoryReserveGb: { windows: 2.5, macos: 2.0, linux: 1.5 },
      backgroundReserveGb: 1.5,
      safetyHeadroomPercent: 0.15,
      policyVersion,
    },
    datasetRevision,
    engineVersion: "1.0.0",
    isSanitized: true,
  };
}
