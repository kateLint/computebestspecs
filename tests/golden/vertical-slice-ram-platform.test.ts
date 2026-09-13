import { describe, it, expect } from "vitest";
import {
  DEV_LAPTOP_16GB_FIXTURE,
  DEV_LAPTOP_32GB_FIXTURE,
  FULL_STACK_DEV_WORKLOADS,
  SAMPLE_SOFTWARE_VERSIONS,
  UNSUPPORTED_OS_FIXTURE,
  VIRTUALIZATION_DISABLED_FIXTURE,
} from "../fixtures";
import { evaluateCompatibility } from "../../lib/engine/evaluate";
import { evaluateMemoryRule } from "../../lib/engine/rules/evaluate-memory";
import { evaluatePlatformRule } from "../../lib/engine/rules/evaluate-platform";
import { evaluateVirtualizationRule } from "../../lib/engine/rules/evaluate-virtualization";
import { aggregateMemoryDemand } from "../../lib/engine/workload/aggregate-memory-demand";
import { recommendMemoryUpgrade } from "../../lib/engine/recommendations/recommend-memory-upgrade";
import { SoftwareVersion } from "../../lib/domain/software";

describe("Vertical Slice: RAM + Platform + Virtualization (§First Engine Milestone)", () => {
  describe("1. Golden Scenario: 16 GB Developer Laptop", () => {
    it("evaluates realistic multi-app dev setup with ~18GB typical and ~24GB peak RAM demand", () => {
      const demand = aggregateMemoryDemand(
        DEV_LAPTOP_16GB_FIXTURE.ram.totalGb,
        DEV_LAPTOP_16GB_FIXTURE.os.family,
        FULL_STACK_DEV_WORKLOADS,
        SAMPLE_SOFTWARE_VERSIONS
      );

      // Verify realistic demand calculation from fixture workload data
      expect(demand.osReserveGb).toBe(2.5); // Windows 11 default reserve
      expect(demand.totalTypicalGb).toBeGreaterThanOrEqual(16);
      expect(demand.totalTypicalGb).toBeLessThanOrEqual(22); // ~18-20 GB
      expect(demand.totalPeakGb).toBeGreaterThanOrEqual(22);
      expect(demand.totalPeakGb).toBeLessThanOrEqual(30);    // ~24-28.8 GB
      
      // Memory status under 16 GB
      expect(demand.status).toBe("INSUFFICIENT");
      expect(demand.isBottleneck).toBe(true);
      expect(demand.peakPressureRatio).toBeGreaterThan(1.25);
    });

    it("evaluates full compatibility: Supported, RAM bottleneck, 32 GB upgrade recommendation", () => {
      const result = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result.compatibilityStatus).toBe("compatible");
      expect(result.primaryBottleneck?.component).toBe("memory");
      expect(result.primaryBottleneck?.severity).toBe("critical");
      expect(result.primaryBottleneck?.parameters).toHaveProperty("installedGb", 16);

      // Recommendations come from counterfactual simulation
      expect(result.upgradeRecommendations.length).toBeGreaterThan(0);
      expect(result.upgradeRecommendations[0]?.component).toBe("memory");
      expect(result.upgradeRecommendations[0]?.from).toBe("16 GB");
      expect(result.upgradeRecommendations[0]?.to).toBe("32 GB");
    });
  });

  describe("2. Core Engine Invariants", () => {
    it("invariant 1: does not invent missing requirements (returns UNKNOWN)", () => {
      const incompleteVersion: SoftwareVersion = {
        id: "ver_unknown_ram",
        softwareId: "custom_tool",
        version: "1.0",
        isLatest: true,
        supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: {
          minimumRamGb: undefined as any, // Missing requirement!
          storage: { installGb: 5 },
          operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        },
        workloads: [],
        sourceRecords: [],
      };

      const evalResult = evaluateMemoryRule(16, incompleteVersion, "Custom Tool");
      expect(evalResult.outcome).toBe("UNKNOWN");
      expect(evalResult.reasonCode).toBe("REQUIREMENT_DATA_INSUFFICIENT");
    });

    it("invariant 2: propagates UNKNOWN for missing platform metadata", () => {
      const noPlatformVer: SoftwareVersion = {
        id: "ver_no_os",
        softwareId: "no_os_tool",
        version: "1.0",
        isLatest: true,
        supportedOperatingSystems: [], // Missing OS support metadata!
        minimumRequirements: {
          minimumRamGb: 4,
          storage: { installGb: 1 },
          operatingSystems: [],
        },
        workloads: [],
        sourceRecords: [],
      };

      const platResult = evaluatePlatformRule(
        DEV_LAPTOP_16GB_FIXTURE.os,
        DEV_LAPTOP_16GB_FIXTURE.architecture,
        noPlatformVer,
        "No OS Tool"
      );
      expect(platResult.outcome).toBe("UNKNOWN");
      expect(platResult.reasonCode).toBe("REQUIREMENT_DATA_INSUFFICIENT");
    });

    it("invariant 3: hard blockers override performance scoring", () => {
      const result = evaluateCompatibility({
        hardware: UNSUPPORTED_OS_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result.compatibilityStatus).toBe("incompatible");
      expect(result.isHardIncompatible).toBe(true);
      expect(result.score).toBeLessThanOrEqual(25);
    });

    it("invariant 4: monotonicity — more RAM cannot make memory adequacy worse", () => {
      const tiers = [8, 16, 32, 64];
      const scores: number[] = [];

      for (const ram of tiers) {
        const hardware = {
          ...DEV_LAPTOP_16GB_FIXTURE,
          ram: { ...DEV_LAPTOP_16GB_FIXTURE.ram, totalGb: ram },
        };
        const res = evaluateCompatibility({
          hardware,
          workloads: FULL_STACK_DEV_WORKLOADS,
          softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
        });
        scores.push(res.components.memory.score);
      }

      // Each tier must be >= the previous tier
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
      }
    });

    it("invariant 5: 32 GB improves the 16 GB developer scenario", () => {
      const res16 = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      const res32 = evaluateCompatibility({
        hardware: DEV_LAPTOP_32GB_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(res32.score).toBeGreaterThan(res16.score);
      expect(res32.components.memory.score).toBeGreaterThan(res16.components.memory.score);
      expect(res32.concurrencyMetrics.isSwappingLikely).toBe(false);
    });

    it("invariant 6: does not recommend 64 GB when 32 GB solves the bottleneck", () => {
      const demand = aggregateMemoryDemand(
        16,
        "windows",
        FULL_STACK_DEV_WORKLOADS,
        SAMPLE_SOFTWARE_VERSIONS
      );

      const recs = recommendMemoryUpgrade(
        DEV_LAPTOP_16GB_FIXTURE,
        FULL_STACK_DEV_WORKLOADS,
        SAMPLE_SOFTWARE_VERSIONS,
        demand
      );

      expect(recs).toHaveLength(1);
      expect(recs[0]?.to).toBe("32 GB"); // Not 64 GB!
    });

    it("invariant 7: virtualization disabled blocks emulator workload", () => {
      const emuVersion = SAMPLE_SOFTWARE_VERSIONS.find(v => v.softwareId === "android-emulator")!;
      const virtRule = evaluateVirtualizationRule(
        VIRTUALIZATION_DISABLED_FIXTURE,
        emuVersion,
        "Android Emulator"
      );

      expect(virtRule.outcome).toBe("FAIL");
      expect(virtRule.reasonCode).toBe("VIRTUALIZATION_UNSUPPORTED");

      const result = evaluateCompatibility({
        hardware: VIRTUALIZATION_DISABLED_FIXTURE,
        workloads: FULL_STACK_DEV_WORKLOADS,
        softwareVersions: SAMPLE_SOFTWARE_VERSIONS,
      });

      expect(result.compatibilityStatus).toBe("incompatible");
      const emuEval = result.perAppEvaluations.find(a => a.softwareId === "android-emulator");
      expect(emuEval?.isHardIncompatible).toBe(true);
    });
  });
});
