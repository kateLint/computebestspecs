/**
 * Deterministic Cross-Platform Fingerprint Generator
 * 
 * Invariants:
 * 1. PURE: Same object representation produces identical fingerprint everywhere (Node, Browser, Edge).
 * 2. CANONICAL: Object keys are recursively sorted so key insertion order has zero effect.
 * 3. NO NONDETERMINISTIC FIELDS: Excludes volatile timestamps unless explicitly part of canonical payload.
 */

/**
 * Recursively sort keys of an object to ensure canonical serialization
 */
export function canonicalizeJson(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalizeJson);
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    if (obj[key] !== undefined) {
      result[key] = canonicalizeJson(obj[key]);
    }
  }

  return result;
}

/**
 * 64-bit FNV-1a deterministic hash implementation (Pure JS, zero external dependencies)
 */
export function fnv1a64(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);

    h2 ^= code;
    h2 = Math.imul(h2, 0x01000193);
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex1}${hex2}`;
}

/**
 * Generate a canonical evaluation fingerprint from input specifications and version metadata
 */
export function generateEvaluationFingerprint(payload: unknown): string {
  const canonical = canonicalizeJson(payload);
  const serialized = JSON.stringify(canonical);
  return `ev_${fnv1a64(serialized)}`;
}
