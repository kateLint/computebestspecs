import { describe, it, expect, beforeEach, vi } from "vitest";
import { analytics } from "@/lib/observability/analytics/client";
import { NoopAnalyticsProvider } from "@/lib/observability/analytics/noop-provider";
import { consentManager } from "@/lib/observability/consent/consent";

describe("Observability: Analytics Client & Event Taxonomy", () => {
  beforeEach(() => {
    consentManager.reset();
  });

  it("should initialize with NoopAnalyticsProvider by default when consent is unknown", () => {
    expect(analytics.getProviderName()).toBe("noop");
  });

  it("should safely accept typed events without throwing", () => {
    expect(() => {
      analytics.track("homepage_viewed", { entrySource: "direct" });
      analytics.track("journey_started", { journey: "check" });
      analytics.track("hardware_confirmed", {
        method: "detection",
        deviceCategory: "desktop",
        operatingSystemFamily: "windows",
        ramTierGb: 32,
        hasDedicatedGpu: true,
      });
      analytics.track("compatibility_check_completed", {
        resultStatus: "optimal",
        scoreBucket: "90-100",
        limitingResource: "none",
        confidenceLevel: "high",
      });
    }).not.toThrow();
  });

  it("should support identify and reset safely", () => {
    expect(() => {
      analytics.identify("user_opaque_12345", { plan: "free" });
      analytics.reset();
    }).not.toThrow();
  });
});
