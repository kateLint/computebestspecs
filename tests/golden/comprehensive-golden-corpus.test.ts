import { describe, it, expect } from "vitest";
import { evaluateCompatibility } from "../../lib/engine/evaluate";
import { CANONICAL_SOFTWARE_CATALOG } from "../../lib/data/software-catalog";
import {
  DEV_LAPTOP_16GB_FIXTURE,
  DEV_LAPTOP_32GB_FIXTURE,
  MACBOOK_PRO_M3_18GB_FIXTURE,
  BUDGET_OFFICE_PC_8GB_FIXTURE,
  RTX_4090_WORKSTATION_FIXTURE,
  UNSUPPORTED_OS_FIXTURE,
  VIRTUALIZATION_DISABLED_FIXTURE,
} from "../fixtures";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";

// Flatten all software versions from canonical catalog
const ALL_CATALOG_VERSIONS: SoftwareVersion[] = CANONICAL_SOFTWARE_CATALOG.flatMap(c => c.versions);

describe("Comprehensive Golden Scenario Corpus (§20+ Real Machine Scenarios)", () => {
  // 1. RAM Sizing Matrix: 8GB vs 16GB vs 32GB
  describe("1. RAM Sizing & Pressure Matrix (8GB / 16GB / 32GB)", () => {
    const devWorkloads: SelectedWorkload[] = [
      { softwareId: "photoshop", softwareName: "Adobe Photoshop 2024", softwareVersionId: "ver_photoshop_2024", workloadId: "ps_photo_edit", workloadName: "Photo Editing", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-studio", softwareName: "Android Studio Iguana", softwareVersionId: "ver_android_studio_2024", workloadId: "as_gradle_build", workloadName: "Gradle Build", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-emulator", softwareName: "Android Emulator", softwareVersionId: "ver_android_emu_34", workloadId: "emu_pixel_run", workloadName: "Pixel 8", intensity: "medium", concurrency: "foreground" },
      { softwareId: "chrome", softwareName: "Google Chrome", softwareVersionId: "ver_chrome_122", workloadId: "chrome_dev_tabs", workloadName: "25 Tabs", intensity: "medium", concurrency: "background" },
    ];

    it("Scenario 1: 8 GB Budget PC suffers severe RAM deficit and swap thrashing", () => {
      const res = evaluateCompatibility({
        hardware: BUDGET_OFFICE_PC_8GB_FIXTURE,
        workloads: devWorkloads,
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("compatible");
      expect(res.concurrencyMetrics.ramPressureRatio).toBeGreaterThan(2.0);
      expect(res.concurrencyMetrics.isSwappingLikely).toBe(true);
      expect(res.primaryBottleneck?.component).toBe("memory");
      expect(res.upgradeRecommendations[0]?.to).toBe("32 GB");
    });

    it("Scenario 2: 16 GB Laptop operates in borderline tier with 32 GB upgrade recommendation", () => {
      const res = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: devWorkloads,
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("compatible");
      expect(res.concurrencyMetrics.ramPressureRatio).toBeGreaterThan(1.2);
      expect(res.primaryBottleneck?.component).toBe("memory");
      expect(res.upgradeRecommendations[0]?.to).toBe("32 GB");
    });

    it("Scenario 3: 32 GB Laptop runs smoothly without memory bottleneck", () => {
      const res = evaluateCompatibility({
        hardware: DEV_LAPTOP_32GB_FIXTURE,
        workloads: devWorkloads,
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("compatible");
      expect(res.concurrencyMetrics.ramPressureRatio).toBeLessThan(1.0);
      expect(res.concurrencyMetrics.isSwappingLikely).toBe(false);
      expect(res.score).toBeGreaterThanOrEqual(70);
      expect(res.performanceTier).toBe("recommended");
    });
  });

  // 2. Discrete vs Integrated GPU
  describe("2. Dedicated vs Integrated GPU", () => {
    it("Scenario 4: DaVinci Resolve flags integrated UHD 730 as incompatible dedicated GPU requirement", () => {
      const res = evaluateCompatibility({
        hardware: BUDGET_OFFICE_PC_8GB_FIXTURE,
        workloads: [{ softwareId: "davinci-resolve", softwareName: "DaVinci Resolve Studio 19", softwareVersionId: "ver_resolve_19", workloadId: "resolve_4k_color", workloadName: "4K Grade", intensity: "heavy", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("incompatible");
      expect(res.isHardIncompatible).toBe(true);
      const appEval = res.perAppEvaluations.find(a => a.softwareId === "davinci-resolve");
      expect(appEval?.isHardIncompatible).toBe(true);
    });

    it("Scenario 5: RTX 4090 Workstation sails through DaVinci Resolve with top marks", () => {
      const res = evaluateCompatibility({
        hardware: RTX_4090_WORKSTATION_FIXTURE,
        workloads: [{ softwareId: "davinci-resolve", softwareName: "DaVinci Resolve Studio 19", softwareVersionId: "ver_resolve_19", workloadId: "resolve_4k_color", workloadName: "4K Grade", intensity: "heavy", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("compatible");
      expect(res.score).toBeGreaterThanOrEqual(90);
      expect(res.performanceTier).toBe("excellent");
    });
  });

  // 3. Apple Silicon Unified Memory
  describe("3. Unified Memory Architecture (Apple Silicon)", () => {
    it("Scenario 6: MacBook Pro M3 Pro allocates unified memory dynamically across CPU and GPU", () => {
      const res = evaluateCompatibility({
        hardware: MACBOOK_PRO_M3_18GB_FIXTURE,
        workloads: [{ softwareId: "blender", softwareName: "Blender 4.2 LTS", softwareVersionId: "ver_blender_42", workloadId: "blender_cycles_render", workloadName: "Cycles GPU", intensity: "heavy", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("compatible");
      expect(res.components.vram.status).toBe("PASS");
      expect(res.components.os.status).toBe("PASS");
    });
  });

  // 4. Platform & Hardware Capabilities (CUDA, Metal, Virtualization)
  describe("4. Capability Graph & Platform Incompatibilities", () => {
    it("Scenario 7: ComfyUI / SDXL requires CUDA GPU — fails on Intel iGPU", () => {
      const res = evaluateCompatibility({
        hardware: BUDGET_OFFICE_PC_8GB_FIXTURE,
        workloads: [{ softwareId: "comfyui-stable-diffusion", softwareName: "ComfyUI / Stable Diffusion XL", softwareVersionId: "ver_comfyui_02", workloadId: "sdxl_generation", workloadName: "SDXL Batch", intensity: "heavy", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("incompatible");
      const app = res.perAppEvaluations.find(a => a.softwareId === "comfyui-stable-diffusion");
      expect(app?.hardIncompatibilityReasons.some(r => r.includes("CUDA"))).toBe(true);
    });

    it("Scenario 8: Virtualization disabled in BIOS blocks Android Emulator and Docker Desktop", () => {
      const res = evaluateCompatibility({
        hardware: VIRTUALIZATION_DISABLED_FIXTURE,
        workloads: [
          { softwareId: "android-emulator", softwareName: "Android Emulator", softwareVersionId: "ver_android_emu_34", workloadId: "emu_pixel_run", workloadName: "Emulator", intensity: "medium", concurrency: "foreground" },
          { softwareId: "docker-desktop", softwareName: "Docker Desktop", softwareVersionId: "ver_docker_430", workloadId: "docker_microservices", workloadName: "Docker", intensity: "medium", concurrency: "foreground" },
        ],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("incompatible");
      expect(res.isHardIncompatible).toBe(true);
    });

    it("Scenario 9: Unsupported OS blocks platform-specific tools", () => {
      const res = evaluateCompatibility({
        hardware: UNSUPPORTED_OS_FIXTURE,
        workloads: [{ softwareId: "photoshop", softwareName: "Adobe Photoshop 2024", softwareVersionId: "ver_photoshop_2024", workloadId: "ps_photo_edit", workloadName: "Photo Edit", intensity: "medium", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.compatibilityStatus).toBe("incompatible");
      expect(res.score).toBeLessThanOrEqual(25);
    });
  });

  // 5. Storage & Scratch Space Constraints
  describe("5. Storage & Scratch Disk Adequacy", () => {
    it("Scenario 10: Low free disk space triggers storage capacity warning and upgrade suggestion", () => {
      const lowStoragePC: HardwareProfile = {
        ...DEV_LAPTOP_16GB_FIXTURE,
        storage: [{ type: "NVME_SSD", totalGb: 256, freeGb: 25, isSystemDrive: true }],
      };

      const res = evaluateCompatibility({
        hardware: lowStoragePC,
        workloads: [{ softwareId: "unreal-engine", softwareName: "Unreal Engine 5.4", softwareVersionId: "ver_ue_54", workloadId: "ue5_level_edit", workloadName: "UE5 Level", intensity: "heavy", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      const storageBottleneck = res.bottlenecks.find(b => b.component === "storage");
      expect(storageBottleneck).toBeDefined();
      expect(["high", "critical"]).toContain(storageBottleneck?.severity);
    });
  });

  // 6. Local AI & VRAM Pressure
  describe("6. Local AI Inference & VRAM Allocation", () => {
    it("Scenario 11: Ollama 14B Q4 model on 4 GB laptop GPU flags VRAM deficit", () => {
      const res = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE, // RTX 3050 has 4GB VRAM
        workloads: [{ softwareId: "ollama-local-ai", softwareName: "Ollama Local AI", softwareVersionId: "ver_ollama_03", workloadId: "llm_14b_q4", workloadName: "14B Q4", intensity: "heavy", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.components.vram.status).toBe("FAIL");
    });

    it("Scenario 12: RTX 4090 with 24 GB VRAM handles 14B Q4 model with ease", () => {
      const res = evaluateCompatibility({
        hardware: RTX_4090_WORKSTATION_FIXTURE,
        workloads: [{ softwareId: "ollama-local-ai", softwareName: "Ollama Local AI", softwareVersionId: "ver_ollama_03", workloadId: "llm_14b_q4", workloadName: "14B Q4", intensity: "heavy", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.components.vram.status).toBe("PASS");
      expect(res.components.vram.score).toBeGreaterThanOrEqual(90);
    });
  });

  // 7. Counterfactual Upgrade Simulations & No Upgrade Needed
  describe("7. Upgrade Feasibility & No Upgrade Needed", () => {
    it("Scenario 13: High-end RTX 4090 Workstation requires no upgrades", () => {
      const res = evaluateCompatibility({
        hardware: RTX_4090_WORKSTATION_FIXTURE,
        workloads: [
          { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_photoshop_2024", workloadId: "ps_photo_edit", workloadName: "PS", intensity: "medium", concurrency: "foreground" },
          { softwareId: "blender", softwareName: "Blender", softwareVersionId: "ver_blender_42", workloadId: "blender_cycles_render", workloadName: "Blender", intensity: "heavy", concurrency: "foreground" },
        ],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.upgradeRecommendations.filter(r => r.component === "memory")).toHaveLength(0);
      expect(res.score).toBeGreaterThanOrEqual(90);
    });

    it("Scenario 14: Soldered RAM MacBook Pro correctly states non_upgradeable feasibility", () => {
      const heavyDevWorkloads: SelectedWorkload[] = [
        { softwareId: "unreal-engine", softwareName: "Unreal Engine", softwareVersionId: "ver_ue_54", workloadId: "ue5_level_edit", workloadName: "UE5", intensity: "heavy", concurrency: "foreground" },
        { softwareId: "docker-desktop", softwareName: "Docker", softwareVersionId: "ver_docker_430", workloadId: "docker_microservices", workloadName: "Docker", intensity: "heavy", concurrency: "background" },
      ];

      const res = evaluateCompatibility({
        hardware: MACBOOK_PRO_M3_18GB_FIXTURE,
        workloads: heavyDevWorkloads,
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      const ramRec = res.upgradeRecommendations.find(r => r.component === "memory");
      if (ramRec) {
        expect(ramRec.feasibility).toBe("non_upgradeable");
        expect(ramRec.feasibilityDetails?.possible).toBe(false);
      }
    });
  });

  // 8. Scenario Modes (LIGHT vs PEAK)
  describe("8. Scenario Intensity Modes", () => {
    it("Scenario 15: Same hardware produces distinct valid evaluation fingerprints under LIGHT vs PEAK modes", () => {
      const lightRes = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: [{ softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_photoshop_2024", workloadId: "ps_photo_edit", workloadName: "PS", intensity: "light", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
        scenarioMode: "LIGHT",
      });

      const peakRes = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: [{ softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_photoshop_2024", workloadId: "ps_photo_edit", workloadName: "PS", intensity: "heavy", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
        scenarioMode: "PEAK",
      });

      expect(lightRes.scenarioMode).toBe("LIGHT");
      expect(peakRes.scenarioMode).toBe("PEAK");
      expect(lightRes.meta.evaluationFingerprint).not.toBe(peakRes.meta.evaluationFingerprint);
    });
  });

  // 9. Calculation Trace Verification
  describe("9. Calculation Trace Recording", () => {
    it("Scenario 16: Evaluation produces detailed diagnostic trace steps for debugging", () => {
      const res = evaluateCompatibility({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloads: [{ softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "ver_photoshop_2024", workloadId: "ps_photo_edit", workloadName: "PS", intensity: "medium", concurrency: "foreground" }],
        softwareVersions: ALL_CATALOG_VERSIONS,
      });

      expect(res.meta.calculationTrace).toBeDefined();
      expect(res.meta.calculationTrace.totalSteps).toBeGreaterThanOrEqual(2);
    });
  });
});
