import { describe, it, expect, beforeEach } from "vitest";
import {
  parseConsentCookie,
  createConsentCookieHeader,
  CONSENT_COOKIE_NAME,
} from "@/lib/observability/consent/storage";
import { consentManager } from "@/lib/observability/consent/consent";

describe("Observability: Consent & Storage Management", () => {
  beforeEach(() => {
    consentManager.reset();
  });

  it("should correctly parse consent cookie string", () => {
    expect(parseConsentCookie(null)).toBe("unknown");
    expect(parseConsentCookie("")).toBe("unknown");
    expect(parseConsentCookie(`other_cookie=123; ${CONSENT_COOKIE_NAME}=analytics_allowed; user=abc`)).toBe("analytics_allowed");
    expect(parseConsentCookie(`${CONSENT_COOKIE_NAME}=essential_only`)).toBe("essential_only");
    expect(parseConsentCookie(`${CONSENT_COOKIE_NAME}=invalid_value`)).toBe("unknown");
  });

  it("should create valid Set-Cookie header with secure attributes", () => {
    const header = createConsentCookieHeader("analytics_allowed", true);
    expect(header).toContain(`${CONSENT_COOKIE_NAME}=analytics_allowed`);
    expect(header).toContain("Path=/");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Secure");
    expect(header).toContain("Max-Age=31536000"); // 365 days
  });

  it("should manage consent transitions and dispatch events to listeners", () => {
    const states: string[] = [];
    const unsubscribe = consentManager.onConsentChange((state) => {
      states.push(state);
    });

    consentManager.setConsentState("essential_only");
    consentManager.setConsentState("analytics_allowed");
    consentManager.setConsentState("essential_only");

    expect(states).toEqual(["essential_only", "analytics_allowed", "essential_only"]);
    expect(consentManager.isAnalyticsAllowed()).toBe(false);

    unsubscribe();
    consentManager.setConsentState("analytics_allowed");
    expect(states.length).toBe(3); // No new events after unsubscribe
  });
});
