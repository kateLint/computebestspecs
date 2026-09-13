import { describe, it, expect } from "vitest";
import { parseNaturalLanguagePcSpec } from "../../services/normalization/natural-language-spec-parser";
import { detectSemanticRequirementChanges, evaluateStagingPromotionImpact } from "../../services/ingestion/data-control-plane";
import { generateReverseExplainability } from "../../services/compatibility/reverse-explainability";
import { calculateUpgradeValue } from "../../services/recommendations/upgrade-value";
import { Cpu, Gpu, HardwareProfile } from "../../lib/domain/hardware";
import { SoftwareVersion, SelectedWorkload, HardwareRequirements } from "../../lib/domain/software";

describe("Production Refinements & Governance Suite", () => {
  const sampleCpuCatalog: Cpu[] = [
    { id: "cpu_i7_13700k", manufacturer: "Intel", model: "Intel Core i7-13700K", architecture: "x86_64", performanceScore: 92, aliases: ["13700K", "i7 13700K"] },
    { id: "cpu_i7_8700k", manufacturer: "Intel", model: "Intel Core i7-8700K", architecture: "x86_64", performanceScore: 52, aliases: ["8700K", "i7 8700K"] },
    { id: "cpu_i7_4790k", manufacturer: "Intel", model: "Intel Core i7-4790K", architecture: "x86_64", performanceScore: 35, aliases: ["4790K", "i7 4790K"] },
  ];

  const sampleGpuCatalog: Gpu[] = [
    { id: "gpu_rtx_2060", manufacturer: "NVIDIA", model: "NVIDIA GeForce RTX 2060", type: "dedicated", performanceScore: 50, vramGb: 6, supportsCuda: true, aliases: ["RTX 2060", "GeForce RTX 2060"] },
    { id: "gpu_rtx_4070", manufacturer: "NVIDIA", model: "NVIDIA GeForce RTX 4070", type: "dedicated", performanceScore: 88, vramGb: 12, supportsCuda: true, aliases: ["RTX 4070"] },
  ];

  it("1. Parses natural-language PC spec with Ambiguity Preservation (§3)", () => {
    // "old i7" should NOT guess automatically; RTX 2060 and 16GB RAM should be resolved
    const parsed = parseNaturalLanguagePcSpec(
      "I have an old i7 with an RTX 2060 and 16GB RAM and 512GB SSD",
      sampleCpuCatalog,
      sampleGpuCatalog
    );

    expect(parsed.ramGb?.parsedGb).toBe(16);
    expect(parsed.storageGb?.parsedGb).toBe(512);

    // GPU is resolved
    expect(["EXACT", "HIGH_CONFIDENCE"]).toContain(parsed.gpu?.status);
    expect(parsed.gpu?.canonicalEntity?.id).toBe("gpu_rtx_2060");

    // CPU must be preserved as AMBIGUOUS without guessing
    expect(parsed.cpu.needsUserClarification).toBe(true);
    expect(parsed.isFullyResolved).toBe(false);
    expect(parsed.unresolvedFields).toContain("cpu");
  });

  it("2. Detects semantic breaking changes in requirement candidates (§5)", () => {
    const current: HardwareRequirements = {
      minimumRamGb: 8,
      gpu: { minimumVramGb: 2, requiresCuda: false },
      storage: { installGb: 10 },
      operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }, { family: "macos", supportedArchitectures: ["x86_64"] }],
    };

    const candidateBreaking: Partial<HardwareRequirements> = {
      minimumRamGb: 24, // +200%
      gpu: { requiresCuda: true }, // Breaking API
      operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }], // macOS dropped
    };

    const changes = detectSemanticRequirementChanges(current, candidateBreaking);

    expect(changes.some(c => c.field === "minimumRamGb" && c.severity === "BREAKING")).toBe(true);
    expect(changes.some(c => c.field === "gpu.requiresCuda" && c.severity === "BREAKING")).toBe(true);
    expect(changes.some(c => c.field === "operatingSystems" && c.severity === "BREAKING")).toBe(true);
  });

  it("3. Evaluates staging dataset promotion regression impact (§6)", () => {
    const version: SoftwareVersion = {
      id: "ver_test",
      softwareId: "test_software",
      version: "2024",
      isLatest: true,
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: {
        minimumRamGb: 8,
        recommendedRamGb: 16,
        storage: { installGb: 10 },
        operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      },
      workloads: [
        {
          id: "w1",
          softwareVersionId: "ver_test",
          name: "Standard",
          intensity: "medium",
          typical: { ramGb: 4, cpuLoadPercent: 30, gpuLoadPercent: 20, vramGb: 1, diskScratchGb: 5 },
          estimatedRamGb: { min: 4, typical: 6, high: 8 },
          workloadConcurrencyFactor: 0.8,
        },
      ],
      sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "fixture", confidence: "high" }],
    };

    const goldenScenarios = [
      {
        name: "8GB PC Scenario",
        hardware: {
          cpu: { model: "Intel i5", architecture: "x86_64", performanceScore: 60 },
          gpu: { model: "GTX 1650", type: "dedicated", performanceScore: 45, vramGb: 4 },
          ram: { totalGb: 8 },
          storage: [{ type: "NVME_SSD", totalGb: 500 }],
          os: { family: "windows", architecture: "x86_64" },
          architecture: "x86_64",
          deviceType: "desktop",
        } as HardwareProfile,
        workloads: [{ softwareId: "test_software", softwareName: "Test App", softwareVersionId: "ver_test", versionString: "2024", workloadId: "w1", workloadName: "Standard", intensity: "medium", concurrency: "foreground" } as SelectedWorkload],
      },
    ];

    // Candidate raises minimum RAM to 32GB -> Causes regression on the 8GB PC
    const promotion = evaluateStagingPromotionImpact(version, { minimumRamGb: 32 }, goldenScenarios);

    expect(promotion.overallSeverity).toBe("BREAKING");
    expect(promotion.canAutoApprove).toBe(false);
    expect(promotion.requiresHumanReview).toBe(true);
  });

  it("4. Generates Reverse Explainability ('Why not 16GB?') with arithmetic breakdown (§7)", () => {
    const pc: HardwareProfile = {
      cpu: { model: "AMD Ryzen 5 5600H", architecture: "x86_64", performanceScore: 68 },
      gpu: { model: "RTX 3050", type: "dedicated", performanceScore: 55, vramGb: 4 },
      ram: { totalGb: 16 },
      storage: [{ type: "NVME_SSD", totalGb: 512 }],
      os: { family: "windows", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
    };

    const workloads: SelectedWorkload[] = [
      { softwareId: "ps", softwareName: "Photoshop", softwareVersionId: "v1", versionString: "2024", workloadId: "w_ps", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
      { softwareId: "as", softwareName: "Android Studio", softwareVersionId: "v2", versionString: "2024", workloadId: "w_as", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
    ];

    const versions: SoftwareVersion[] = [
      {
        id: "v1", softwareId: "ps", version: "2024", isLatest: true,
        supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: { minimumRamGb: 8, storage: { installGb: 10 }, operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }] },
        workloads: [{ id: "w_ps", softwareVersionId: "v1", name: "Standard", intensity: "medium", typical: { ramGb: 7, cpuLoadPercent: 40, gpuLoadPercent: 30, vramGb: 2, diskScratchGb: 10 }, estimatedRamGb: { min: 4, typical: 7, high: 12 }, workloadConcurrencyFactor: 0.8 }],
        sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "fixture", confidence: "high" }],
      },
      {
        id: "v2", softwareId: "as", version: "2024", isLatest: true,
        supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: { minimumRamGb: 8, storage: { installGb: 10 }, operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }] },
        workloads: [{ id: "w_as", softwareVersionId: "v2", name: "Standard", intensity: "medium", typical: { ramGb: 6, cpuLoadPercent: 50, gpuLoadPercent: 20, vramGb: 1, diskScratchGb: 10 }, estimatedRamGb: { min: 4, typical: 6, high: 10 }, workloadConcurrencyFactor: 0.7 }],
        sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "fixture", confidence: "high" }],
      },
    ];

    const reverseExpl = generateReverseExplainability(pc, workloads, versions, 16);

    expect(reverseExpl.osReserveGb).toBe(2.5);
    expect(reverseExpl.backgroundBufferGb).toBe(1.5);
    expect(reverseExpl.workloadAllocations.length).toBe(2);
    expect(reverseExpl.calculatedTargetGb).toBeGreaterThan(10);
    expect(reverseExpl.disclaimer).toBeDefined();
  });

  it("5. Calculates Workload Improvement per Cost (Upgrade Value Score) with feasibility checks (§4)", () => {
    const laptopPc: HardwareProfile = {
      cpu: { model: "AMD Ryzen 5 5600H", architecture: "x86_64", performanceScore: 68 },
      gpu: { model: "RTX 3050 Laptop", type: "dedicated", performanceScore: 55, vramGb: 4 },
      ram: { totalGb: 16, soldered: true }, // Soldered laptop RAM
      storage: [{ type: "NVME_SSD", totalGb: 512 }],
      os: { family: "windows", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
    };

    const delta = {
      upgradeTarget: "32GB DDR4",
      scoreBefore: 68,
      scoreAfter: 84,
      deltaScore: 16,
      clearsPrimaryBottleneck: true,
    };

    const valueAnalysis = calculateUpgradeValue(laptopPc, "memory", "32GB DDR4", delta, 60);

    // Because laptop RAM is soldered, physical feasibility is false and score is 0
    expect(valueAnalysis.isPhysicallyFeasible).toBe(false);
    expect(valueAnalysis.upgradeValueScore).toBe(0);
    expect(valueAnalysis.feasibilityIssues.length).toBeGreaterThan(0);
  });
});
