/**
 * First-party Cookie and Storage Management for Privacy Consent
 */

export const CONSENT_COOKIE_NAME = "cbs_consent_v1";
export const CONSENT_EXPIRATION_DAYS = 365;

export type ConsentState = "unknown" | "essential_only" | "analytics_allowed";

/**
 * Parses consent state from a cookie string.
 */
export function parseConsentCookie(cookieHeader: string | null | undefined): ConsentState {
  if (!cookieHeader) return "unknown";

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`));
  if (!match) return "unknown";

  const val = decodeURIComponent(match[1]);
  if (val === "analytics_allowed" || val === "essential_only") {
    return val;
  }
  return "unknown";
}

/**
 * Creates the Set-Cookie header string for consent.
 */
export function createConsentCookieHeader(state: ConsentState, isSecure: boolean = process.env.NODE_ENV === "production"): string {
  const maxAge = state === "unknown" ? 0 : CONSENT_EXPIRATION_DAYS * 24 * 60 * 60;
  const secureFlag = isSecure ? "; Secure" : "";
  return `${CONSENT_COOKIE_NAME}=${encodeURIComponent(state)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
}

/**
 * Reads consent from document.cookie on client.
 */
export function getClientConsentCookie(): ConsentState {
  if (typeof document === "undefined") return "unknown";
  return parseConsentCookie(document.cookie);
}

/**
 * Sets consent cookie on client and triggers storage cleanup if necessary.
 */
export function setClientConsentCookie(state: ConsentState): void {
  if (typeof document === "undefined") return;
  const isSecure = window.location.protocol === "https:";
  document.cookie = createConsentCookieHeader(state, isSecure);

  if (state !== "analytics_allowed") {
    cleanupAnalyticsStorage();
  }
}

/**
 * Clears all vendor analytics cookies and localStorage persistence created by PostHog / tracking tools.
 * Preserves essential authentication and theme preferences.
 */
export function cleanupAnalyticsStorage(): void {
  if (typeof window === "undefined") return;

  // Clear PostHog / analytics cookies
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    if (name.startsWith("ph_") || name.startsWith("_ph_") || name.includes("posthog")) {
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  }

  // Clear PostHog / analytics localStorage items
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("ph_") || key.includes("posthog") || key.startsWith("_ph_"))) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {}

  // Clear PostHog sessionStorage items
  try {
    const sessionKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith("ph_") || key.includes("posthog"))) {
        sessionKeys.push(key);
      }
    }
    for (const key of sessionKeys) {
      sessionStorage.removeItem(key);
    }
  } catch {}
}
