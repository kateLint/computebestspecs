/**
 * Feature Entitlements & Future Premium Capability Boundary
 */

import { PremiumFeatureKey, EntitlementsState } from "./types";
import { analytics } from "../observability/analytics/client";

const DEFAULT_ENTITLEMENTS: EntitlementsState = {
  isPremium: false,
  features: {
    detailed_export: false,
    saved_comparisons: false,
    price_alerts: false,
    team_workspace: false,
    advanced_local_ai: false,
    api_access: false,
  },
};

/**
 * Checks whether current user/environment has access to a premium feature.
 * All free tier features remain 100% accessible.
 */
export function hasEntitlement(feature: PremiumFeatureKey): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_ALL_PREMIUM === "true") {
    return true;
  }
  return DEFAULT_ENTITLEMENTS.features[feature] ?? false;
}

export function getEntitlementsState(): EntitlementsState & { tier: "free" | "pro" | "enterprise" } {
  const isPrem = process.env.NEXT_PUBLIC_ENABLE_ALL_PREMIUM === "true";
  return {
    tier: isPrem ? "pro" : "free",
    isPremium: isPrem,
    features: {
      detailed_export: isPrem,
      saved_comparisons: isPrem,
      price_alerts: isPrem,
      team_workspace: isPrem,
      advanced_local_ai: isPrem,
      api_access: isPrem,
    },
  };
}

/**
 * Records user interest in an upcoming premium feature without displaying fake checkouts.
 * Strictly respect consent (analytics tracks only if analytics consent granted).
 */
export function recordPremiumFeatureInterest(featureName: PremiumFeatureKey): void {
  analytics.track("premium_feature_interest_recorded", {
    featureName,
  });
}
