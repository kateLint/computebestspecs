import { describe, it, expect } from "vitest";
import { HardwareRequirementsSchema } from "@/lib/validation/schemas";

describe("Software Requirements Catalog Data Integrity", () => {
  it("validates realistic multi-dimensional hardware requirement profiles", () => {
    const rawReq = {
      minimumRamGb: 8,
      recommendedRamGb: 16,
      professionalRamGb: 32,
      cpu: {
        minimumPhysicalCores: 4,
        recommendedPhysicalCores: 8,
        minPerformanceScore: 60,
      },
      gpu: {
        minimumVramGb: 4,
        recommendedVramGb: 8,
        directX12Required: true,
        metalRequired: true,
      },
      storage: {
        installGb: 12,
        scratchDiskGb: 50,
        preferredType: "NVME_SSD",
      },
      operatingSystems: [
        { family: "windows", minVersion: "11", supportedArchitectures: ["x86_64"] },
        { family: "macos", minVersion: "14.0", supportedArchitectures: ["arm64"] },
      ],
    };

    const parsed = HardwareRequirementsSchema.safeParse(rawReq);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.minimumRamGb).toBe(8);
      expect(parsed.data.recommendedRamGb).toBe(16);
      expect(parsed.data.storage?.scratchDiskGb).toBe(50);
    }
  });

  it("does not force default numbers when hardware specs are unpublished", () => {
    const emptyReq = {};
    const parsed = HardwareRequirementsSchema.safeParse(emptyReq);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.minimumRamGb).toBeUndefined();
      expect(parsed.data.recommendedRamGb).toBeUndefined();
    }
  });
});
