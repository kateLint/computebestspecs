import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";
import {
  CompatibilityResult,
  ComponentEvaluation,
  EvaluationReason,
  PerAppEvaluation,
  HardCompatibilityStatus,
  PerformanceTier,
  ThreeValuedStatus,
} from "../../lib/domain/compatibility";
import { aggregateWorkloadDemands, computeConcurrencyMetrics } from "./concurrency-model";
import { analyzeBottlenecks } from "./bottleneck-analyzer";
import { generateUpgradeRecommendations } from "./upgrade-advisor";
import { calculateBottleneckPenalty, clamp } from "../../lib/scoring/scoring-utils";
import { generateEvaluationFingerprint, buildCalculationTrace } from "../observability/trace-and-fingerprint";
import { metrics } from "../observability/metrics";

export const ENGINE_VERSION = "1.0.0";
export const POLICY_VERSION = "2026.09-standard";
export const BENCHMARK_DATASET_VERSION = "2026.1";
export const NORMALIZATION_ALGORITHM_VERSION = "1.0";

export function evaluateCompatibility(
  hardware: HardwareProfile,
  selectedWorkloads: SelectedWorkload[],
  softwareVersions: SoftwareVersion[],
  isSimultaneous: boolean = true,
  runUpgradeSimulation: boolean = true
): CompatibilityResult {
  const evaluatedAt = new Date().toISOString();
  const appsList = selectedWorkloads.map(sw => sw.softwareName).join(", ");
  const isVerifiedHardware = (hardware.cpu.isVerified ?? true) && (hardware.gpu?.isVerified ?? true);

  // 1. Hard Compatibility & Per-App Checks (Requirement Graph & Incompatibilities §3, §11, §12)
  let globalHardCompatibility: HardCompatibilityStatus = "compatible";
  const globalReasons: EvaluationReason[] = [];
  const perAppEvaluations: PerAppEvaluation[] = [];

  for (const sw of selectedWorkloads) {
    const version = softwareVersions.find(v => v.id === sw.softwareVersionId) ||
                    softwareVersions.find(v => v.softwareId === sw.softwareId);

    const appReasons: string[] = [];
    let appHardStatus: HardCompatibilityStatus = "compatible";

    if (version) {
      // OS check
      const osSupported = version.supportedOperatingSystems.some(
        os => os.family === hardware.os.family
      );
      if (!osSupported) {
        appHardStatus = "incompatible";
        appReasons.push(`${sw.softwareName} does not support ${hardware.os.family}.`);
        globalReasons.push({
          code: "OS_UNSUPPORTED",
          severity: "critical",
          messageKey: "os.unsupported",
          parameters: { software: sw.softwareName, osFamily: hardware.os.family, version: hardware.os.version || "" },
        });
      }

      // Architecture check
      const archSupported = version.minimumRequirements.architectures
        ? version.minimumRequirements.architectures.includes(hardware.architecture)
        : true;
      if (!archSupported) {
        appHardStatus = "incompatible";
        appReasons.push(`${sw.softwareName} requires a different CPU architecture (${hardware.architecture} is unsupported).`);
        globalReasons.push({
          code: "ARCH_MISMATCH",
          severity: "critical",
          messageKey: "os.architecture_mismatch",
          parameters: { software: sw.softwareName, requiredArch: version.minimumRequirements.architectures?.join("/") || "x86_64", actualArch: hardware.architecture },
        });
      }

      // CUDA check
      if (version.minimumRequirements.gpu?.requiresCuda && !hardware.gpu?.supportsCuda) {
        appHardStatus = "incompatible";
        appReasons.push(`${sw.softwareName} requires NVIDIA CUDA acceleration.`);
        globalReasons.push({
          code: "CUDA_MISSING",
          severity: "critical",
          messageKey: "gpu.cuda_missing",
          parameters: { software: sw.softwareName, gpuModel: hardware.gpu?.model || "Current GPU" },
        });
      }

      // Virtualization check (Three-valued logic: PASS | FAIL | UNKNOWN §19)
      if (version.minimumRequirements.requiresVirtualization) {
        if (hardware.supportsVirtualization === false) {
          appHardStatus = "incompatible";
          appReasons.push(`${sw.softwareName} requires hardware virtualization, which is unsupported on this CPU.`);
          globalReasons.push({
            code: "VIRT_UNSUPPORTED",
            severity: "critical",
            messageKey: "virtualization.unsupported",
            parameters: { software: sw.softwareName },
          });
        }
      }
    }

    if (appHardStatus === "incompatible") {
      globalHardCompatibility = "incompatible";
    }

    // Provenance & Freshness (§17-§18)
    const source = version?.sourceRecords[0];
    const retrievedDate = source?.retrievedAt ? new Date(source.retrievedAt) : new Date();
    const daysSinceRetrieval = Math.floor((Date.now() - retrievedDate.getTime()) / (1000 * 60 * 60 * 24));
    const isFresh = daysSinceRetrieval <= 365;

    perAppEvaluations.push({
      softwareId: sw.softwareId,
      softwareName: sw.softwareName,
      version: sw.versionString || "Latest",
      compatibilityStatus: appHardStatus,
      performanceTier: appHardStatus === "incompatible" ? "poor" : "recommended",
      score: appHardStatus === "incompatible" ? 0 : 85,
      isHardIncompatible: appHardStatus === "incompatible",
      hardIncompatibilityReasons: appReasons,
      requirementProvenance: {
        dataQuality: version?.dataQuality || "TEST_FIXTURE_ONLY",
        sourcePublisher: source?.publisher,
        sourceUrl: source?.url,
        retrievedAt: source?.retrievedAt,
        isFresh,
      },
    });
  }

  // 2. Resource Demands & Concurrency
  const demands = aggregateWorkloadDemands(hardware, selectedWorkloads, softwareVersions, isSimultaneous);
  const concurrencyMetrics = computeConcurrencyMetrics(hardware, demands, selectedWorkloads, isSimultaneous);

  // 3. Component Evaluations (Three-Valued Logic: PASS | FAIL | UNKNOWN §19)

  // A. Memory Evaluation
  const physicalRam = hardware.ram.totalGb;
  let memoryStatus: ThreeValuedStatus = "PASS";
  let memoryTier: PerformanceTier = "recommended";
  let memoryScore = 80;
  const memoryReasons: EvaluationReason[] = [];

  if (physicalRam < demands.peakSingleAppRamGb) {
    memoryStatus = "FAIL";
    memoryTier = "poor";
    memoryScore = Math.max(10, Math.round((physicalRam / demands.peakSingleAppRamGb) * 40));
    memoryReasons.push({
      code: "RAM_FAIL_DEFICIT",
      severity: "critical",
      messageKey: "ram.fail_deficit",
      parameters: { requiredGb: demands.effectiveRequiredRamGb, headroomGb: demands.safetyHeadroomGb, totalGb: physicalRam },
    });
  } else if (physicalRam < demands.effectiveRequiredRamGb) {
    memoryStatus = "PASS";
    memoryTier = "minimum";
    memoryScore = Math.round(50 + (physicalRam / demands.effectiveRequiredRamGb) * 20);
    memoryReasons.push({
      code: "RAM_BORDERLINE_CONCURRENCY",
      severity: "warning",
      messageKey: "ram.borderline_concurrency",
      parameters: { apps: appsList, requiredGb: demands.effectiveRequiredRamGb, totalGb: physicalRam },
    });
  } else if (physicalRam >= demands.effectiveRequiredRamGb * 1.3) {
    memoryStatus = "PASS";
    memoryTier = "excellent";
    memoryScore = 98;
    memoryReasons.push({
      code: "RAM_PASS_PRO",
      severity: "info",
      messageKey: "ram.pass_professional",
      parameters: { totalGb: physicalRam },
    });
  } else {
    memoryStatus = "PASS";
    memoryTier = "recommended";
    memoryScore = 88;
    memoryReasons.push({
      code: "RAM_PASS_REC",
      severity: "info",
      messageKey: "ram.pass_recommended",
      parameters: { totalGb: physicalRam },
    });
  }

  if (hardware.cpu.architecture === "arm64" && hardware.cpu.manufacturer === "Apple" && demands.totalVramDemandGb > 4) {
    memoryReasons.push({
      code: "RAM_UNIFIED_CONTENTION",
      severity: "info",
      messageKey: "ram.unified_memory_contention",
      parameters: { totalGb: physicalRam },
    });
  }

  const memoryEval: ComponentEvaluation = {
    status: memoryStatus,
    performanceTier: memoryTier,
    score: memoryScore,
    confidence: isVerifiedHardware ? 95 : 75,
    actualValue: `${physicalRam}GB`,
    requiredValue: `${demands.effectiveRequiredRamGb}GB`,
    recommendedValue: `${demands.effectiveRequiredRamGb <= 16 ? 32 : 64}GB`,
    reasons: memoryReasons,
  };

  // B. CPU Evaluation
  const cpuPerf = hardware.cpu.performanceScore ?? (hardware.cpu.physicalCores ? Math.min(100, hardware.cpu.physicalCores * 12) : 50);
  let cpuStatus: ThreeValuedStatus = "PASS";
  let cpuTier: PerformanceTier = "recommended";
  let cpuScore = Math.min(100, Math.round((cpuPerf / Math.max(30, demands.maxCpuScoreRequired)) * 80));
  const cpuReasons: EvaluationReason[] = [];

  if (cpuPerf < demands.maxCpuScoreRequired * 0.7) {
    cpuStatus = "FAIL";
    cpuTier = "poor";
    cpuReasons.push({
      code: "CPU_FAIL_WEAK",
      severity: "critical",
      messageKey: "cpu.fail_weak",
      parameters: { cpuModel: hardware.cpu.model, score: cpuPerf, requiredScore: demands.maxCpuScoreRequired },
    });
  } else if (cpuPerf < demands.maxCpuScoreRequired) {
    cpuStatus = "PASS";
    cpuTier = "minimum";
    cpuReasons.push({
      code: "CPU_PASS_MIN",
      severity: "warning",
      messageKey: "cpu.pass_minimum",
      parameters: { cpuModel: hardware.cpu.model },
    });
  } else if (cpuPerf >= demands.maxCpuScoreRequired * 1.25) {
    cpuStatus = "PASS";
    cpuTier = "excellent";
    cpuScore = Math.min(100, cpuScore + 15);
    cpuReasons.push({
      code: "CPU_PASS_PRO",
      severity: "info",
      messageKey: "cpu.pass_professional",
      parameters: { cpuModel: hardware.cpu.model },
    });
  } else {
    cpuStatus = "PASS";
    cpuTier = "recommended";
    cpuReasons.push({
      code: "CPU_PASS_REC",
      severity: "info",
      messageKey: "cpu.pass_recommended",
      parameters: { cpuModel: hardware.cpu.model },
    });
  }

  if (hardware.deviceType === "laptop" && demands.maxCpuScoreRequired >= 70) {
    cpuReasons.push({
      code: "CPU_LAPTOP_THERMALS",
      severity: "info",
      messageKey: "cpu.laptop_thermal_notice",
      parameters: { minWatts: hardware.cpu.powerProfile?.minWatts || 35 },
    });
  }

  const cpuEval: ComponentEvaluation = {
    status: cpuStatus,
    performanceTier: cpuTier,
    score: clamp(cpuScore, 10, 100),
    confidence: isVerifiedHardware ? 92 : 65,
    actualValue: hardware.cpu.model,
    requiredValue: `Score >= ${demands.maxCpuScoreRequired}`,
    reasons: cpuReasons,
  };

  // C. GPU & VRAM Evaluation
  const gpuPerf = hardware.gpu?.performanceScore ?? (hardware.gpu?.type === "integrated" ? 25 : 55);
  const actualVram = hardware.gpu?.vramGb ?? (hardware.gpu?.type === "integrated" ? 0 : 4);
  const isDedicated = hardware.gpu?.type === "dedicated" || hardware.gpu?.type === "unified";

  let gpuStatus: ThreeValuedStatus = "PASS";
  let gpuTier: PerformanceTier = "recommended";
  let gpuScore = Math.min(100, Math.round((gpuPerf / Math.max(30, demands.maxGpuScoreRequired)) * 80));
  const gpuReasons: EvaluationReason[] = [];

  if (demands.requiresDedicatedGpu && !isDedicated) {
    gpuStatus = "FAIL";
    gpuTier = "poor";
    gpuScore = 30;
    gpuReasons.push({
      code: "GPU_INTEGRATED_BOTTLENECK",
      severity: "critical",
      messageKey: "gpu.pass_integrated",
      parameters: { gpuModel: hardware.gpu?.model || "Integrated Graphics" },
    });
  } else if (gpuPerf >= demands.maxGpuScoreRequired * 1.2) {
    gpuStatus = "PASS";
    gpuTier = "excellent";
    gpuScore = Math.min(100, gpuScore + 15);
    gpuReasons.push({
      code: "GPU_PASS_DEDICATED",
      severity: "info",
      messageKey: "gpu.pass_dedicated",
      parameters: { gpuModel: hardware.gpu?.model || "Dedicated GPU", vramGb: actualVram },
    });
  } else {
    gpuStatus = "PASS";
    gpuTier = "recommended";
    gpuReasons.push({
      code: "GPU_PASS_DEDICATED",
      severity: "info",
      messageKey: "gpu.pass_dedicated",
      parameters: { gpuModel: hardware.gpu?.model || "Dedicated GPU", vramGb: actualVram },
    });
  }

  const gpuEval: ComponentEvaluation = {
    status: gpuStatus,
    performanceTier: gpuTier,
    score: clamp(gpuScore, 10, 100),
    confidence: isVerifiedHardware ? 90 : 60,
    actualValue: hardware.gpu?.model || "Integrated Graphics",
    requiredValue: `Score >= ${demands.maxGpuScoreRequired}`,
    reasons: gpuReasons,
  };

  // VRAM Evaluation
  let vramStatus: ThreeValuedStatus = "PASS";
  let vramTier: PerformanceTier = "recommended";
  let vramScore = 85;
  const vramReasons: EvaluationReason[] = [];

  if (demands.totalVramDemandGb > 0 && actualVram < demands.peakSingleAppVramGb) {
    vramStatus = "FAIL";
    vramTier = "poor";
    vramScore = Math.max(15, Math.round((actualVram / demands.peakSingleAppVramGb) * 45));
    vramReasons.push({
      code: "VRAM_DEFICIT",
      severity: "critical",
      messageKey: "gpu.fail_vram_deficit",
      parameters: { requiredVram: demands.peakSingleAppVramGb, vramGb: actualVram },
    });
  } else if (actualVram >= demands.totalVramDemandGb * 1.3) {
    vramStatus = "PASS";
    vramTier = "excellent";
    vramScore = 98;
  }

  const vramEval: ComponentEvaluation = {
    status: vramStatus,
    performanceTier: vramTier,
    score: vramScore,
    confidence: isVerifiedHardware ? 90 : 65,
    actualValue: `${actualVram}GB`,
    requiredValue: `${demands.peakSingleAppVramGb}GB`,
    reasons: vramReasons,
  };

  // D. Storage Evaluation
  const primaryDrive = hardware.storage[0] || { type: "NVME_SSD", totalGb: 512, freeGb: 200 };
  let storageStatus: ThreeValuedStatus = "PASS";
  let storageTier: PerformanceTier = "recommended";
  let storageScore = 85;
  const storageReasons: EvaluationReason[] = [];

  if (primaryDrive.type === "NVME_SSD") {
    storageStatus = "PASS";
    storageTier = "excellent";
    storageScore = 95;
    storageReasons.push({ code: "STORAGE_NVME", severity: "info", messageKey: "storage.nvme_optimal", parameters: {} });
  } else if (primaryDrive.type === "SATA_SSD") {
    storageStatus = "PASS";
    storageTier = "recommended";
    storageScore = 75;
    storageReasons.push({ code: "STORAGE_SATA", severity: "info", messageKey: "storage.sata_pass", parameters: {} });
  } else if (primaryDrive.type === "HDD") {
    storageStatus = "PASS";
    storageTier = "minimum";
    storageScore = 40;
    storageReasons.push({ code: "STORAGE_HDD", severity: "warning", messageKey: "storage.hdd_warning", parameters: {} });
  }

  if (primaryDrive.freeGb !== undefined && primaryDrive.freeGb < demands.totalDiskInstallGb + demands.totalDiskScratchGb) {
    storageStatus = "PASS";
    storageTier = "minimum";
    storageScore = Math.min(storageScore, 45);
    storageReasons.push({
      code: "STORAGE_FREE_LOW",
      severity: "warning",
      messageKey: "storage.free_space_warning",
      parameters: { freeGb: primaryDrive.freeGb },
    });
  }

  const storageEval: ComponentEvaluation = {
    status: storageStatus,
    performanceTier: storageTier,
    score: storageScore,
    confidence: 90,
    actualValue: `${primaryDrive.totalGb}GB ${primaryDrive.type}`,
    reasons: storageReasons,
  };

  // E. OS Evaluation
  const osEval: ComponentEvaluation = {
    status: globalHardCompatibility === "incompatible" ? "FAIL" : "PASS",
    performanceTier: globalHardCompatibility === "incompatible" ? "poor" : "excellent",
    score: globalHardCompatibility === "incompatible" ? 0 : 100,
    confidence: 98,
    actualValue: `${hardware.os.family} ${hardware.os.version || ""} (${hardware.architecture})`,
    reasons: globalReasons.filter(r => r.code.startsWith("OS") || r.code.startsWith("ARCH")),
  };

  // 4. Bottleneck Penalty & Final Score Calculation
  const componentScores = {
    cpu: cpuEval.score,
    memory: memoryEval.score,
    gpu: gpuEval.score,
    vram: vramEval.score,
    storage: storageEval.score,
  };

  const weights = {
    cpu: 0.30,
    memory: 0.35,
    gpu: 0.15,
    vram: 0.10,
    storage: 0.10,
  };

  const { baseScore, criticalPenalty, finalScore } = calculateBottleneckPenalty(componentScores, weights);
  const isHardIncompatible = globalHardCompatibility === "incompatible";

  // Determine Performance Tier (§3)
  let performanceTier: PerformanceTier = "recommended";
  if (isHardIncompatible) {
    performanceTier = "poor";
  } else if (finalScore >= 90) {
    performanceTier = "excellent";
  } else if (finalScore >= 68) {
    performanceTier = "recommended";
  } else if (finalScore >= 50) {
    performanceTier = "usable";
  } else if (finalScore >= 35) {
    performanceTier = "minimum";
  } else {
    performanceTier = "poor";
  }

  // 5. Bottlenecks & Upgrades (Simulation-based Sensitivity Analysis §14-§15)
  const components = {
    cpu: cpuEval,
    memory: memoryEval,
    gpu: gpuEval,
    vram: vramEval,
    storage: storageEval,
    os: osEval,
  };

  const bottlenecks = analyzeBottlenecks(hardware, demands, components, appsList);

  const upgradeRecommendations = runUpgradeSimulation
    ? generateUpgradeRecommendations(
        hardware,
        demands,
        selectedWorkloads,
        softwareVersions,
        finalScore,
        appsList
      )
    : [];

  const assumptions: string[] = [];
  if (isSimultaneous) {
    assumptions.push("Applications are modeled for active simultaneous usage with foreground/background concurrency weights.");
  } else {
    assumptions.push("Applications are modeled running individually, taking the peak requirement of single software.");
  }
  assumptions.push(`OS & baseline background reserve set to ~${demands.osBackgroundReserveGb}GB with 15% safety headroom.`);

  const caveats: string[] = [];
  if (!isVerifiedHardware) {
    caveats.push("Hardware model was entered manually and not matched against catalog benchmarks. Scores reflect estimated performance.");
  }
  if (hardware.deviceType === "laptop") {
    caveats.push("Laptop sustained performance and thermal dissipation can vary under continuous multi-core compile or rendering workloads.");
  }

  // Cap confidence if data quality is stale, partial, conflicting, or unverified (§2, §18)
  const qualityFactors: Record<string, number> = {
    VERIFIED: 1.0,
    TEST_DATA_ONLY: 0.95,
    PARTIAL: 0.75,
    STALE: 0.55,
    CONFLICTING: 0.50,
    INSUFFICIENT: 0.40,
  };

  let lowestQualityFactor = 1.0;
  for (const p of perAppEvaluations) {
    const dq = p.requirementProvenance.dataQuality;
    const factor = qualityFactors[dq] ?? (p.requirementProvenance.isFresh ? 0.85 : 0.55);
    if (factor < lowestQualityFactor) {
      lowestQualityFactor = factor;
    }
  }

  const confidence = Math.round(
    (cpuEval.confidence * 0.3 +
     memoryEval.confidence * 0.35 +
     gpuEval.confidence * 0.2 +
     storageEval.confidence * 0.15) * (isVerifiedHardware ? 1.0 : 0.8) * lowestQualityFactor
  );

  const calculationTrace = buildCalculationTrace(hardware, demands, components);
  const evaluationFingerprint = generateEvaluationFingerprint({
    hardware,
    workloads: selectedWorkloads,
    engineVersion: ENGINE_VERSION,
    policyVersion: POLICY_VERSION,
    benchmarkDatasetVersion: BENCHMARK_DATASET_VERSION,
    normalizationAlgorithmVersion: NORMALIZATION_ALGORITHM_VERSION,
  });

  const hasStaleRequirements = perAppEvaluations.some(p => !p.requirementProvenance.isFresh || p.requirementProvenance.dataQuality === "STALE");
  metrics.recordEvaluation(5, confidence, !isVerifiedHardware, hasStaleRequirements);

  return {
    compatibilityStatus: globalHardCompatibility,
    performanceTier,
    score: isHardIncompatible ? 0 : finalScore,
    baseScore,
    criticalPenalty,
    confidence,
    isHardIncompatible,
    components,
    perAppEvaluations,
    concurrencyMetrics,
    bottlenecks,
    upgradeRecommendations,
    explanations: [...globalReasons, ...memoryReasons, ...cpuReasons, ...gpuReasons],
    assumptions,
    caveats,
    meta: {
      engineVersion: ENGINE_VERSION,
      policyVersion: POLICY_VERSION,
      benchmarkDatasetVersion: BENCHMARK_DATASET_VERSION,
      normalizationAlgorithmVersion: NORMALIZATION_ALGORITHM_VERSION,
      evaluationFingerprint,
      evaluatedAt,
      isVerifiedHardware,
      calculationTrace,
    },
  };
}
