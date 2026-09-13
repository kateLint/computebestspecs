import { describe, it, expect } from "vitest";
import { aggregateWorkloadDemands } from "../../services/compatibility/concurrency-model";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";

describe("Concurrency Model", () => {
  const dummyHardware: HardwareProfile = {
    cpu: { model: "Ryzen 5 5600H", architecture: "x86_64" },
    ram: { totalGb: 16 },
    storage: [{ type: "NVME_SSD", totalGb: 512 }],
    os: { family: "windows", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "laptop",
  };

  const sampleVersions: SoftwareVersion[] = [
    {
      id: "ps_v1",
      softwareId: "photoshop",
      version: "2024",
      isLatest: true,
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 8,
        storage: { installGb: 20 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "ps_standard",
          softwareVersionId: "ps_v1",
          name: "Standard Editing",
          intensity: "medium",
          estimatedRamGb: { min: 4, typical: 7, high: 12 },
          cpuLoad: 40,
          gpuLoad: 30,
        },
      ],
      sourceRecords: [],
    },
    {
      id: "as_v1",
      softwareId: "android-studio",
      version: "2024",
      isLatest: true,
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 8,
        storage: { installGb: 15 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "as_standard",
          softwareVersionId: "as_v1",
          name: "Standard IDE",
          intensity: "medium",
          estimatedRamGb: { min: 4, typical: 6, high: 10 },
          cpuLoad: 60,
          gpuLoad: 10,
        },
      ],
      sourceRecords: [],
    },
  ];

  it("calculates single-app peak requirement when simultaneous is false", () => {
    const workloads: SelectedWorkload[] = [
      {
        softwareId: "photoshop",
        softwareName: "Photoshop",
        softwareVersionId: "ps_v1",
        versionString: "2024",
        workloadId: "ps_standard",
        workloadName: "Standard",
        intensity: "medium",
        concurrency: "foreground",
      },
      {
        softwareId: "android-studio",
        softwareName: "Android Studio",
        softwareVersionId: "as_v1",
        versionString: "2024",
        workloadId: "as_standard",
        workloadName: "Standard",
        intensity: "medium",
        concurrency: "foreground",
      },
    ];

    const demands = aggregateWorkloadDemands(dummyHardware, workloads, sampleVersions, false);
    expect(demands.peakSingleAppRamGb).toBe(12);
    expect(demands.effectiveRequiredRamGb).toBeGreaterThanOrEqual(12);
  });

  it("aggregates concurrent memory using concurrency factors when simultaneous is true", () => {
    const workloads: SelectedWorkload[] = [
      {
        softwareId: "photoshop",
        softwareName: "Photoshop",
        softwareVersionId: "ps_v1",
        versionString: "2024",
        workloadId: "ps_standard",
        workloadName: "Standard",
        intensity: "medium",
        concurrency: "foreground", // factor 1.0 -> 7GB
      },
      {
        softwareId: "android-studio",
        softwareName: "Android Studio",
        softwareVersionId: "as_v1",
        versionString: "2024",
        workloadId: "as_standard",
        workloadName: "Standard",
        intensity: "medium",
        concurrency: "background", // factor 0.65 -> 6 * 0.65 = 3.9GB
      },
    ];

    const demands = aggregateWorkloadDemands(dummyHardware, workloads, sampleVersions, true);
    expect(demands.effectiveRequiredRamGb).toBeGreaterThan(16);
  });
});
