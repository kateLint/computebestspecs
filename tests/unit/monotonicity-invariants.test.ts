import { describe, it, expect } from "vitest";
import { evaluateCompatibility } from "../../services/compatibility/compatibility-engine";
import { aggregateWorkloadDemands } from "../../services/compatibility/concurrency-model";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";

describe("Monotonicity Invariants & Engine Fuzzing (§42, §43)", () => {
  const sampleVersion: SoftwareVersion = {
    id: "ver_test",
    softwareId: "test_software",
    version: "2024",
    isLatest: true,
    dataQuality: "TEST_DATA_ONLY",
    supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
    minimumRequirements: {
      minimumRamGb: 8,
      recommendedRamGb: 16,
      cpu: { minimumPerformanceScore: 40, recommendedPerformanceScore: 70 },
      gpu: { minimumPerformanceScore: 30, minimumVramGb: 2.0 },
      storage: { installGb: 10, scratchSpaceGb: 10 },
      operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
    },
    workloads: [
      {
        id: "w_test",
        softwareVersionId: "ver_test",
        name: "Standard",
        intensity: "medium",
        typical: { ramGb: 6, cpuLoadPercent: 40, gpuLoadPercent: 30, vramGb: 2, diskScratchGb: 10 },
        peak: { ramGb: 10, cpuLoadPercent: 70, gpuLoadPercent: 50, vramGb: 4, diskScratchGb: 20 },
        estimatedRamGb: { min: 4, typical: 6, high: 10 },
        cpuLoad: 40,
        gpuLoad: 30,
        vramGb: { min: 1, typical: 2, high: 4 },
        workloadConcurrencyFactor: 0.8,
      },
    ],
    sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "fixture", confidence: "high" }],
  };

  const baseHardware: HardwareProfile = {
    cpu: { model: "Test CPU", architecture: "x86_64", performanceScore: 70 },
    gpu: { model: "Test GPU", type: "dedicated", performanceScore: 60, vramGb: 4 },
    ram: { totalGb: 16 },
    storage: [{ type: "NVME_SSD", totalGb: 500, freeGb: 200 }],
    os: { family: "windows", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "desktop",
  };

  const baseWorkload: SelectedWorkload = {
    softwareId: "test_software",
    softwareName: "Test Software",
    softwareVersionId: "ver_test",
    versionString: "2024",
    workloadId: "w_test",
    workloadName: "Standard",
    intensity: "medium",
    concurrency: "foreground",
  };

  it("guarantees RAM monotonicity (more RAM never decreases score) (§42)", () => {
    const ram8 = evaluateCompatibility({ ...baseHardware, ram: { totalGb: 8 } }, [baseWorkload], [sampleVersion], true, false);
    const ram16 = evaluateCompatibility({ ...baseHardware, ram: { totalGb: 16 } }, [baseWorkload], [sampleVersion], true, false);
    const ram32 = evaluateCompatibility({ ...baseHardware, ram: { totalGb: 32 } }, [baseWorkload], [sampleVersion], true, false);
    const ram64 = evaluateCompatibility({ ...baseHardware, ram: { totalGb: 64 } }, [baseWorkload], [sampleVersion], true, false);

    expect(ram16.score).toBeGreaterThanOrEqual(ram8.score);
    expect(ram32.score).toBeGreaterThanOrEqual(ram16.score);
    expect(ram64.score).toBeGreaterThanOrEqual(ram32.score);
  });

  it("guarantees GPU monotonicity (higher GPU performance score never decreases score) (§42)", () => {
    const gpu40 = evaluateCompatibility({ ...baseHardware, gpu: { ...baseHardware.gpu!, performanceScore: 40 } }, [baseWorkload], [sampleVersion], true, false);
    const gpu70 = evaluateCompatibility({ ...baseHardware, gpu: { ...baseHardware.gpu!, performanceScore: 70 } }, [baseWorkload], [sampleVersion], true, false);
    const gpu95 = evaluateCompatibility({ ...baseHardware, gpu: { ...baseHardware.gpu!, performanceScore: 95 } }, [baseWorkload], [sampleVersion], true, false);

    expect(gpu70.score).toBeGreaterThanOrEqual(gpu40.score);
    expect(gpu95.score).toBeGreaterThanOrEqual(gpu70.score);
  });

  it("guarantees workload monotonicity (removing a workload never increases resource demand) (§42)", () => {
    const demandSingle = aggregateWorkloadDemands(baseHardware, [baseWorkload], [sampleVersion], true);
    const demandDouble = aggregateWorkloadDemands(baseHardware, [baseWorkload, baseWorkload], [sampleVersion], true);

    expect(demandDouble.effectiveRequiredRamGb).toBeGreaterThanOrEqual(demandSingle.effectiveRequiredRamGb);
    expect(demandDouble.totalDiskScratchGb).toBeGreaterThanOrEqual(demandSingle.totalDiskScratchGb);
  });

  it("fuzzes engine with 100 randomized valid configurations (§43)", () => {
    const ramOptions = [4, 8, 12, 16, 24, 32, 64, 128, 256];
    const intensities: ("light" | "medium" | "heavy" | "professional")[] = ["light", "medium", "heavy", "professional"];
    const concurrencies: ("foreground" | "background" | "occasional")[] = ["foreground", "background", "occasional"];

    for (let i = 0; i < 100; i++) {
      const randomRam = ramOptions[Math.floor(Math.random() * ramOptions.length)];
      const randomCpuScore = Math.floor(Math.random() * 80) + 20; // 20-100
      const randomGpuScore = Math.floor(Math.random() * 80) + 20; // 20-100
      const randomVram = Math.floor(Math.random() * 16) + 1; // 1-16GB
      const workloadCount = Math.floor(Math.random() * 4) + 1;

      const randomWorkloads: SelectedWorkload[] = [];
      for (let w = 0; w < workloadCount; w++) {
        randomWorkloads.push({
          softwareId: "test_software",
          softwareName: `App ${w}`,
          softwareVersionId: "ver_test",
          versionString: "2024",
          workloadId: "w_test",
          workloadName: "Standard",
          intensity: intensities[Math.floor(Math.random() * intensities.length)],
          concurrency: concurrencies[Math.floor(Math.random() * concurrencies.length)],
          quantity: Math.floor(Math.random() * 3) + 1,
        });
      }

      const randomPc: HardwareProfile = {
        cpu: { model: `CPU-${i}`, architecture: "x86_64", performanceScore: randomCpuScore },
        gpu: { model: `GPU-${i}`, type: "dedicated", performanceScore: randomGpuScore, vramGb: randomVram },
        ram: { totalGb: randomRam },
        storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 500 }],
        os: { family: "windows", architecture: "x86_64" },
        architecture: "x86_64",
        deviceType: "desktop",
      };

      const result = evaluateCompatibility(randomPc, randomWorkloads, [sampleVersion], true, false);

      expect(typeof result.score).toBe("number");
      expect(Number.isNaN(result.score)).toBe(false);
      expect(Number.isFinite(result.score)).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.concurrencyMetrics.effectiveRequiredRamGb).toBeGreaterThan(0);
      expect(result.meta.evaluationFingerprint).toBeDefined();
    }
  });
});
