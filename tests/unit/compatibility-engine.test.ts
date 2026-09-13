import { describe, it, expect } from "vitest";
import { evaluateCompatibility } from "../../services/compatibility/compatibility-engine";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";

describe("Compatibility Engine", () => {
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
        gpu: { minimumPerformanceScore: 35, minimumVramGb: 1.5, requiresDirectX12: true },
        storage: { installGb: 20, scratchSpaceGb: 20 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_ps",
          softwareVersionId: "ver_ps",
          name: "Standard Editing",
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
          name: "Standard IDE",
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
        requiresVirtualization: true,
        storage: { installGb: 10, scratchSpaceGb: 10 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w_emu",
          softwareVersionId: "ver_emu",
          name: "Single Virtual Device",
          intensity: "medium",
          typical: { ramGb: 4, cpuLoadPercent: 45, gpuLoadPercent: 35, vramGb: 2, diskScratchGb: 10 },
          peak: { ramGb: 6, cpuLoadPercent: 75, gpuLoadPercent: 55, vramGb: 3, diskScratchGb: 20 },
          estimatedRamGb: { min: 3, typical: 4, high: 6 },
          cpuLoad: 45,
          gpuLoad: 35,
          usesVirtualization: true,
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
          name: "20+ Tabs Heavy",
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

  it("evaluates Primary Scenario with Simulation-Based Upgrade Sensitivity (§14-§15)", () => {
    const pc: HardwareProfile = {
      cpu: { model: "AMD Ryzen 5 5600H", architecture: "x86_64", physicalCores: 6, performanceScore: 68, laptopVariant: true },
      gpu: { model: "NVIDIA GeForce RTX 3050 Laptop GPU", type: "dedicated", performanceScore: 55, vramGb: 4.0, supportsCuda: true },
      ram: { totalGb: 16 },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 200 }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
    };

    const workloads: SelectedWorkload[] = [
      { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_ps", versionString: "2024", workloadId: "w_ps", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-studio", softwareName: "Android Studio", softwareVersionId: "ver_as", versionString: "2024", workloadId: "w_as", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-emulator", softwareName: "Android Emulator", softwareVersionId: "ver_emu", versionString: "2024", workloadId: "w_emu", workloadName: "Emulator", intensity: "medium", concurrency: "background" },
      { softwareId: "google-chrome", softwareName: "Chrome", softwareVersionId: "ver_chrome", versionString: "2024", workloadId: "w_chrome", workloadName: "Chrome Heavy", intensity: "heavy", concurrency: "background" },
    ];

    const result = evaluateCompatibility(pc, workloads, sampleVersions, true, true);

    expect(result.compatibilityStatus).toBe("compatible");
    expect(result.isHardIncompatible).toBe(false);

    // RAM must be identified as bottleneck
    const memoryBottleneck = result.bottlenecks.find(b => b.component === "memory");
    expect(memoryBottleneck).toBeDefined();

    // Upgrade recommendation must include simulated delta score
    const ramUpgrade = result.upgradeRecommendations.find(u => u.component === "memory");
    expect(ramUpgrade).toBeDefined();
    expect(ramUpgrade?.simulationDelta).toBeDefined();
    expect(ramUpgrade?.simulationDelta?.deltaScore).toBeGreaterThanOrEqual(0);
  });

  it("enforces Hard Incompatibility on OS mismatch even if hardware is high-end (§114)", () => {
    const highEndPc: HardwareProfile = {
      cpu: { model: "AMD Ryzen 9 7950X", architecture: "x86_64", performanceScore: 98 },
      gpu: { model: "NVIDIA RTX 4090", type: "dedicated", performanceScore: 99, vramGb: 24 },
      ram: { totalGb: 64 },
      storage: [{ type: "NVME_SSD", totalGb: 2000 }],
      os: { family: "linux", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
    };

    const workloads: SelectedWorkload[] = [
      { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_ps", versionString: "2024", workloadId: "w_ps", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
    ];

    const result = evaluateCompatibility(highEndPc, workloads, sampleVersions, true, true);
    expect(result.compatibilityStatus).toBe("incompatible");
    expect(result.performanceTier).toBe("poor");
    expect(result.score).toBe(0);
  });

  it("handles Data Quality Gate and caps confidence when records are partial or stale (§2, §18)", () => {
    const staleVersions: SoftwareVersion[] = [
      {
        ...sampleVersions[0],
        dataQuality: "STALE",
        sourceRecords: [{ retrievedAt: "2020-01-01T00:00:00.000Z", type: "manual", confidence: "low" }],
      },
    ];

    const pc: HardwareProfile = {
      cpu: { model: "Intel Core i7-13700K", architecture: "x86_64", performanceScore: 90 },
      gpu: { model: "NVIDIA RTX 4070", type: "dedicated", performanceScore: 85, vramGb: 12 },
      ram: { totalGb: 32 },
      storage: [{ type: "NVME_SSD", totalGb: 1000 }],
      os: { family: "windows", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
    };

    const workloads: SelectedWorkload[] = [
      { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_ps", versionString: "2024", workloadId: "w_ps", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
    ];

    const result = evaluateCompatibility(pc, workloads, staleVersions, false, false);
    expect(result.confidence).toBeLessThanOrEqual(60);
    expect(result.perAppEvaluations[0].requirementProvenance.isFresh).toBe(false);
  });

  it("evaluates Workload Quantity Scaling (§13) for multiple VM/Emulator instances", () => {
    const pc: HardwareProfile = {
      cpu: { model: "AMD Ryzen 5 5600X", architecture: "x86_64", performanceScore: 70 },
      gpu: { model: "NVIDIA RTX 3060", type: "dedicated", performanceScore: 65, vramGb: 12 },
      ram: { totalGb: 16 },
      storage: [{ type: "NVME_SSD", totalGb: 500, freeGb: 100 }],
      os: { family: "windows", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
    };

    // 5 Android Emulators running simultaneously (5 * 4GB * 0.6 + 4GB OS base = 16GB + 15% headroom = 18.4GB > 16GB)
    const workloads: SelectedWorkload[] = [
      {
        softwareId: "android-emulator",
        softwareName: "Android Emulator",
        softwareVersionId: "ver_emu",
        versionString: "2024",
        workloadId: "w_emu",
        workloadName: "Virtual Device",
        intensity: "medium",
        concurrency: "foreground",
        quantity: 5,
      },
    ];

    const result = evaluateCompatibility(pc, workloads, sampleVersions, true, false);
    const ramBottleneck = result.bottlenecks.find(b => b.component === "memory");
    expect(ramBottleneck).toBeDefined();
  });
});
