import { describe, it, expect } from "vitest";
import {
  evaluateLocalAiCompatibility,
  SAMPLE_AI_MODELS,
  calculateKvCacheGb,
} from "../../services/ai/local-ai-engine";
import { evaluateFleetAgainstAiSla } from "../../services/ai/enterprise-fleet-ai";
import { HardwareProfile } from "../../lib/domain/hardware";
import { EnterpriseFleetSla } from "../../lib/domain/ai-workload";

describe("Advanced Local AI Modeling, MoE, KV-Cache & Fleet SLA Suite", () => {
  const desktopRtx4070: HardwareProfile = {
    cpu: { model: "Intel Core i7-13700K", architecture: "x86_64", performanceScore: 92 },
    gpu: { model: "NVIDIA GeForce RTX 4070", type: "dedicated", performanceScore: 88, vramGb: 12, supportsCuda: true },
    ram: { totalGb: 32 },
    storage: [{ type: "NVME_SSD", totalGb: 1000 }],
    os: { family: "windows", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "desktop",
  };

  const macbookM3Pro: HardwareProfile = {
    cpu: { manufacturer: "Apple", model: "Apple M3 Pro", architecture: "arm64", performanceScore: 88 },
    ram: { totalGb: 36 },
    storage: [{ type: "NVME_SSD", totalGb: 1000 }],
    os: { family: "macos", architecture: "arm64" },
    architecture: "arm64",
    deviceType: "laptop",
  };

  const budgetLaptop: HardwareProfile = {
    cpu: { model: "AMD Ryzen 5 5600H", architecture: "x86_64", performanceScore: 68 },
    gpu: { model: "NVIDIA RTX 3050 Laptop", type: "dedicated", performanceScore: 55, vramGb: 4, supportsCuda: true },
    ram: { totalGb: 16 },
    storage: [{ type: "NVME_SSD", totalGb: 512 }],
    os: { family: "windows", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "laptop",
  };

  it("1. Outputs calibrated performance ranges for Prefill and Decode (§Decoupled Perf)", () => {
    const llama8b = SAMPLE_AI_MODELS.find(m => m.id === "llama-3.1-8b-q4")!;
    const result = evaluateLocalAiCompatibility(desktopRtx4070, llama8b, 8192);

    expect(result.residency).toBe("FULL_GPU");
    // Decode range
    expect(result.performance.decode.estimatedGenerationTokensPerSecond.min).toBeGreaterThanOrEqual(25);
    expect(result.performance.decode.estimatedGenerationTokensPerSecond.max).toBeGreaterThan(
      result.performance.decode.estimatedGenerationTokensPerSecond.min
    );
    expect(result.performance.decode.confidence).toBe("high");

    // Prefill range
    expect(result.performance.prefill.estimatedPromptTokensPerSecond.min).toBeGreaterThanOrEqual(100);
    expect(result.performance.prefill.estimatedPromptTokensPerSecond.max).toBeGreaterThan(
      result.performance.prefill.estimatedPromptTokensPerSecond.min
    );
  });

  it("2. Handles Mixture-of-Experts (MoE) with total weight vs active compute parameter decoupling", () => {
    const mixtralMoE = SAMPLE_AI_MODELS.find(m => m.id === "mixtral-8x7b-q4")!;
    const macResult = evaluateLocalAiCompatibility(macbookM3Pro, mixtralMoE, 4096);

    // 46.7B total weights fit in 36GB Unified Memory (26.4GB weights + KV)
    expect(macResult.residency).toBe("FULL_UNIFIED_MEMORY");
    expect(macResult.topology.isUnifiedMemory).toBe(true);
    expect(macResult.topology.pcieBandwidthConstraint).toBe(false);
    expect(macResult.performance.decode.estimatedGenerationTokensPerSecond.min).toBeGreaterThan(0);
  });

  it("3. Calculates dynamic KV Cache scaling with context slider", () => {
    const llama8b = SAMPLE_AI_MODELS.find(m => m.id === "llama-3.1-8b-q4")!;

    const kv4k = calculateKvCacheGb(llama8b, 4096);
    const kv32k = calculateKvCacheGb(llama8b, 32768);
    const kv128k = calculateKvCacheGb(llama8b, 131072);

    expect(kv4k).toBeLessThan(kv32k);
    expect(kv32k).toBeLessThan(kv128k);
    expect(kv128k).toBeGreaterThanOrEqual(10); // 128K context requires significant KV cache RAM
  });

  it("4. Evaluates Enterprise Fleet against customizable AI SLA (§Fleet Capacity Planning)", () => {
    const qwen14b = SAMPLE_AI_MODELS.find(m => m.id === "qwen-2.5-14b-q4")!;
    const sla: EnterpriseFleetSla = {
      slaName: "Interactive Code Assistant SLA",
      minDecodeTokensPerSec: 20,
      minPrefillTokensPerSec: 150,
      maxFirstTokenLatencySec: 2.0,
      minContextTokens: 8192,
      targetModel: qwen14b,
    };

    const fleet = [
      { machineId: "ws_01", machineName: "Engineering Workstation 01", hardware: desktopRtx4070 },
      { machineId: "ws_02", machineName: "MacBook Pro M3", hardware: macbookM3Pro },
      { machineId: "laptop_03", machineName: "Junior Dev Laptop", hardware: budgetLaptop },
    ];

    const fleetAnalysis = evaluateFleetAgainstAiSla(fleet, sla);

    expect(fleetAnalysis.totalMachinesAnalyzed).toBe(3);
    expect(fleetAnalysis.tierCounts.tierA).toBeGreaterThanOrEqual(1); // RTX 4070 & M3 Pro meet SLA
    expect(fleetAnalysis.tierCounts.tierB).toBeGreaterThanOrEqual(1); // Budget laptop runs locally below SLA
    expect(fleetAnalysis.upgradeActionPlan.impactSummary).toBeDefined();
  });
});
