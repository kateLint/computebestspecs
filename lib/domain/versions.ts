/**
 * Canonical Versioning & Evaluation Snapshot Contracts
 */

export interface EvaluationVersions {
  engineVersion: string;
  policyVersion: string;
  requirementsDatasetVersion: string;
  benchmarkDatasetVersion: string;
  normalizationAlgorithmVersion?: string;
}

export const CURRENT_EVALUATION_VERSIONS: EvaluationVersions = {
  engineVersion: "1.0.0",
  policyVersion: "2026.1",
  requirementsDatasetVersion: "2026.1",
  benchmarkDatasetVersion: "2026.1",
  normalizationAlgorithmVersion: "1.0",
};

export interface EvaluationSnapshotRecord<TInput = unknown, TResult = unknown> {
  id: string;
  publicId: string;
  inputSnapshot: TInput;
  resultSnapshot: TResult;
  versions: EvaluationVersions;
  fingerprint: string;
  createdAt: string;
}
