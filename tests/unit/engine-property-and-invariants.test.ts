import { describe, it, expect } from "vitest";
import { evaluateCompatibility } from "../../lib/engine/evaluate";
import {
  DEV_LAPTOP_16GB_FIXTURE,
  FULL_STACK_DEV_WORKLOADS,
  SAMPLE_SOFTWARE_VERSIONS,
} from "../fixtures";
import { HardwareProfile } from "../../lib/domain/hardware";

describe("Deterministic Engine Property & Invariant Tests", () => {
  // Invariant 1: Monotonicity in RAM sizing
  it("Invariant 1: More RAM never makes memory adequacy score worse", () => {
    const ramTiers = [4, 8, 16, 24, 32, 48, 64, 128];
    const scores: number[] = [];

    for (const ram of ramTiers) {
      const hw: HardwareProfile = {
        ...DEV_LAPTOP_16GB_FIXTURE,
        ram: { ...DEV_LAPTOP_16GB_FIXTURE.ram, totalGb: ram },
      };

      const res = evaluateCompatibility({
        hardware: hw,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      scores.push(res.components.memory.score);
    }

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });

  // Invariant 2: Monotonicity in Storage free space
  it("Invariant 2: More free storage space never creates or worsens a storage blocker", () => {
    const storageTiers = [10, 30, 60, 120, 250, 500, 1000];
    const scores: number[] = [];

    for (const freeGb of storageTiers) {
      const hw: HardwareProfile = {
        ...DEV_LAPTOP_16GB_FIXTURE,
        storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb, isSystemDrive: true }],
      };

      const res = evaluateCompatibility({
        hardware: hw,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      scores.push(res.components.storage.score);
    }

    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });

  // Invariant 3: Capability satisfaction monotonicity
  it("Invariant 3: Satisfying a missing capability cannot reduce overall compatibility or score", () => {
    // Machine without CUDA vs same machine with CUDA enabled
    const nonCudaGpu = {
      ...DEV_LAPTOP_16GB_FIXTURE,
      gpu: { ...DEV_LAPTOP_16GB_FIXTURE.gpu!, supportsCuda: false, manufacturer: "Intel" as const },
    };

    const cudaGpu = {
      ...DEV_LAPTOP_16GB_FIXTURE,
      gpu: { ...DEV_LAPTOP_16GB_FIXTURE.gpu!, supportsCuda: true, manufacturer: "NVIDIA" as const },
    };

    const resNonCuda = evaluateCompatibility({
      hardware: nonCudaGpu,
      workloads: FULL_STACK_DEV_WORKLOADS,
      softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
    });

    const resCuda = evaluateCompatibility({
      hardware: cudaGpu,
      workloads: FULL_STACK_DEV_WORKLOADS,
      softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
    });

    expect(resCuda.score).toBeGreaterThanOrEqual(resNonCuda.score);
  });

  // Invariant 4: Zero Invented Numbers (Missing data stays UNKNOWN)
  it("Invariant 4: Missing data never silently turns into invented numbers", () => {
    const missingMetadataVersion = {
      ...SAMPLE_SOFTWARE_VERSIONS[0]!,
      dataQuality: "INSUFFICIENT" as const,
      minimumRequirements: {
        ...SAMPLE_SOFTWARE_VERSIONS[0]!.minimumRequirements,
        cpu: undefined,
      },
    };

    const res = evaluateCompatibility({
      hardware: DEV_LAPTOP_16GB_FIXTURE,
      workloads: FULL_STACK_DEV_WORKLOADS,
      softwareVersions: [missingMetadataVersion, ...SAMPLE_SOFTWARE_VERSIONS.slice(1)],
    });

    expect(res.uncertainty?.performance).toBe("ESTIMATED");
  });

  // Invariant 5: Strict Mathematical Determinism
  it("Invariant 5: Identical input always produces identical output and identical fingerprint", () => {
    const input = {
      hardware: DEV_LAPTOP_16GB_FIXTURE,
      workloads: FULL_STACK_DEV_WORKLOADS,
      softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
    };

    const firstRun = evaluateCompatibility(input);

    for (let i = 0; i < 20; i++) {
      const run = evaluateCompatibility(input);
      expect(run.meta.evaluationFingerprint).toBe(firstRun.meta.evaluationFingerprint);
      expect(run.score).toBe(firstRun.score);
      expect(run.concurrencyMetrics.ramPressureRatio).toBe(firstRun.concurrencyMetrics.ramPressureRatio);
      expect(run).toEqual(firstRun);
    }
  });
});
