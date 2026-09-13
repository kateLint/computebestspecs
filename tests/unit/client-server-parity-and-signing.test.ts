import { describe, it, expect } from "vitest";
import { signEvaluationSnapshot, verifySnapshotSignature, canonicalSerialize } from "../../services/security/snapshot-signer";
import { evaluatePlatformCompliance, resolveCapabilityDependencyGraph } from "../../services/compatibility/platform-guardrails";
import { evaluatePromotionGate } from "../../services/ingestion/promotion-gate";
import { buildSanitizedSimulationBundle } from "../../services/client/simulation-bundle";
import { evaluateCompatibility } from "../../services/compatibility/compatibility-engine";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SoftwareVersion, SelectedWorkload } from "../../lib/domain/software";

describe("Trust Layer, Platform Guardrails & Promotion Gate Suite", () => {
  const sampleHardware: HardwareProfile = {
    cpu: { model: "AMD Ryzen 5 5600H", architecture: "x86_64", performanceScore: 68, laptopVariant: true },
    gpu: { model: "NVIDIA RTX 3050 Laptop", type: "dedicated", performanceScore: 55, vramGb: 4, supportsCuda: true },
    ram: { totalGb: 16 },
    storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 200 }],
    os: { family: "windows", version: "11", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "laptop",
    supportsVirtualization: true,
  };

  const sampleVersion: SoftwareVersion = {
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
      gpu: { minimumPerformanceScore: 35, minimumVramGb: 1.5, requiresCuda: false },
      storage: { installGb: 20, scratchSpaceGb: 20 },
      operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      requiresVirtualization: false,
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
  };

  const sampleWorkload: SelectedWorkload = {
    softwareId: "photoshop",
    softwareName: "Photoshop",
    softwareVersionId: "ver_ps",
    versionString: "2024",
    workloadId: "w_ps",
    workloadName: "Standard",
    intensity: "medium",
    concurrency: "foreground",
  };

  it("1. Signs snapshot with HMAC-SHA256 and detects tampering (§HMAC Result Integrity)", () => {
    const rawSnapshot = {
      evaluationId: "eval_12345",
      hardware: { cpu: "Ryzen 5 5600H", ram: 16 },
      score: 78,
      engineVersion: "1.0.0",
    };

    const integrity = signEvaluationSnapshot(rawSnapshot, "secret_key_123", "v1");
    expect(integrity.algorithm).toBe("HMAC-SHA256");
    expect(integrity.signature).toBeDefined();

    // Verification must pass on untampered payload
    const checkValid = verifySnapshotSignature(rawSnapshot, integrity, "secret_key_123");
    expect(checkValid.isValid).toBe(true);

    // Tampering test: Changing score from 78 to 99 must fail verification
    const tamperedSnapshot = { ...rawSnapshot, score: 99 };
    const checkTampered = verifySnapshotSignature(tamperedSnapshot, integrity, "secret_key_123");
    expect(checkTampered.isValid).toBe(false);
    expect(checkTampered.reason).toContain("tampered");
  });

  it("2. Evaluates client/server engine parity with identical evaluation fingerprint", () => {
    // Server execution
    const serverResult = evaluateCompatibility(sampleHardware, [sampleWorkload], [sampleVersion], true, true);

    // Client execution via sanitized bundle
    const bundle = buildSanitizedSimulationBundle(sampleHardware, [sampleWorkload], [sampleVersion]);
    expect(bundle.isSanitized).toBe(true);

    const clientResult = evaluateCompatibility(bundle.hardware, bundle.workloads, [sampleVersion], true, true);

    // Both environments must produce identical scores and fingerprints
    expect(clientResult.score).toBe(serverResult.score);
    expect(clientResult.compatibilityStatus).toBe(serverResult.compatibilityStatus);
    expect(clientResult.meta.evaluationFingerprint).toBe(serverResult.meta.evaluationFingerprint);
  });

  it("3. Separates hardware, OS eligibility, and application platform support layers", () => {
    const linuxHardware: HardwareProfile = {
      ...sampleHardware,
      os: { family: "linux", architecture: "x86_64" },
    };

    const platformEval = evaluatePlatformCompliance(linuxHardware, sampleVersion);

    // Hardware is capable, but Photoshop officially doesn't support Linux -> UNSUPPORTED_BY_VENDOR
    expect(platformEval.hardwareCapabilities.status).toBe("SUPPORTED");
    expect(platformEval.applicationPlatformSupport.status).toBe("UNSUPPORTED_BY_VENDOR");
    expect(platformEval.overallStatus).toBe("UNSUPPORTED_BY_VENDOR");
  });

  it("4. Resolves capability dependency graph", () => {
    const graphResult = resolveCapabilityDependencyGraph(sampleHardware, [
      { capability: "virtualization", operator: "REQUIRED", severity: "HARD" },
      { capability: "cuda", operator: "REQUIRED", severity: "HARD" },
    ]);

    expect(graphResult.satisfied).toBe(true);
    expect(graphResult.failedRequirements.length).toBe(0);
  });

  it("5. Enforces Promotion Gate blockers when hard regression exceeds 0.5%", () => {
    const blockedGateDecision = evaluatePromotionGate({
      canAutoApprove: false,
      requiresHumanReview: true,
      overallSeverity: "BREAKING",
      changes: [{ field: "minimumRamGb", description: "RAM requirement increased to 64GB", severity: "BREAKING" }],
      regressionImpact: {
        totalScenariosTested: 100,
        unchangedCount: 80,
        minorScoreShiftCount: 5,
        tierShiftCount: 5,
        newlyIncompatibleCount: 10, // 10% regression > 0.5% threshold
        newlyIncompatibleScenarios: ["Scenario A", "Scenario B"],
      },
    });

    expect(blockedGateDecision.status).toBe("BLOCKED");
    expect(blockedGateDecision.blockReasons.some(r => r.includes("exceeds maximum allowed threshold of 0.5%"))).toBe(true);
  });
});
