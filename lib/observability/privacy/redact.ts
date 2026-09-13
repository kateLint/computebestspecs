/**
 * Redaction and Privacy Sanitization Utilities
 * Ensures no PII, raw specs, tokens, cookies, or sensitive parameters reach analytics, logs, or error monitoring.
 */

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /bearer/i,
  /cookie/i,
  /session/i,
  /credit|card|cvv|cvc/i,
  /email/i,
  /phone/i,
  /ssn/i,
  /prompt/i,
  /raw.*spec/i,
  /pasted/i,
];

const SENSITIVE_QUERY_PARAMS = [
  "token",
  "auth",
  "secret",
  "key",
  "api_key",
  "code",
  "session",
  "id_token",
  "access_token",
  "email",
  "password",
];

/**
 * Sanitizes an object recursively to remove or redact sensitive keys.
 */
export function redactSensitiveData<T = any>(data: T, maxDepth = 4, currentDepth = 0): T {
  if (currentDepth > maxDepth || data === null || typeof data !== "object") {
    if (typeof data === "string") {
      return redactSensitiveString(data) as unknown as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, maxDepth, currentDepth + 1)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redactSensitiveData(value, maxDepth, currentDepth + 1);
    }
  }

  return result as T;
}

/**
 * Redacts email addresses, potential tokens, and secrets within string content.
 */
export function redactSensitiveString(str: string): string {
  if (!str) return str;

  // Mask emails (e.g. user@example.com -> u***@example.com)
  let sanitized = str.replace(
    /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g,
    (_, user, domain, ext) => `${user[0]}***@${domain}.${ext}`
  );

  // Mask bearer tokens
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, "Bearer [REDACTED]");

  return sanitized;
}

/**
 * Strips sensitive query parameters from a URL string while preserving path.
 */
export function redactQueryParameters(urlString: string): string {
  if (!urlString) return urlString;
  try {
    const url = new URL(urlString, "http://localhost");
    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, "[REDACTED]");
      }
    }
    return url.pathname + (url.search ? url.search : "");
  } catch {
    // If not a full URL or URL parsing fails, strip query string if it looks sensitive
    const queryIdx = urlString.indexOf("?");
    if (queryIdx === -1) return urlString;
    return urlString.substring(0, queryIdx) + "?[REDACTED_PARAMS]";
  }
}

/**
 * Sanitizes headers object for logging or error reporting.
 */
export function sanitizeHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, val] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "authorization" ||
      lowerKey === "cookie" ||
      lowerKey === "set-cookie" ||
      lowerKey.includes("key") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token")
    ) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = Array.isArray(val) ? val.join(", ") : String(val ?? "");
    }
  }
  return sanitized;
}
