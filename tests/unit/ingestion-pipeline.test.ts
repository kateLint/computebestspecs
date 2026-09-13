import { describe, it, expect } from "vitest";
import {
  parseRawRequirementText,
  detectSourceConflicts,
  evaluateDataFreshness,
  computeIngestionIdempotencyKey,
  RawRequirementRecord,
} from "../../services/ingestion/ingestion-pipeline";
import { HardwareRequirements } from "../../lib/domain/software";

describe("Data Ingestion & Preservation Pipeline (§2, §3, §14, §15, §17)", () => {
  it("preserves raw text snapshot and extracts normalized candidate with idempotency key (§3, §17)", () => {
    const rawRecord: RawRequirementRecord = {
      id: "raw_rec_001",
      sourceDocumentId: "https://helpx.adobe.com/photoshop/system-requirements.html",
      softwareSlug: "photoshop",
      versionName: "2024",
      rawMemoryText: "16 GB of RAM or more recommended, 8 GB minimum",
      rawStorageText: "20 GB of available hard-disk space for installation",
      rawOsText: "Windows 11 64-bit (version 22H2) or later",
      extractedAt: new Date().toISOString(),
    };

    const candidate = parseRawRequirementText(rawRecord, "1.0.0");

    expect(candidate.status).toBe("VALIDATED");
    expect(candidate.normalizedRequirements.minimumRamGb).toBe(16);
    expect(candidate.idempotencyKey).toBeDefined();

    // Re-running parser must yield identical idempotency key (§17)
    const secondPass = parseRawRequirementText(rawRecord, "1.0.0");
    expect(secondPass.idempotencyKey).toBe(candidate.idempotencyKey);
  });

  it("detects source conflicts when external sources diverge (§15)", () => {
    const existing: HardwareRequirements = {
      minimumRamGb: 8,
      storage: { installGb: 10 },
      operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
    };

    const conflictingCandidate = {
      minimumRamGb: 16, // Discrepancy
    };

    const evaluation = detectSourceConflicts(existing, conflictingCandidate);
    expect(evaluation.resolution).toBe("CONFLICT");
    expect(evaluation.conflictReasons.length).toBeGreaterThan(0);
  });

  it("evaluates data freshness and TTL policy (§14, §18)", () => {
    const freshDate = new Date().toISOString();
    const freshEval = evaluateDataFreshness(freshDate);
    expect(freshEval.isFresh).toBe(true);
    expect(freshEval.qualityStatus).toBe("VERIFIED");

    // 500 days ago -> Stale
    const oldDate = new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString();
    const staleEval = evaluateDataFreshness(oldDate);
    expect(staleEval.isFresh).toBe(false);
    expect(staleEval.isStale).toBe(true);
    expect(staleEval.qualityStatus).toBe("STALE");
  });
});
