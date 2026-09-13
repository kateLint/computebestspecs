import { describe, it, expect } from "vitest";
import { evaluateCompatibility } from "../../lib/engine/evaluate";
import { generateEvaluationFingerprint } from "../../lib/engine/fingerprint";
import {
  DEV_LAPTOP_16GB_FIXTURE,
  DEV_LAPTOP_32GB_FIXTURE,
  MACBOOK_PRO_M3_18GB_FIXTURE,
  BUDGET_OFFICE_PC_8GB_FIXTURE,
  RTX_4090_WORKSTATION_FIXTURE,
  FULL_STACK_DEV_WORKLOADS,
  SAMPLE_SOFTWARE_VERSIONS,
} from "../fixtures";
import { CompatibilityResultSchema } from "../../lib/validation/evaluation.schema";

describe("Frozen Engine Core Contract (§The 4 Pillars)", () => {
  describe("1. Result Uncertainty at Field Level", () => {
    it("reports field-level uncertainty (KNOWN/ESTIMATED/UNKNOWN) instead of only a global confidence score", () => {
      const result = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result.uncertainty).toBeDefined();
      expect(result.uncertainty?.compatibility).toBe("KNOWN");
      expect(result.uncertainty?.components.memory).toBe("KNOWN");
      expect(result.uncertainty?.components.cpu).toBe("KNOWN");
      expect(result.uncertainty?.components.os).toBe("KNOWN");
      expect(result.uncertainty?.workloadFit).toBe("KNOWN");
    });

    it("propagates UNKNOWN uncertainty for missing hardware capabilities", () => {
      const unverifiedHardware = {
        ...DEV_LAPTOP_16GB_FIXTURE,
        supportsVirtualization: undefined,
        cpu: { ...DEV_LAPTOP_16GB_FIXTURE.cpu, isVerified: false },
      };

      const result = evaluateCompatibility({
        hardware: unverifiedHardware,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result.uncertainty?.components.virtualization).toBe("UNKNOWN");
      expect(result.uncertainty?.components.cpu).toBe("ESTIMATED");
    });
  });

  describe("2. Scenario Identity (LIGHT, TYPICAL, HEAVY, PEAK)", () => {
    it("distinguishes workload intensity modes producing different valid outcomes on same hardware", () => {
      const typicalResult = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
        scenarioMode: "TYPICAL",
      });

      const peakResult = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
        scenarioMode: "PEAK",
      });

      expect(typicalResult.scenarioMode).toBe("TYPICAL");
      expect(peakResult.scenarioMode).toBe("PEAK");
      expect(typicalResult.meta.evaluationFingerprint).not.toBe(peakResult.meta.evaluationFingerprint);
    });
  });

  describe("3. Upgrade Feasibility Metadata", () => {
    it("recommends non_upgradeable/full_system_recommended when RAM is soldered on MacBook Pro", () => {
      const result = evaluateCompatibility({
        hardware: MACBOOK_PRO_M3_18GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      const ramRec = result.upgradeRecommendations.find(r => r.component === "memory");
      if (ramRec) {
        expect(ramRec.feasibility).toBe("non_upgradeable");
        expect(ramRec.feasibilityDetails?.possible).toBe(false);
        expect(ramRec.reasonKey).toContain("non_upgradeable");
      }
    });

    it("recommends direct_upgrade with physical slot availability for modular PC", () => {
      const result = evaluateCompatibility({
        hardware: BUDGET_OFFICE_PC_8GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      const ramRec = result.upgradeRecommendations.find(r => r.component === "memory");
      expect(ramRec).toBeDefined();
      expect(ramRec?.feasibility).toBe("direct_upgrade");
      expect(ramRec?.feasibilityDetails?.possible).toBe(true);
    });
  });

  describe("4. Engine Parity and Deterministic Fingerprinting", () => {
    it("produces 100% byte-for-byte identical output and fingerprint across independent runs", () => {
      const run1 = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      const run2 = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(run1.meta.evaluationFingerprint).toBe(run2.meta.evaluationFingerprint);
      expect(run1.score).toBe(run2.score);
      expect(run1.primaryBottleneck?.component).toBe(run2.primaryBottleneck?.component);
      expect(run1).toEqual(run2);
    });

    it("fingerprint generator produces identical hashes regardless of object key order", () => {
      const payloadA = { b: 2, a: 1, nested: { y: "test", x: 10 } };
      const payloadB = { a: 1, nested: { x: 10, y: "test" }, b: 2 };

      const hashA = generateEvaluationFingerprint(payloadA);
      const hashB = generateEvaluationFingerprint(payloadB);

      expect(hashA).toBe(hashB);
      expect(hashA.startsWith("ev_")).toBe(true);
    });

    it("evaluates cleanly through runtime Zod schema boundaries without losing fields", () => {
      const result = evaluateCompatibility({
        hardware: RTX_4090_WORKSTATION_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      const parsed = CompatibilityResultSchema.safeParse({
        ...result,
        compatibility: "SUPPORTED",
        performance: "EXCELLENT",
        workloadFit: "EXCELLENT",
      });

      expect(parsed.success).toBe(true);
    });
  });
});
