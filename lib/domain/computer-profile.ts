/**
 * Canonical Versioned ComputerProfile Domain Model
 * 
 * Incorporates field-level provenance, explicit confidence scores,
 * uncertainty states, and candidate ambiguity lists.
 * Adheres to strict privacy (raw image/text not persisted).
 */

import { CpuArchitecture, OperatingSystemFamily } from "./hardware";

export type ProfileImportSource = "manual" | "pasted_text" | "image_ocr";

export type FieldConfirmationState =
  | "confirmed"
  | "needs_confirmation"
  | "ambiguous"
  | "missing"
  | "not_recognized";

export type FieldExtractionMethod =
  | "user_manual"
  | "rule_regex"
  | "catalog_exact"
  | "catalog_fuzzy"
  | "heuristic";

export type GpuVariant = "desktop" | "laptop" | "integrated" | "unknown";

export interface CandidateCatalogMatch<T = any> {
  id: string;
  displayName: string;
  confidence: number; // 0 to 1
  matchReason: string;
  variant?: GpuVariant;
  canonicalEntity?: T;
}

export interface ProfileFieldProvenance<T> {
  value: T;
  rawText?: string;
  normalizedText?: string;
  confidence: number; // 0.0 to 1.0
  state: FieldConfirmationState;
  method: FieldExtractionMethod;
  catalogId?: string;
  candidates?: CandidateCatalogMatch[];
  warnings?: string[];
}

export interface StorageDeviceProfile {
  id: string;
  capacityGb: number;
  type: "NVME_SSD" | "SATA_SSD" | "HDD" | "UNKNOWN";
  isSystemDrive?: boolean;
}

export interface ComputerProfile {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  source: ProfileImportSource;

  // Optional hardware enclosure metadata
  manufacturer?: string;
  modelName?: string;
  formFactor: "desktop" | "laptop" | "mini_pc" | "unknown";

  // Core Hardware Specifications with Field-Level Provenance
  cpu: ProfileFieldProvenance<{
    model: string;
    catalogId?: string;
    cores?: number;
    threads?: number;
    architecture: CpuArchitecture;
    isLaptopVariant?: boolean;
  }>;

  gpu: ProfileFieldProvenance<{
    model: string;
    catalogId?: string;
    variant: GpuVariant;
    vramGb?: number;
    isIntegrated?: boolean;
  }>;

  ram: ProfileFieldProvenance<{
    capacityGb: number;
    generation?: "DDR4" | "DDR5" | "LPDDR5" | "LPDDR5X" | "UNIFIED" | "UNKNOWN";
    isUnified?: boolean;
  }>;

  storage: ProfileFieldProvenance<{
    totalCapacityGb: number;
    devices: StorageDeviceProfile[];
  }>;

  os: ProfileFieldProvenance<{
    family: OperatingSystemFamily;
    versionString?: string;
    architecture: CpuArchitecture;
  }>;

  // Global Profile Resolution State
  resolution: {
    isFullyConfirmed: boolean;
    hasAmbiguities: boolean;
    unresolvedFieldCount: number;
    overallConfidence: number; // 0.0 to 1.0
    criticalWarnings: string[];
  };
}

/**
 * Creates an empty default ComputerProfile in confirmed or manual state.
 */
export function createDefaultComputerProfile(name = "New Computer Profile"): ComputerProfile {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    createdAt: now,
    updatedAt: now,
    source: "manual",
    formFactor: "desktop",
    cpu: {
      value: {
        model: "Intel Core i7-13700K",
        catalogId: "cpu_intel_i7_13700k",
        cores: 16,
        threads: 24,
        architecture: "x86_64",
        isLaptopVariant: false,
      },
      confidence: 1.0,
      state: "confirmed",
      method: "user_manual",
    },
    gpu: {
      value: {
        model: "NVIDIA GeForce RTX 4070",
        catalogId: "gpu_nvidia_rtx_4070",
        variant: "desktop",
        vramGb: 12,
        isIntegrated: false,
      },
      confidence: 1.0,
      state: "confirmed",
      method: "user_manual",
    },
    ram: {
      value: {
        capacityGb: 32,
        generation: "DDR5",
        isUnified: false,
      },
      confidence: 1.0,
      state: "confirmed",
      method: "user_manual",
    },
    storage: {
      value: {
        totalCapacityGb: 1000,
        devices: [{ id: "dev_1", capacityGb: 1000, type: "NVME_SSD", isSystemDrive: true }],
      },
      confidence: 1.0,
      state: "confirmed",
      method: "user_manual",
    },
    os: {
      value: {
        family: "windows",
        versionString: "11",
        architecture: "x86_64",
      },
      confidence: 1.0,
      state: "confirmed",
      method: "user_manual",
    },
    resolution: {
      isFullyConfirmed: true,
      hasAmbiguities: false,
      unresolvedFieldCount: 0,
      overallConfidence: 1.0,
      criticalWarnings: [],
    },
  };
}

