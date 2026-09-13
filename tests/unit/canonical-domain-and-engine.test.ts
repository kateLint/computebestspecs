import { describe, it, expect } from "vitest";
import {
  DEV_LAPTOP_16GB_FIXTURE,
  DEV_LAPTOP_32GB_FIXTURE,
  FULL_STACK_DEV_WORKLOADS,
  SAMPLE_SOFTWARE_VERSIONS,
  UNSUPPORTED_OS_FIXTURE,
  VIRTUALIZATION_DISABLED_FIXTURE,
  LOW_STORAGE_FIXTURE,
} from "../fixtures";
import { evaluateCompatibility } from "../../lib/engine/evaluate";
import { presentEvaluationResult } from "../../lib/engine/presenter/result-presenter";
import {
  DomainValidationError,
  InsufficientDataError,
  AmbiguousHardwareError,
} from "../../lib/domain/errors";
import {
  ResourceVectorSchema,
  ResourceDemandSchema,
  CompatibilityResultSchema,
} from "../../lib/validation";

describe("Constraint-and-Capability Evaluation Engine & Presenter (§Phase 0 Final Freeze)", () => {
  describe("1. Domain Invariants & Custom Error Classes", () => {
    it("should instantiate DomainValidationError with structured issues", () => {
      const err = new DomainValidationError("Invalid hardware", [{ path: "ramGb", message: "Required" }]);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(DomainValidationError);
      expect(err.name).toBe("DomainValidationError");
      expect(err.issues).toHaveLength(1);
    });

    it("should instantiate InsufficientDataError with missing fields list", () => {
      const err = new InsufficientDataError("Missing required specs", ["cpu.physicalCores", "ramGb"]);
      expect(err).toBeInstanceOf(InsufficientDataError);
      expect(err.missingFields).toContain("ramGb");
    });

    it("should instantiate AmbiguousHardwareError with candidate resolution array", () => {
      const err = new AmbiguousHardwareError("Ambiguous GPU", "RTX 4070", ["RTX 4070 Desktop", "RTX 4070 Laptop"]);
      expect(err).toBeInstanceOf(AmbiguousHardwareError);
      expect(err.candidates).toHaveLength(2);
    });
  });

  describe("2. Boundary Runtime Schemas & Resource Vectors", () => {
    it("should validate a valid ResourceVector", () => {
      const validVector = {
        cpu: 45,
        ramGb: 16,
        vramGb: 6,
        diskReadMBps: 500,
      };
      const parsed = ResourceVectorSchema.safeParse(validVector);
      expect(parsed.success).toBe(true);
    });

    it("should reject invalid resource vectors (negative RAM or >100% CPU)", () => {
      const invalidVector = {
        cpu: 150,
        ramGb: -4,
      };
      const parsed = ResourceVectorSchema.safeParse(invalidVector);
      expect(parsed.success).toBe(false);
    });

    it("should validate complete ResourceDemand across idle, typical, and peak", () => {
      const validDemand = {
        idle: { ramGb: 1.5 },
        typical: { ramGb: 6.0, cpu: 50 },
        peak: { ramGb: 11.0, cpu: 85 },
        confidence: { level: "HIGH", reasons: ["Official vendor docs"] },
        evidence: [],
      };
      const parsed = ResourceDemandSchema.safeParse(validDemand);
      expect(parsed.success).toBe(true);
    });
  });

  describe("3. Golden Scenarios: Capability Graph & Pure Engine Decisions", () => {
    it("Scenario A: 16GB Dev Laptop (Supported, RAM pressure bottleneck, 32GB recommendation)", () => {
      const result = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      // Validated runtime schema
      const schemaCheck = CompatibilityResultSchema.safeParse(result);
      expect(schemaCheck.success).toBe(true);

      // Core engine assertions
      expect(result.compatibilityStatus).toBe("compatible");
      expect(result.concurrencyMetrics.peakConcurrentRamGb).toBeGreaterThan(16);
      expect(result.concurrencyMetrics.isSwappingLikely).toBe(true);
      
      // Primary bottleneck must be RAM/memory
      expect(result.primaryBottleneck?.component).toBe("memory");
      expect(result.primaryBottleneck?.severity).toBe("critical");
      expect(result.primaryBottleneck?.parameters).toHaveProperty("installedGb", 16);

      // Upgrade recommendations
      expect(result.upgradeRecommendations.length).toBeGreaterThan(0);
      expect(result.upgradeRecommendations[0]?.component).toBe("memory");
      expect(result.upgradeRecommendations[0]?.to).toBe("32 GB");
      expect(result.upgradeRecommendations[0]?.simulationDelta?.clearsPrimaryBottleneck).toBe(true);

      // Confidence
      expect(result.confidence).toBeGreaterThanOrEqual(80);

      // Result Presenter ViewModel verification
      const viewModel = presentEvaluationResult(result);
      expect(viewModel.hero.verdict).toBe("BORDERLINE_FIT");
      expect(viewModel.primaryBottleneck?.component).toBe("memory");
      expect(viewModel.primaryBottleneck?.isPrimary).toBe(true);
      expect(viewModel.topRecommendation?.to).toBe("32 GB");
    });

    it("Scenario B: 32GB Dev Laptop (Supported, cleared RAM bottleneck, higher score)", () => {
      const result16 = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      const result32 = evaluateCompatibility({
        hardware: DEV_LAPTOP_32GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result32.compatibilityStatus).toBe("compatible");
      expect(result32.score).toBeGreaterThan(result16.score);
      expect(result32.components.memory.score).toBeGreaterThan(result16.components.memory.score);
      expect(result32.concurrencyMetrics.isSwappingLikely).toBe(false);
      
      // Memory should no longer be a critical bottleneck
      const ramBottleneck = result32.bottlenecks.find(b => b.component === "memory");
      expect(ramBottleneck?.severity).not.toBe("critical");

      const viewModel16 = presentEvaluationResult(result16);
      const viewModel32 = presentEvaluationResult(result32);
      expect(viewModel32.hero.score).toBeGreaterThan(viewModel16.hero.score);
      expect(["GOOD_FIT", "ACCEPTABLE_FIT"]).toContain(viewModel32.hero.verdict);
    });

    it("Scenario C: Unsupported OS (Hard Incompatibility overrides performance)", () => {
      const result = evaluateCompatibility({
        hardware: UNSUPPORTED_OS_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result.compatibilityStatus).toBe("incompatible");
      expect(result.isHardIncompatible).toBe(true);
      expect(result.score).toBeLessThanOrEqual(25);
      expect(result.explanations.some(e => e.code === "OS_UNSUPPORTED")).toBe(true);

      const viewModel = presentEvaluationResult(result);
      expect(viewModel.hero.verdict).toBe("INCOMPATIBLE");
    });

    it("Scenario D: Virtualization Required but Disabled (Hard Blocker for Emulator)", () => {
      const result = evaluateCompatibility({
        hardware: VIRTUALIZATION_DISABLED_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result.compatibilityStatus).toBe("incompatible");
      const emuEval = result.perAppEvaluations.find(a => a.softwareId === "android-emulator");
      expect(emuEval?.isHardIncompatible).toBe(true);
      expect(result.explanations.some(e => e.code === "VIRTUALIZATION_UNSUPPORTED")).toBe(true);
    });

    it("Scenario E: Low Storage Free Space (Storage Inadequacy Detected)", () => {
      const result = evaluateCompatibility({
        hardware: LOW_STORAGE_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result.components.storage.score).toBeLessThanOrEqual(50);
      expect(result.components.storage.reasons.some(r => r.code === "STORAGE_FREE_LOW")).toBe(true);
    });

    it("Scenario F: Pure Engine Determinism (Identical inputs yield exact identical results)", () => {
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

      expect(run1).toEqual(run2);
    });
  });
});
