import { describe, it, expect } from "vitest";
import {
  HardwareProfileSchema,
  SelectedWorkloadSchema,
  CompatibilityResultSchema,
  BottleneckSchema,
} from "@/lib/validation/schemas";

describe("Evaluation Snapshot Validation & Generic Bottleneck", () => {
  it("validates a complete hardware profile and workload snapshot", () => {
    const rawHardware = {
      cpu: {
        model: "Intel Core i7-13700K",
        architecture: "x86_64",
        physicalCores: 16,
        performanceScore: 88,
      },
      ram: {
        totalGb: 32,
      },
      storage: [
        {
          type: "NVME_SSD",
          totalGb: 1000,
          freeGb: 450,
          isSystemDrive: true,
        },
      ],
      os: {
        family: "windows",
        version: "11",
        architecture: "x86_64",
      },
    };

    const parsedHardware = HardwareProfileSchema.safeParse(rawHardware);
    expect(parsedHardware.success).toBe(true);

    const rawWorkloads = [
      {
        softwareId: "android-studio",
        softwareName: "Android Studio",
        softwareVersionId: "v-2024",
        workloadId: "app-dev",
        workloadName: "Full Stack App Dev",
        intensity: "heavy",
        concurrency: "foreground",
      },
    ];

    const parsedWorkloads = SelectedWorkloadSchema.array().safeParse(rawWorkloads);
    expect(parsedWorkloads.success).toBe(true);
  });

  it("validates generic bottlenecks beyond RAM (e.g., GPU, VRAM, CPU, Storage)", () => {
    const vramBottleneck = {
      component: "vram",
      severity: "high",
      messageKey: "bottleneck_vram_model_exceeded",
      reason: "Local LLM weights require 12 GB VRAM; installed 8 GB.",
      parameters: {
        installedVramGb: 8,
        requiredVramGb: 12,
      },
    };

    const parsed = BottleneckSchema.safeParse(vramBottleneck);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.component).toBe("vram");
      expect(parsed.data.severity).toBe("high");
    }
  });

  it("safely handles 0 confidence score without defaulting to arbitrary fallback", () => {
    const rawResult = {
      compatibilityStatus: "compatible",
      performanceTier: "recommended",
      score: 85,
      baseScore: 85,
      confidence: 0,
      isHardIncompatible: false,
      components: {
        cpu: { status: "PASS", score: 85, confidence: 0, reasons: [] },
        memory: { status: "PASS", score: 90, confidence: 0, reasons: [] },
        gpu: { status: "PASS", score: 80, confidence: 0, reasons: [] },
        vram: { status: "PASS", score: 80, confidence: 0, reasons: [] },
        storage: { status: "PASS", score: 95, confidence: 0, reasons: [] },
        os: { status: "PASS", score: 100, confidence: 0, reasons: [] },
      },
    };

    const parsed = CompatibilityResultSchema.safeParse(rawResult);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.confidence).toBe(0);
    }
  });
});