/**
 * Converts a canonical ComputerProfile into the engine's HardwareProfile.
 */
export function computerProfileToHardwareProfile(profile: ComputerProfile): import("./hardware").HardwareProfile {
  const cpu = profile.cpu.value;
  const gpu = profile.gpu.value;
  const ram = profile.ram.value;
  const storage = profile.storage.value;
  const os = profile.os.value;

  const isApple = os.family === "macos" || cpu.model.toLowerCase().includes("apple") || cpu.model.toLowerCase().includes("m1") || cpu.model.toLowerCase().includes("m2") || cpu.model.toLowerCase().includes("m3") || cpu.model.toLowerCase().includes("m4");
  const isLaptop = profile.formFactor === "laptop" || cpu.isLaptopVariant === true || gpu.variant === "laptop";

  return {
    cpu: {
      model: cpu.model,
      manufacturer: isApple ? "Apple" : cpu.model.toLowerCase().includes("amd") || cpu.model.toLowerCase().includes("ryzen") ? "AMD" : "Intel",
      architecture: cpu.architecture || (isApple ? "arm64" : "x86_64"),
      physicalCores: cpu.cores || 8,
      threads: cpu.threads || (cpu.cores ? cpu.cores * 2 : 16),
      performanceScore: 75,
      laptopVariant: isLaptop,
      isVerified: profile.cpu.state === "confirmed",
    },
    gpu: {
      model: gpu.model,
      manufacturer: gpu.model.toLowerCase().includes("geforce") || gpu.model.toLowerCase().includes("rtx") || gpu.model.toLowerCase().includes("gtx") || gpu.model.toLowerCase().includes("nvidia")
        ? "NVIDIA"
        : gpu.model.toLowerCase().includes("radeon") || gpu.model.toLowerCase().includes("amd")
        ? "AMD"
        : isApple
        ? "Apple"
        : "Intel",
      type: isApple || ram.isUnified ? "unified" : gpu.isIntegrated || gpu.variant === "integrated" ? "integrated" : "dedicated",
      performanceScore: gpu.variant === "integrated" ? 30 : 70,
      vramGb: gpu.vramGb || (ram.isUnified ? ram.capacityGb : gpu.variant === "integrated" ? 1.0 : 8.0),
      supportsCuda: gpu.model.toLowerCase().includes("rtx") || gpu.model.toLowerCase().includes("gtx") || gpu.model.toLowerCase().includes("nvidia"),
      supportsDirectX12: !isApple,
      supportsMetal: isApple,
      supportsVulkan: true,
      laptopVariant: gpu.variant === "laptop",
      isVerified: profile.gpu.state === "confirmed",
    },
    ram: {
      totalGb: ram.capacityGb || 16,
      type: ram.isUnified ? "Unified" : (ram.generation as any) || "DDR5",
    },
    storage: storage.devices.length > 0
      ? storage.devices.map((d) => ({
          type: d.type as any,
          totalGb: d.capacityGb,
          freeGb: Math.round(d.capacityGb * 0.4),
          isSystemDrive: d.isSystemDrive ?? true,
        }))
      : [
          {
            type: "NVME_SSD",
            totalGb: storage.totalCapacityGb || 1000,
            freeGb: Math.round((storage.totalCapacityGb || 1000) * 0.4),
            isSystemDrive: true,
          },
        ],
    os: {
      family: os.family,
      version: os.versionString || "11",
      architecture: os.architecture,
    },
    architecture: os.architecture,
    deviceType: isLaptop ? "laptop" : "desktop",
    supportsVirtualization: true,
    isVirtualizationEnabled: true,
  };
}

