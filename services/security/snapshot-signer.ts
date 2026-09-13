import { createHmac } from "crypto";

export interface SnapshotIntegrity {
  algorithm: "HMAC-SHA256";
  keyVersion: string;
  signature: string;
  signedAt: string;
}

/**
 * Deterministic Canonical Serialization
 * Recursively sorts all object keys to ensure identical representation across runtimes.
 */
export function canonicalSerialize(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map(item => canonicalSerialize(item)).join(",") + "]";
  }

  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    return `${JSON.stringify(key)}:${canonicalSerialize(obj[key])}`;
  });

  return "{" + pairs.join(",") + "}";
}

export function signEvaluationSnapshot(
  snapshotPayload: any,
  secretKey: string = process.env.RESULT_SIGNING_SECRET || "cbs_signing_secret_dev_2026",
  keyVersion: string = "v1"
): SnapshotIntegrity {
  const canonicalString = canonicalSerialize(snapshotPayload);
  const signature = createHmac("sha256", secretKey)
    .update(canonicalString)
    .digest("hex");

  return {
    algorithm: "HMAC-SHA256",
    keyVersion,
    signature,
    signedAt: new Date().toISOString(),
  };
}

export function verifySnapshotSignature(
  snapshotPayload: any,
  integrity: SnapshotIntegrity,
  secretKey: string = process.env.RESULT_SIGNING_SECRET || "cbs_signing_secret_dev_2026"
): { isValid: boolean; reason?: string } {
  if (integrity.algorithm !== "HMAC-SHA256") {
    return { isValid: false, reason: "Unsupported signature algorithm" };
  }

  const canonicalString = canonicalSerialize(snapshotPayload);
  const expectedSignature = createHmac("sha256", secretKey)
    .update(canonicalString)
    .digest("hex");

  if (expectedSignature !== integrity.signature) {
    return { isValid: false, reason: "Snapshot payload has been tampered with or signature key mismatch" };
  }

  return { isValid: true };
}
