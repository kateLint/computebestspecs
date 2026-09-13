import { z } from "zod";

export const SavedComparisonHardwareSchema = z.object({
  cpu: z.string().min(1),
  gpu: z.string().min(1),
  ramGb: z.number().positive(),
  storageGb: z.number().positive(),
  os: z.string().min(1),
  formFactor: z.enum(["desktop", "laptop", "mini_pc", "unknown"]).default("desktop"),
  rawHardwareProfile: z.any(),
});

export const SavedComparisonItemSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1).max(64),
  hardware: SavedComparisonHardwareSchema,
  workloads: z.array(z.any()).default([]),
  isSimultaneous: z.boolean().default(true),
  engineVersion: z.string().default("1.0.0"),
  catalogVersion: z.string().default("1.0.0"),
  cachedScore: z.number().optional(),
  cachedStatus: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ComparisonSetSchema = z.object({
  schemaVersion: z.literal(1),
  items: z.array(SavedComparisonItemSchema).max(3),
  sharedWorkloads: z.array(z.any()).default([]),
  sharedIsSimultaneous: z.boolean().default(true),
  updatedAt: z.string(),
});

export const CurrentDraftSchema = z.object({
  schemaVersion: z.literal(1),
  hardware: z.any(),
  workloads: z.array(z.any()),
  isSimultaneous: z.boolean(),
  updatedAt: z.string(),
});
