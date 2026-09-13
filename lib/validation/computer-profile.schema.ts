import { z } from "zod";
import { ComputerProfile } from "../domain/computer-profile";

export const FieldConfirmationStateSchema = z.enum([
  "confirmed",
  "needs_confirmation",
  "ambiguous",
  "missing",
  "not_recognized",
]);

export const FieldExtractionMethodSchema = z.enum([
  "user_manual",
  "rule_regex",
  "catalog_exact",
  "catalog_fuzzy",
  "heuristic",
]);

export const GpuVariantSchema = z.enum(["desktop", "laptop", "integrated", "unknown"]);

export const CandidateCatalogMatchSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  confidence: z.number().min(0).max(1),
  matchReason: z.string(),
  variant: GpuVariantSchema.optional(),
  canonicalEntity: z.any().optional(),
});

export const StorageDeviceProfileSchema = z.object({
  id: z.string(),
  capacityGb: z.number().positive(),
  type: z.enum(["NVME_SSD", "SATA_SSD", "HDD", "UNKNOWN"]),
  isSystemDrive: z.boolean().optional(),
});

export const ComputerProfileSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  createdAt: z.string(),
  updatedAt: z.string(),
  source: z.enum(["manual", "pasted_text", "image_ocr"]),
  manufacturer: z.string().optional(),
  modelName: z.string().optional(),
  formFactor: z.enum(["desktop", "laptop", "mini_pc", "unknown"]).default("desktop"),

  cpu: z.object({
    value: z.object({
      model: z.string().min(1),
      catalogId: z.string().optional(),
      cores: z.number().optional(),
      threads: z.number().optional(),
      architecture: z.enum(["x86_64", "arm64", "other"]).default("x86_64"),
      isLaptopVariant: z.boolean().optional(),
    }),
    rawText: z.string().optional(),
    normalizedText: z.string().optional(),
    confidence: z.number().min(0).max(1),
    state: FieldConfirmationStateSchema,
    method: FieldExtractionMethodSchema,
    catalogId: z.string().optional(),
    candidates: z.array(CandidateCatalogMatchSchema).optional(),
    warnings: z.array(z.string()).optional(),
  }),

  gpu: z.object({
    value: z.object({
      model: z.string().min(1),
      catalogId: z.string().optional(),
      variant: GpuVariantSchema.default("desktop"),
      vramGb: z.number().optional(),
      isIntegrated: z.boolean().optional(),
    }),
    rawText: z.string().optional(),
    normalizedText: z.string().optional(),
    confidence: z.number().min(0).max(1),
    state: FieldConfirmationStateSchema,
    method: FieldExtractionMethodSchema,
    catalogId: z.string().optional(),
    candidates: z.array(CandidateCatalogMatchSchema).optional(),
    warnings: z.array(z.string()).optional(),
  }),

  ram: z.object({
    value: z.object({
      capacityGb: z.number().positive(),
      generation: z.enum(["DDR4", "DDR5", "LPDDR5", "LPDDR5X", "UNIFIED", "UNKNOWN"]).optional(),
      isUnified: z.boolean().optional(),
    }),
    rawText: z.string().optional(),
    normalizedText: z.string().optional(),
    confidence: z.number().min(0).max(1),
    state: FieldConfirmationStateSchema,
    method: FieldExtractionMethodSchema,
    warnings: z.array(z.string()).optional(),
  }),

  storage: z.object({
    value: z.object({
      totalCapacityGb: z.number().positive(),
      devices: z.array(StorageDeviceProfileSchema).default([]),
    }),
    rawText: z.string().optional(),
    normalizedText: z.string().optional(),
    confidence: z.number().min(0).max(1),
    state: FieldConfirmationStateSchema,
    method: FieldExtractionMethodSchema,
    warnings: z.array(z.string()).optional(),
  }),

  os: z.object({
    value: z.object({
      family: z.enum(["windows", "macos", "linux"]),
      versionString: z.string().optional(),
      architecture: z.enum(["x86_64", "arm64", "other"]).default("x86_64"),
    }),
    rawText: z.string().optional(),
    normalizedText: z.string().optional(),
    confidence: z.number().min(0).max(1),
    state: FieldConfirmationStateSchema,
    method: FieldExtractionMethodSchema,
    warnings: z.array(z.string()).optional(),
  }),

  resolution: z.object({
    isFullyConfirmed: z.boolean(),
    hasAmbiguities: z.boolean(),
    unresolvedFieldCount: z.number().min(0),
    overallConfidence: z.number().min(0).max(1),
    criticalWarnings: z.array(z.string()).default([]),
  }),
});

/**
 * Validates and safely migrates a raw untrusted profile JSON object to ComputerProfile.
 */
export function migrateAndValidateComputerProfile(raw: unknown): {
  success: boolean;
  profile?: ComputerProfile;
  errors?: string[];
} {
  if (!raw || typeof raw !== "object") {
    return { success: false, errors: ["Invalid profile payload: Expected a JSON object."] };
  }

  const obj = raw as Record<string, any>;
  const schemaVersion = obj.schemaVersion ?? 1;

  if (schemaVersion === 1) {
    const result = ComputerProfileSchema.safeParse(obj);
    if (result.success) {
      return { success: true, profile: result.data as ComputerProfile };
    }
    return {
      success: false,
      errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }

  return {
    success: false,
    errors: [`Unsupported schema version ${schemaVersion}.`],
  };
}
