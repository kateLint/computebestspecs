import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";
import {
  HardwareRecommendation,
  RecommendationPreferences,
  RecommendedHardwareTier,
  ExplanationSection,
} from "../../lib/domain/recommendation";
import { aggregateWorkloadDemands } from "../compatibility/concurrency-model";
import { HardwareProfile } from "../../lib/domain/hardware";
import { ENGINE_VERSION } from "../compatibility/compatibility-engine";

export function recommendHardware(
  selectedWorkloads: SelectedWorkload[],
  softwareVersions: SoftwareVersion[],
  preferences?: RecommendationPreferences,
  isSimultaneous: boolean = true
): HardwareRecommendation {
  const dummyHardware: HardwareProfile = {
    cpu: { model: "Reference CPU", architecture: "x86_64" },
    ram: { totalGb: 16 },
    storage: [{ type: "NVME_SSD", totalGb: 1000 }],
    os: { family: (preferences?.preferredOs === "any" || !preferences?.preferredOs ? "windows" : preferences.preferredOs), architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: preferences?.deviceType === "any" || !preferences?.deviceType ? "desktop" : preferences.deviceType,
  };

  const demands = aggregateWorkloadDemands(dummyHardware, selectedWorkloads, softwareVersions, isSimultaneous);

  const individualMaxRam = demands.peakSingleAppRamGb;
  const concurrentRam = demands.effectiveRequiredRamGb;

  // Tier 1: Minimum (Budget-conscious, baseline runnable)
  const minRamGb = Math.max(8, roundToStandardRam(individualMaxRam + 4));
  const minTier: RecommendedHardwareTier = {
    tierName: "Minimum",
    tierDescription: "Meets baseline requirements to run applications with modest multitasking.",
    targetExperience: "Functional performance. Multitasking between multiple large apps will experience memory pressure.",
    cpu: {
      performanceScore: Math.max(45, demands.maxCpuScoreRequired - 15),
      description: "6-core modern processor (Intel Core i5 / AMD Ryzen 5 / Apple M2)",
      minCores: 6,
      exampleModels: ["Intel Core i5-13400", "AMD Ryzen 5 7600", "Apple M2 (Base)"],
    },
    gpu: {
      performanceScore: Math.max(35, demands.maxGpuScoreRequired - 15),
      minVramGb: Math.max(4, demands.peakSingleAppVramGb),
      description: demands.requiresDedicatedGpu ? "Dedicated entry graphics card (4GB-6GB VRAM)" : "Modern integrated graphics or entry dedicated GPU",
      isDedicatedRequired: demands.requiresDedicatedGpu,
      exampleModels: ["NVIDIA GeForce RTX 3050 6GB", "AMD Radeon RX 6600", "Apple M2 Integrated GPU"],
    },
    ramGb: minRamGb,
    ramType: "DDR4 / DDR5 / Unified",
    storage: {
      capacityGb: Math.max(512, demands.totalDiskInstallGb + demands.totalDiskScratchGb > 150 ? 1000 : 512),
      recommendedType: "NVME_SSD",
      description: "512GB - 1TB NVMe SSD for operating system and project files",
    },
    os: preferences?.preferredOs && preferences.preferredOs !== "any" ? preferences.preferredOs : "Windows 11 64-bit / macOS Sonoma",
    isSimultaneousReady: false,
  };

  // Tier 2: Recommended (Smooth, concurrent multitasking ready)
  const recRamGb = Math.max(16, roundToStandardRam(concurrentRam));
  const recTier: RecommendedHardwareTier = {
    tierName: "Recommended",
    tierDescription: "Ideal balance of performance, high responsiveness, and simultaneous workload capability.",
    targetExperience: "Smooth, responsive multitasking with zero bottlenecking across all chosen applications.",
    cpu: {
      performanceScore: Math.max(70, demands.maxCpuScoreRequired),
      description: "8-core high-efficiency processor with high single-core and multi-core throughput",
      minCores: 8,
      exampleModels: ["Intel Core i7-14700", "AMD Ryzen 7 7800X / 7700X", "Apple M3 Pro / M4"],
    },
    gpu: {
      performanceScore: Math.max(65, demands.maxGpuScoreRequired),
      minVramGb: Math.max(8, demands.totalVramDemandGb),
      description: "Dedicated mid-range GPU with 8GB-12GB GDDR6 VRAM",
      isDedicatedRequired: true,
      exampleModels: ["NVIDIA GeForce RTX 4070 12GB", "AMD Radeon RX 7700 XT", "Apple M3 Pro 18-Core GPU"],
    },
    ramGb: recRamGb,
    ramType: "DDR5 5600MHz / Apple Unified Memory",
    storage: {
      capacityGb: 1000,
      recommendedType: "NVME_SSD",
      description: "1TB PCIe 4.0 NVMe SSD (5000+ MB/s read/write)",
    },
    os: preferences?.preferredOs && preferences.preferredOs !== "any" ? preferences.preferredOs : "Windows 11 64-bit / macOS",
    isSimultaneousReady: true,
  };

  // Tier 3: Professional / Ideal (Heavy assets, no compromises)
  const proRamGb = Math.max(32, roundToStandardRam(concurrentRam * 1.4));
  const proTier: RecommendedHardwareTier = {
    tierName: "Professional / Ideal",
    tierDescription: "Engineered for intense production workloads, large timelines, 3D scenes, and heavy compilation.",
    targetExperience: "Instantaneous renders, deep caching headroom, and flawless multi-container/emulator execution.",
    cpu: {
      performanceScore: Math.max(85, demands.maxCpuScoreRequired + 15),
      description: "12-16+ core high-end workstation processor",
      minCores: 12,
      exampleModels: ["Intel Core i9-14900K", "AMD Ryzen 9 7950X", "Apple M3 Max / M4 Pro"],
    },
    gpu: {
      performanceScore: Math.max(85, demands.maxGpuScoreRequired + 15),
      minVramGb: Math.max(12, demands.totalVramDemandGb + 4),
      description: "High-end dedicated GPU with 16GB+ VRAM & hardware ray-tracing / tensor cores",
      isDedicatedRequired: true,
      exampleModels: ["NVIDIA GeForce RTX 4080 / 4090 16GB+", "Apple M3 Max 30-Core GPU"],
    },
    ramGb: proRamGb,
    ramType: "DDR5 6000MHz Dual-Channel / High-bandwidth Unified",
    storage: {
      capacityGb: 2000,
      recommendedType: "NVME_SSD",
      description: "2TB PCIe 4.0/5.0 NVMe SSD (Dedicated scratch partition recommended)",
    },
    os: preferences?.preferredOs && preferences.preferredOs !== "any" ? preferences.preferredOs : "Windows 11 Pro 64-bit / macOS",
    isSimultaneousReady: true,
  };

  const explanations: ExplanationSection[] = [
    {
      title: "Memory Sizing Justification",
      messageKey: "explanation.ram_rationale",
      details: `${recRamGb}GB RAM is recommended. While individual applications specify minimums around ${individualMaxRam}GB, simultaneous execution requires ~${demands.totalEstimatedRamUsageGb}GB active working set plus ${demands.osBackgroundReserveGb}GB OS/background overhead and safety headroom.`,
      factors: [
        `Peak single app requirement: ${individualMaxRam}GB`,
        `Concurrent active working set: ~${demands.totalEstimatedRamUsageGb}GB`,
        `OS and background reserve: ~${demands.osBackgroundReserveGb}GB`,
      ],
    },
    {
      title: "Graphics & VRAM Requirements",
      messageKey: "explanation.gpu_rationale",
      details: demands.requiresDedicatedGpu
        ? `Dedicated GPU with at least ${Math.max(6, demands.peakSingleAppVramGb)}GB VRAM is essential for hardware timeline acceleration and 3D preview buffers.`
        : "Standard graphics are suitable, but dedicated VRAM ensures smooth UI frame pacing under load.",
      factors: [
        `Peak VRAM buffer requirement: ${demands.peakSingleAppVramGb}GB`,
        `CUDA / Metal acceleration: ${demands.requiredGpuApis.cuda ? "CUDA required" : "Standard API"}`,
      ],
    },
  ];

  return {
    minimum: minTier,
    recommended: recTier,
    professional: proTier,
    explanations,
    concurrencyInsights: {
      individualAppMaxRam: individualMaxRam,
      concurrentRamNeeded: concurrentRam,
      memoryReason: `${recRamGb}GB RAM provides stable multitasking without swap paging.`,
    },
    confidence: 94,
    caveats: [
      "Hardware prices and model availability fluctuate across regional retailers.",
      "Laptop recommendations assume adequate thermal dissipation and a minimum 65W-100W power delivery profile.",
    ],
    engineVersion: ENGINE_VERSION,
  };
}

function roundToStandardRam(gb: number): number {
  const tiers = [8, 16, 24, 32, 48, 64, 96, 128];
  for (const tier of tiers) {
    if (gb <= tier) return tier;
  }
  return 128;
}
