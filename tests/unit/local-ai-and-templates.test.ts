import { describe, it, expect } from "vitest";
import {
  evaluateLocalAiCompatibility,
  findLargestSupportedAiModels,
  SAMPLE_AI_MODELS,
} from "../../services/ai/local-ai-engine";
import { compareMultiplePcs, POPULAR_SCENARIOS } from "../../services/scenarios/workload-templates";
import { generateResultQrCode } from "../../services/sharing/qr-service";
import { watchlistEngine, WatchlistEntry } from "../../services/notifications/watchlist-engine";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SoftwareVersion } from "../../lib/domain/software";

describe("Local AI / LLM Sizing, Scenarios & Watchlist Suite", () => {
  const midLaptop: HardwareProfile = {
    cpu: { model: "AMD Ryzen 5 5600H", architecture: "x86_64", performanceScore: 68, laptopVariant: true },
    gpu: { model: "NVIDIA RTX 3050 Laptop", type: "dedicated", performanceScore: 55, vramGb: 4, supportsCuda: true },
    ram: { totalGb: 16 },
    storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 200 }],
    os: { family: "windows", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "laptop",
  };

  const desktopHighEnd: HardwareProfile = {
    cpu: { model: "Intel Core i7-13700K", architecture: "x86_64", performanceScore: 92 },
    gpu: { model: "NVIDIA GeForce RTX 4070", type: "dedicated", performanceScore: 88, vramGb: 12, supportsCuda: true },
    ram: { totalGb: 32 },
    storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 500 }],
    os: { family: "windows", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "desktop",
  };

  it("1. Evaluates Llama 3.1 8B Q4 on 4GB VRAM laptop (Partial GPU Offload)", () => {
    const llama8b = SAMPLE_AI_MODELS.find(m => m.id === "llama-3.1-8b-q4")!;
    const result = evaluateLocalAiCompatibility(midLaptop, llama8b, 8192);

    expect(result.canRun).toBe(true);
    expect(result.residency).toBe("PARTIAL_GPU_OFFLOAD");
    expect(result.compatibilityTier).toBe("usable");
    expect(result.performance.decode.estimatedGenerationTokensPerSecond.min).toBeGreaterThan(0);
    expect(result.runtimeStack.recommendedBackend).toBe("cuda");
  });

  it("2. Evaluates Llama 3.1 8B Q4 on 12GB VRAM desktop (Full GPU Offload, 100% in VRAM)", () => {
    const llama8b = SAMPLE_AI_MODELS.find(m => m.id === "llama-3.1-8b-q4")!;
    const result = evaluateLocalAiCompatibility(desktopHighEnd, llama8b, 8192);

    expect(result.canRun).toBe(true);
    expect(result.residency).toBe("FULL_GPU");
    expect(result.compatibilityTier).toBe("excellent");
    expect(result.performance.decode.estimatedGenerationTokensPerSecond.min).toBeGreaterThanOrEqual(20);
  });

  it("3. Identifies largest models a PC can comfortably run vs compromise vs poor fit", () => {
    const modelsAnalysis = findLargestSupportedAiModels(desktopHighEnd);

    expect(modelsAnalysis.comfortableModels.length).toBeGreaterThan(0);
    expect(modelsAnalysis.comfortableModels.some(m => m.includes("8B"))).toBe(true);
    // 70B model should be poor fit on 32GB RAM + 12GB VRAM
    expect(modelsAnalysis.poorFitModels.some(m => m.includes("70B"))).toBe(true);
  });

  it("4. Evaluates Multi-PC comparison against community scenario template", () => {
    const sampleVersions: SoftwareVersion[] = [
      {
        id: "v_latest", softwareId: "vs-code", version: "2024", isLatest: true,
        supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: { minimumRamGb: 4, storage: { installGb: 2 }, operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }] },
        workloads: [{ id: "w_code", softwareVersionId: "v_latest", name: "Large Workspace", intensity: "heavy", typical: { ramGb: 4, cpuLoadPercent: 30, gpuLoadPercent: 15, vramGb: 1, diskScratchGb: 5 }, estimatedRamGb: { min: 2, typical: 4, high: 8 }, workloadConcurrencyFactor: 0.8 }],
        sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "official", confidence: "high" }],
      },
      {
        id: "v_latest", softwareId: "docker-desktop", version: "2024", isLatest: true,
        supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: { minimumRamGb: 8, storage: { installGb: 10 }, operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }] },
        workloads: [{ id: "w_docker", softwareVersionId: "v_latest", name: "5+ Containers", intensity: "heavy", typical: { ramGb: 6, cpuLoadPercent: 40, gpuLoadPercent: 10, vramGb: 1, diskScratchGb: 10 }, estimatedRamGb: { min: 4, typical: 6, high: 12 }, workloadConcurrencyFactor: 0.7 }],
        sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "official", confidence: "high" }],
      },
      {
        id: "v_latest", softwareId: "google-chrome", version: "2024", isLatest: true,
        supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: { minimumRamGb: 4, storage: { installGb: 2 }, operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }] },
        workloads: [{ id: "w_chrome", softwareVersionId: "v_latest", name: "30 Tabs", intensity: "heavy", typical: { ramGb: 6, cpuLoadPercent: 30, gpuLoadPercent: 15, vramGb: 1, diskScratchGb: 5 }, estimatedRamGb: { min: 3, typical: 6, high: 10 }, workloadConcurrencyFactor: 0.5 }],
        sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "official", confidence: "high" }],
      },
    ];

    const pcs = [
      { name: "Developer Laptop", hardware: midLaptop },
      { name: "High-End Workstation", hardware: desktopHighEnd },
    ];

    const comparison = compareMultiplePcs(pcs, POPULAR_SCENARIOS[0], sampleVersions);

    expect(comparison.evaluations.length).toBe(2);
    expect(comparison.bestPerformingComputer).toBe("High-End Workstation");
    expect(comparison.evaluations[1].result.score).toBeGreaterThan(comparison.evaluations[0].result.score);
  });

  it("5. Generates SVG and URL QR codes for canonical result sharing", () => {
    const qr = generateResultQrCode("eval_rec_98765");
    expect(qr.targetUrl).toContain("/results/eval_rec_98765");
    expect(qr.svgDataUri).toContain("data:image/svg+xml");
  });

  it("6. Dispatches Watchlist Alerts when software requirement increases drop a saved PC's tier", () => {
    const watchlistEntry: WatchlistEntry = {
      id: "wl_001",
      userId: "user_123",
      pcName: "Office Laptop",
      hardware: midLaptop,
      workloads: [
        { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "v1", versionString: "2024", workloadId: "w1", workloadName: "Standard", intensity: "medium", concurrency: "foreground" },
      ],
      lastKnownResult: {
        compatibilityStatus: "compatible",
        performanceTier: "recommended",
        score: 85,
        evaluatedAt: new Date().toISOString(),
      },
      preferredChannels: ["EMAIL", "IN_APP"],
    };

    // Updated version raises requirements significantly (drops score to ~45 / minimum tier)
    const updatedVersions: SoftwareVersion[] = [
      {
        id: "v1", softwareId: "photoshop", version: "2025", isLatest: true,
        supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: { minimumRamGb: 32, cpu: { minimumPerformanceScore: 90 }, storage: { installGb: 50 }, operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }] },
        workloads: [{ id: "w1", softwareVersionId: "v1", name: "Standard", intensity: "medium", typical: { ramGb: 24, cpuLoadPercent: 80, gpuLoadPercent: 60, vramGb: 8, diskScratchGb: 50 }, estimatedRamGb: { min: 16, typical: 24, high: 32 }, workloadConcurrencyFactor: 0.9 }],
        sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "official", confidence: "high" }],
      },
    ];

    const alert = watchlistEngine.evaluateWatchlistEntry(watchlistEntry, updatedVersions);

    expect(alert).not.toBeNull();
    expect(alert?.tierDropped).toBe(true);
    expect(alert?.tierBefore).toBe("recommended");
    expect(alert?.subject).toContain("Alert");
  });
});
