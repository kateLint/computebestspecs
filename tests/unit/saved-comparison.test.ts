import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addComputerToComparison,
  getComparisonSet,
  removeComputerFromComparison,
  clearSavedComparisons,
  MAX_COMPARISON_ITEMS,
} from "@/lib/comparison/storage";
import { analyzeComparisonSet } from "@/lib/comparison/engine";
import { EvaluatedComparisonItem } from "@/lib/comparison/types";

describe("Saved Comparison Feature", () => {
  beforeEach(() => {
    clearSavedComparisons();
  });

  it("enforces maximum 3 items limit in domain logic", () => {
    const item1 = {
      name: "PC 1",
      hardware: {
        cpu: "Intel Core i7-13700K",
        gpu: "NVIDIA GeForce RTX 4070",
        ramGb: 32,
        storageGb: 1000,
        os: "Windows 11",
        formFactor: "desktop" as const,
        rawHardwareProfile: {} as any,
      },
      workloads: [],
      isSimultaneous: true,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    };

    const item2 = {
      name: "PC 2",
      hardware: {
        cpu: "AMD Ryzen 7 7800X3D",
        gpu: "NVIDIA GeForce RTX 4080",
        ramGb: 64,
        storageGb: 2000,
        os: "Windows 11",
        formFactor: "desktop" as const,
        rawHardwareProfile: {} as any,
      },
      workloads: [],
      isSimultaneous: true,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    };

    const item3 = {
      name: "PC 3",
      hardware: {
        cpu: "Apple M3 Pro",
        gpu: "Integrated 18-Core GPU",
        ramGb: 18,
        storageGb: 512,
        os: "macOS Sonoma",
        formFactor: "laptop" as const,
        rawHardwareProfile: {} as any,
      },
      workloads: [],
      isSimultaneous: true,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    };

    const item4 = {
      name: "PC 4",
      hardware: {
        cpu: "Intel Core i5-12400F",
        gpu: "NVIDIA GeForce RTX 3060",
        ramGb: 16,
        storageGb: 500,
        os: "Windows 11",
        formFactor: "desktop" as const,
        rawHardwareProfile: {} as any,
      },
      workloads: [],
      isSimultaneous: true,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    };

    const res1 = addComputerToComparison(item1);
    expect(res1.success).toBe(true);

    const res2 = addComputerToComparison(item2);
    expect(res2.success).toBe(true);

    const res3 = addComputerToComparison(item3);
    expect(res3.success).toBe(true);

    expect(getComparisonSet().items.length).toBe(3);

    // 4th item should be rejected
    const res4 = addComputerToComparison(item4);
    expect(res4.success).toBe(false);
    expect(res4.reason).toContain("You can compare up to three computers");
    expect(getComparisonSet().items.length).toBe(3);
  });

  it("prevents exact duplicate computer specifications from being added", () => {
    const item = {
      name: "My Gaming PC",
      hardware: {
        cpu: "AMD Ryzen 5 5600X",
        gpu: "NVIDIA GeForce RTX 3060",
        ramGb: 16,
        storageGb: 1000,
        os: "Windows 11",
        formFactor: "desktop" as const,
        rawHardwareProfile: {} as any,
      },
      workloads: [],
      isSimultaneous: true,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    };

    const res1 = addComputerToComparison(item);
    expect(res1.success).toBe(true);

    const res2 = addComputerToComparison(item);
    expect(res2.success).toBe(false);
    expect(res2.reason).toContain("already in your comparison set");
    expect(getComparisonSet().items.length).toBe(1);
  });

  it("removes a computer from comparison cleanly", () => {
    const item = {
      name: "Laptop Spec",
      hardware: {
        cpu: "Intel Core i7-13700H",
        gpu: "NVIDIA GeForce RTX 4060 Laptop",
        ramGb: 16,
        storageGb: 512,
        os: "Windows 11",
        formFactor: "laptop" as const,
        rawHardwareProfile: {} as any,
      },
      workloads: [],
      isSimultaneous: true,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    };

    const res = addComputerToComparison(item);
    expect(res.success).toBe(true);
    expect(getComparisonSet().items.length).toBe(1);

    removeComputerFromComparison(res.item!.id);
    expect(getComparisonSet().items.length).toBe(0);
  });

  it("analyzes comparison differences and generates trade-offs", () => {
    const evaluated: EvaluatedComparisonItem[] = [
      {
        item: {
          schemaVersion: 1,
          id: "comp_1",
          name: "Desktop Workstation",
          hardware: {
            cpu: "Ryzen 9 7950X",
            gpu: "RTX 4090",
            ramGb: 64,
            storageGb: 2000,
            os: "Windows 11",
            formFactor: "desktop",
            rawHardwareProfile: {} as any,
          },
          workloads: [],
          isSimultaneous: true,
          engineVersion: "1.0.0",
          catalogVersion: "1.0.0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        result: {
          score: 95,
          performanceTier: "excellent",
          compatibilityStatus: "compatible",
          baseScore: 95,
          criticalPenalty: 0,
          confidence: 90,
          isHardIncompatible: false,
          components: {
            cpu: { status: "PASS", score: 98, confidence: 90, reasons: [] },
            memory: { status: "PASS", score: 95, confidence: 90, reasons: [] },
            gpu: { status: "PASS", score: 99, confidence: 90, reasons: [] },
            vram: { status: "PASS", score: 95, confidence: 90, reasons: [] },
            storage: { status: "PASS", score: 90, confidence: 90, reasons: [] },
            os: { status: "PASS", score: 100, confidence: 90, reasons: [] },
          },
          perAppEvaluations: [],
          concurrencyMetrics: {
            steadyStateRamGb: 24,
            peakConcurrentRamGb: 32,
            totalEstimatedRamUsageGb: 36,
            safetyHeadroomGb: 28,
            osBackgroundReserveGb: 4,
            effectiveRequiredRamGb: 36,
            ramPressureRatio: 0.56,
            isSwappingLikely: false,
            activeWorkloadCount: 3,
            isSimultaneous: true,
          },
          bottlenecks: [],
          upgradeRecommendations: [],
          explanations: [],
          assumptions: [],
          caveats: [],
          meta: {
            engineVersion: "1.0.0",
            policyVersion: "1.0.0",
            benchmarkDatasetVersion: "1.0.0",
            normalizationAlgorithmVersion: "1.0.0",
            evaluationFingerprint: "fp1",
            evaluatedAt: new Date().toISOString(),
            isVerifiedHardware: true,
          },
        },
        isRecalculated: false,
      },
      {
        item: {
          schemaVersion: 1,
          id: "comp_2",
          name: "Entry Laptop",
          hardware: {
            cpu: "Core i5-1135G7",
            gpu: "Intel Iris Xe",
            ramGb: 8,
            storageGb: 256,
            os: "Windows 11",
            formFactor: "laptop",
            rawHardwareProfile: {} as any,
          },
          workloads: [],
          isSimultaneous: true,
          engineVersion: "1.0.0",
          catalogVersion: "1.0.0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        result: {
          score: 45,
          performanceTier: "poor",
          compatibilityStatus: "compatible",
          baseScore: 45,
          criticalPenalty: 30,
          confidence: 85,
          isHardIncompatible: false,
          components: {
            cpu: { status: "PASS", score: 55, confidence: 85, reasons: [] },
            memory: { status: "FAIL", score: 30, confidence: 90, reasons: [] },
            gpu: { status: "PASS", score: 40, confidence: 85, reasons: [] },
            vram: { status: "FAIL", score: 30, confidence: 85, reasons: [] },
            storage: { status: "PASS", score: 60, confidence: 85, reasons: [] },
            os: { status: "PASS", score: 100, confidence: 90, reasons: [] },
          },
          perAppEvaluations: [],
          concurrencyMetrics: {
            steadyStateRamGb: 12,
            peakConcurrentRamGb: 16,
            totalEstimatedRamUsageGb: 18,
            safetyHeadroomGb: 0,
            osBackgroundReserveGb: 4,
            effectiveRequiredRamGb: 18,
            ramPressureRatio: 2.25,
            isSwappingLikely: true,
            activeWorkloadCount: 3,
            isSimultaneous: true,
          },
          bottlenecks: [
            {
              component: "memory",
              severity: "critical",
              messageKey: "RAM_CONSTRAINED",
              reason: "Active workloads require 18GB RAM, exceeding the 8GB installed capacity.",
              parameters: {},
            },
          ],
          upgradeRecommendations: [],
          explanations: [],
          assumptions: [],
          caveats: [],
          meta: {
            engineVersion: "1.0.0",
            policyVersion: "1.0.0",
            benchmarkDatasetVersion: "1.0.0",
            normalizationAlgorithmVersion: "1.0.0",
            evaluationFingerprint: "fp2",
            evaluatedAt: new Date().toISOString(),
            isVerifiedHardware: true,
          },
        },
        isRecalculated: false,
      },
    ];

    const analysis = analyzeComparisonSet(evaluated);
    expect(analysis.bestMatchItemId).toBe("comp_1");
    expect(analysis.rows.length).toBeGreaterThan(5);
    expect(analysis.tradeOffs.length).toBe(2);

    const desktopTradeOff = analysis.tradeOffs.find((t) => t.itemId === "comp_1");
    expect(desktopTradeOff?.upgradeability).toBe("High");
    expect(desktopTradeOff?.pros.length).toBeGreaterThan(0);

    const laptopTradeOff = analysis.tradeOffs.find((t) => t.itemId === "comp_2");
    expect(laptopTradeOff?.upgradeability).toBe("Limited");
    expect(laptopTradeOff?.cons.length).toBeGreaterThan(0);
  });
});
