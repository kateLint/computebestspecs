import { z } from "zod";

export const EvaluationVersionsSchema = z.object({
  engineVersion: z.string().min(1),
  policyVersion: z.string().min(1),
  requirementsDatasetVersion: z.string().min(1),
  benchmarkDatasetVersion: z.string().min(1),
  normalizationAlgorithmVersion: z.string().optional(),
});

export const EvaluationSnapshotRecordSchema = z.object({
  id: z.string(),
  publicId: z.string(),
  inputSnapshot: z.unknown(),
  resultSnapshot: z.unknown(),
  versions: EvaluationVersionsSchema,
  fingerprint: z.string().length(64), // SHA-256 hex string
  createdAt: z.string(),
});
