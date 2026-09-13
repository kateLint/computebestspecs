import { createHash } from "crypto";
import { DataQualityStatus, HardwareRequirements, SoftwareVersion } from "../../lib/domain/software";

export type ImportStatus =
  | "DISCOVERED"
  | "FETCHED"
  | "PARSED"
  | "NORMALIZED"
  | "VALIDATED"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED";

export type RequirementResolution =
  | "CONSISTENT"
  | "CONFLICT"
  | "SUPERSEDED"
  | "UNRESOLVED";

export interface RawSourceDocument {
  id: string;
  sourceUrl: string;
  publisher: string;
  retrievedAt: string;
  rawHtmlOrText: string;
  sha256Hash: string;
  httpStatus?: number;
}

export interface RawRequirementRecord {
  id: string;
  sourceDocumentId: string;
  softwareSlug: string;
  versionName: string;
  rawCpuText?: string;
  rawGpuText?: string;
  rawMemoryText?: string;
  rawStorageText?: string;
  rawOsText?: string;
  rawNotesText?: string;
  extractedAt: string;
}

export interface RequirementCandidate {
  id: string;
  rawRecordId: string;
  softwareSlug: string;
  versionName: string;
  normalizedRequirements: Partial<HardwareRequirements>;
  normalizationConfidence: number;
  normalizationNotes?: string[];
  status: ImportStatus;
  resolution: RequirementResolution;
  idempotencyKey: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface DataFreshnessPolicy {
  maxAgeDays: number;
  staleWarningDays: number;
}

export const DEFAULT_FRESHNESS_POLICY: Record<string, DataFreshnessPolicy> = {
  OFFICIAL_REQUIREMENTS: { maxAgeDays: 365, staleWarningDays: 180 },
  CURRENT_SOFTWARE_VERSION: { maxAgeDays: 90, staleWarningDays: 45 },
  BENCHMARK_DATASET: { maxAgeDays: 180, staleWarningDays: 90 },
};

export function computeIngestionIdempotencyKey(
  sourceUrl: string,
  versionName: string,
  parserVersion: string,
  rawHash: string
): string {
  return createHash("sha256")
    .update(`${sourceUrl}:${versionName}:${parserVersion}:${rawHash}`)
    .digest("hex");
}

export function parseRawRequirementText(
  rawRecord: RawRequirementRecord,
  parserVersion: string = "1.0.0"
): RequirementCandidate {
  const notes: string[] = [];
  let confidence = 0.90;

  let minRam = 8;
  if (rawRecord.rawMemoryText) {
    const ramMatch = rawRecord.rawMemoryText.match(/(\d+)\s*(?:gb|gigabytes)/i);
    if (ramMatch) {
      minRam = parseInt(ramMatch[1], 10);
      notes.push(`Extracted minimum RAM: ${minRam}GB`);
    } else {
      confidence -= 0.20;
      notes.push("Could not parse explicit RAM GB count");
    }
  }

  let minInstallGb = 10;
  if (rawRecord.rawStorageText) {
    const storageMatch = rawRecord.rawStorageText.match(/(\d+)\s*(?:gb|gigabytes)/i);
    if (storageMatch) {
      minInstallGb = parseInt(storageMatch[1], 10);
      notes.push(`Extracted install storage: ${minInstallGb}GB`);
    }
  }

  const normalized: Partial<HardwareRequirements> = {
    minimumRamGb: minRam,
    recommendedRamGb: minRam * 2,
    storage: {
      installGb: minInstallGb,
      scratchSpaceGb: minInstallGb,
    },
    operatingSystems: [
      { family: "windows", supportedArchitectures: ["x86_64"] },
    ],
  };

  const idempotencyKey = computeIngestionIdempotencyKey(
    rawRecord.sourceDocumentId,
    rawRecord.versionName,
    parserVersion,
    rawRecord.rawMemoryText || "empty"
  );

  return {
    id: `cand_${Date.now()}`,
    rawRecordId: rawRecord.id,
    softwareSlug: rawRecord.softwareSlug,
    versionName: rawRecord.versionName,
    normalizedRequirements: normalized,
    normalizationConfidence: Math.max(0.2, Math.round(confidence * 100) / 100),
    normalizationNotes: notes,
    status: confidence >= 0.85 ? "VALIDATED" : "REVIEW_REQUIRED",
    resolution: "CONSISTENT",
    idempotencyKey,
    createdAt: new Date().toISOString(),
  };
}

export function detectSourceConflicts(
  existingRequirements: HardwareRequirements,
  candidateRequirements: Partial<HardwareRequirements>
): { resolution: RequirementResolution; conflictReasons: string[] } {
  const reasons: string[] = [];

  if (candidateRequirements.minimumRamGb && existingRequirements.minimumRamGb) {
    if (candidateRequirements.minimumRamGb !== existingRequirements.minimumRamGb) {
      reasons.push(
        `RAM requirement discrepancy: existing claims ${existingRequirements.minimumRamGb}GB, candidate claims ${candidateRequirements.minimumRamGb}GB`
      );
    }
  }

  if (reasons.length > 0) {
    return {
      resolution: "CONFLICT",
      conflictReasons: reasons,
    };
  }

  return {
    resolution: "CONSISTENT",
    conflictReasons: [],
  };
}

export function evaluateDataFreshness(
  retrievedAt: string,
  policy: DataFreshnessPolicy = DEFAULT_FRESHNESS_POLICY.OFFICIAL_REQUIREMENTS
): { isFresh: boolean; isStale: boolean; ageDays: number; qualityStatus: DataQualityStatus } {
  const retrievedTime = new Date(retrievedAt).getTime();
  const now = Date.now();
  const ageDays = Math.floor((now - retrievedTime) / (1000 * 60 * 60 * 24));

  if (ageDays > policy.maxAgeDays) {
    return {
      isFresh: false,
      isStale: true,
      ageDays,
      qualityStatus: "STALE",
    };
  }

  if (ageDays > policy.staleWarningDays) {
    return {
      isFresh: true,
      isStale: false,
      ageDays,
      qualityStatus: "PARTIAL",
    };
  }

  return {
    isFresh: true,
    isStale: false,
    ageDays,
    qualityStatus: "VERIFIED",
  };
}
