import { describe, it, expect } from "vitest";
import { recommendHardware } from "../../services/recommendations/recommendation-engine";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";

describe("Recommendation Engine", () => {
  const sampleVersions: SoftwareVersion[] = [
    {
      id: "ver_ps",
      softwareId: "photoshop",
      version: "2024",
      isLatest: true,
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 8,
        recommendedRamGb: 16,
        cpu: { minimumPerformanceScore: 45, recommendedPerformanceScore: 70 },
        gpu: { minimumPerformanceScore: 35, minimumVramGb: 2.0 },
        storage: { installGb: 20 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_ps",
          softwareVersionId: "ver_ps",
          name: "Standard Editing",
          intensity: "medium",
          estimatedRamGb: { min: 4, typical: 7, high: 12 },
          cpuLoad: 40,
          gpuLoad: 35,
          vramGb: { min: 2, typical: 4, high: 6 },
        },
      ],
      sourceRecords: [],
    },
    {
      id: "ver_as",
      softwareId: "android-studio",
      version: "2024",
      isLatest: true,
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 8,
        recommendedRamGb: 16,
        cpu: { minimumPerformanceScore: 50, recommendedPerformanceScore: 75 },
        storage: { installGb: 15 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_as",
          softwareVersionId: "ver_as",
          name: "Standard IDE",
          intensity: "medium",
          estimatedRamGb: { min: 4, typical: 6, high: 10 },
          cpuLoad: 60,
          gpuLoad: 15,
        },
      ],
      sourceRecords: [],
    },
    {
      id: "ver_emu",
      softwareId: "android-emulator",
      version: "2024",
      isLatest: true,
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 4,
        requiresVirtualization: true,
        storage: { installGb: 10 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_emu",
          softwareVersionId: "ver_emu",
          name: "Emulator",
          intensity: "medium",
          estimatedRamGb: { min: 3, typical: 4, high: 6 },
          cpuLoad: 45,
          gpuLoad: 35,
          usesVirtualization: true,
        },
      ],
      sourceRecords: [],
    },
  ];

  it("produces 3 distinct tiers (Minimum, Recommended, Professional) with concurrency awareness", () => {
    const workloads: SelectedWorkload[] = [
      { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_ps", versionString: "2024", workloadId: "w_ps", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-studio", softwareName: "Android Studio", softwareVersionId: "ver_as", versionString: "2024", workloadId: "w_as", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-emulator", softwareName: "Android Emulator", softwareVersionId: "ver_emu", versionString: "2024", workloadId: "w_emu", workloadName: "Emulator", intensity: "medium", concurrency: "foreground" },
    ];

    const recommendation = recommendHardware(workloads, sampleVersions, { deviceType: "desktop", preferredOs: "windows" }, true);

    expect(recommendation.minimum).toBeDefined();
    expect(recommendation.recommended).toBeDefined();
    expect(recommendation.professional).toBeDefined();

    expect(recommendation.recommended.ramGb).toBeGreaterThanOrEqual(32);
    expect(recommendation.professional.ramGb).toBeGreaterThanOrEqual(32);
    expect(recommendation.explanations.length).toBeGreaterThan(0);
  });
});
