import { describe, it, expect } from "vitest";
import goldenData from "./golden-evaluations.json";
import { evaluateCompatibility } from "../../services/compatibility/compatibility-engine";
import { SoftwareVersion, SelectedWorkload } from "../../lib/domain/software";

describe("Golden Evaluation Fixture Regressions (§41)", () => {
  const sampleVersions: SoftwareVersion[] = [
    {
      id: "ver_ps",
      softwareId: "photoshop",
      version: "2024",
      isLatest: true,
      dataQuality: "TEST_DATA_ONLY",
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 8,
        recommendedRamGb: 16,
        cpu: { minimumPerformanceScore: 45, recommendedPerformanceScore: 70 },
        gpu: { minimumPerformanceScore: 35, minimumVramGb: 1.5 },
        storage: { installGb: 20, scratchSpaceGb: 20 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_ps",
          softwareVersionId: "ver_ps",
          name: "Standard",
          intensity: "medium",
          typical: { ramGb: 7, cpuLoadPercent: 40, gpuLoadPercent: 35, vramGb: 3, diskScratchGb: 25 },
          peak: { ramGb: 12, cpuLoadPercent: 75, gpuLoadPercent: 60, vramGb: 4, diskScratchGb: 50 },
          estimatedRamGb: { min: 4, typical: 7, high: 12 },
          cpuLoad: 40,
          gpuLoad: 35,
          vramGb: { min: 1.5, typical: 3.0, high: 4.0 },
          workloadConcurrencyFactor: 0.8,
        },
      ],
      sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "fixture", confidence: "high" }],
    },
    {
      id: "ver_as",
      softwareId: "android-studio",
      version: "2024",
      isLatest: true,
      dataQuality: "TEST_DATA_ONLY",
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 8,
        recommendedRamGb: 16,
        cpu: { minimumPerformanceScore: 50, recommendedPerformanceScore: 75 },
        storage: { installGb: 15, scratchSpaceGb: 20 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_as",
          softwareVersionId: "ver_as",
          name: "Standard",
          intensity: "medium",
          typical: { ramGb: 6, cpuLoadPercent: 60, gpuLoadPercent: 15, vramGb: 1, diskScratchGb: 20 },
          peak: { ramGb: 10, cpuLoadPercent: 90, gpuLoadPercent: 25, vramGb: 2, diskScratchGb: 40 },
          estimatedRamGb: { min: 4, typical: 6, high: 10 },
          cpuLoad: 60,
          gpuLoad: 15,
          workloadConcurrencyFactor: 0.7,
        },
      ],
      sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "fixture", confidence: "high" }],
    },
    {
      id: "ver_emu",
      softwareId: "android-emulator",
      version: "2024",
      isLatest: true,
      dataQuality: "TEST_DATA_ONLY",
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 4,
        recommendedRamGb: 8,
        storage: { installGb: 10, scratchSpaceGb: 10 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_emu",
          softwareVersionId: "ver_emu",
          name: "Emulator",
          intensity: "medium",
          typical: { ramGb: 4, cpuLoadPercent: 45, gpuLoadPercent: 35, vramGb: 2, diskScratchGb: 10 },
          peak: { ramGb: 6, cpuLoadPercent: 75, gpuLoadPercent: 55, vramGb: 3, diskScratchGb: 20 },
          estimatedRamGb: { min: 3, typical: 4, high: 6 },
          cpuLoad: 45,
          gpuLoad: 35,
          workloadConcurrencyFactor: 0.6,
        },
      ],
      sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "fixture", confidence: "high" }],
    },
    {
      id: "ver_chrome",
      softwareId: "google-chrome",
      version: "2024",
      isLatest: true,
      dataQuality: "TEST_DATA_ONLY",
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 4,
        storage: { installGb: 2 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_chrome",
          softwareVersionId: "ver_chrome",
          name: "Chrome Heavy",
          intensity: "heavy",
          typical: { ramGb: 6, cpuLoadPercent: 30, gpuLoadPercent: 20, vramGb: 1, diskScratchGb: 10 },
          peak: { ramGb: 9, cpuLoadPercent: 50, gpuLoadPercent: 30, vramGb: 2, diskScratchGb: 20 },
          estimatedRamGb: { min: 4, typical: 6, high: 9 },
          cpuLoad: 30,
          gpuLoad: 20,
          workloadConcurrencyFactor: 0.5,
        },
      ],
      sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "fixture", confidence: "high" }],
    },
  ];

  it("evaluates Mid-range Developer Laptop scenario against golden expectation", () => {
    const scenario = goldenData.scenarios[0];
    const workloads: SelectedWorkload[] = [
      { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_ps", versionString: "2024", workloadId: "w_ps", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-studio", softwareName: "Android Studio", softwareVersionId: "ver_as", versionString: "2024", workloadId: "w_as", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-emulator", softwareName: "Android Emulator", softwareVersionId: "ver_emu", versionString: "2024", workloadId: "w_emu", workloadName: "Emulator", intensity: "medium", concurrency: "background" },
      { softwareId: "google-chrome", softwareName: "Chrome", softwareVersionId: "ver_chrome", versionString: "2024", workloadId: "w_chrome", workloadName: "Chrome Heavy", intensity: "heavy", concurrency: "background" },
    ];

    const result = evaluateCompatibility(scenario.hardware as any, workloads, sampleVersions, true, true);

    expect(result.compatibilityStatus).toBe(scenario.expected.compatibilityStatus);
    expect(result.score).toBeGreaterThanOrEqual(scenario.expected.minExpectedScore!);
    expect(result.score).toBeLessThanOrEqual(scenario.expected.maxExpectedScore!);

    const memoryBottleneck = result.bottlenecks.find(b => b.component === scenario.expected.primaryBottleneckComponent);
    expect(memoryBottleneck).toBeDefined();
  });

  it("evaluates OS Incompatibility scenario against golden expectation", () => {
    const scenario = goldenData.scenarios[1];
    const workloads: SelectedWorkload[] = [
      { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_ps", versionString: "2024", workloadId: "w_ps", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
    ];

    const result = evaluateCompatibility(scenario.hardware as any, workloads, sampleVersions, true, true);

    expect(result.compatibilityStatus).toBe(scenario.expected.compatibilityStatus);
    expect(result.performanceTier).toBe(scenario.expected.performanceTier);
    expect(result.score).toBe(scenario.expected.score);
  });
});
