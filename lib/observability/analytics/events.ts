/**
 * Typed Product Analytics Event Taxonomy & Schema Definitions
 * Compile-time enforcement of safe event names and properties.
 */

export const ANALYTICS_SCHEMA_VERSION = 1;

export interface BaseEventProperties {
  schemaVersion?: number;
  environment?: "development" | "production" | "test";
  release?: string;
  [key: string]: unknown;
}

export interface AnalyticsEventMap {
  homepage_viewed: BaseEventProperties & {
    entrySource?: "direct" | "referral" | "internal";
  };
  journey_started: BaseEventProperties & {
    journey: "check" | "recommend" | "ai" | "software" | "fit";
  };
  hardware_entry_method_selected: BaseEventProperties & {
    method: "detection" | "preset_search" | "pasted_text" | "manual";
  };
  hardware_confirmed: BaseEventProperties & {
    method: "detection" | "preset_search" | "pasted_text" | "manual";
    deviceCategory?: "desktop" | "laptop" | "mini-pc" | "unknown";
    operatingSystemFamily?: "windows" | "macos" | "linux" | "other";
    ramTierGb?: number;
    hasDedicatedGpu?: boolean;
    isAmbiguousInferred?: boolean;
  };
  workload_added: BaseEventProperties & {
    softwareCategory?: string;
    intensity?: "light" | "medium" | "heavy" | "extreme";
    concurrency?: "foreground" | "background";
    totalWorkloadsCount: number;
  };
  workload_removed: BaseEventProperties & {
    softwareCategory?: string;
    totalWorkloadsCount: number;
  };
  concurrent_usage_selected: BaseEventProperties & {
    isSimultaneous: boolean;
    totalWorkloadsCount: number;
  };
  compatibility_check_started: BaseEventProperties & {
    workloadCount: number;
    operatingSystemFamily?: "windows" | "macos" | "linux" | "other";
  };
  compatibility_check_completed: BaseEventProperties & {
    resultStatus: "optimal" | "recommended" | "needs_tuning" | "hardware_limited" | "incompatible";
    scoreBucket?: "90-100" | "75-89" | "50-74" | "<50";
    limitingResource?: "ram" | "cpu" | "gpu_compute" | "vram" | "storage" | "platform" | "none";
    confidenceLevel?: "high" | "medium" | "low";
    durationBucket?: "<100ms" | "100-500ms" | ">500ms";
  };
  compatibility_check_failed: BaseEventProperties & {
    errorCode: string;
    workloadCount?: number;
  };
  result_viewed: BaseEventProperties & {
    resultStatus: "optimal" | "recommended" | "needs_tuning" | "hardware_limited" | "incompatible";
    hasBottleneck: boolean;
  };
  result_explanation_opened: BaseEventProperties & {
    section: "bottleneck" | "concurrency_matrix" | "methodology" | "provenance";
  };
  upgrade_simulation_started: BaseEventProperties & {
    initialStatus: string;
  };
  upgrade_simulation_changed: BaseEventProperties & {
    componentChanged: "ram" | "gpu" | "cpu" | "storage";
  };
  upgrade_simulation_reset: BaseEventProperties;
  upgrade_simulation_applied: BaseEventProperties & {
    deltaScore?: number;
    newStatus?: string;
  };
  recommendation_requested: BaseEventProperties & {
    workloadCount: number;
    formFactor?: "desktop" | "laptop" | "mini-pc" | "any";
    preferredOs?: "windows" | "macos" | "linux" | "any";
    hasBudget: boolean;
  };
  recommendation_viewed: BaseEventProperties & {
    tierCount: number;
  };
  recommendation_selected: BaseEventProperties & {
    recommendationTier: "entry" | "best_fit" | "high_headroom";
    action: "evaluate_in_check" | "view_retail";
  };
  local_ai_check_started: BaseEventProperties & {
    modelFamily?: string;
    paramTier?: "<7B" | "7-14B" | "14-32B" | ">32B";
  };
  local_ai_check_completed: BaseEventProperties & {
    fitStatus: "comfortable" | "tight" | "sharding_required" | "oom";
    quantFormat: string;
    contextTokensBucket: "<8k" | "8-32k" | "32-64k" | ">64k";
  };
  report_shared: BaseEventProperties & {
    shareMethod: "copy_link" | "native_share" | "qr_code" | "export_json";
  };
  affiliate_offer_viewed: BaseEventProperties & {
    retailerId: string;
    offerRegion: string;
    currency: string;
    priceType: "live" | "dated_estimate" | "unavailable";
  };
  affiliate_link_clicked: BaseEventProperties & {
    retailerId: string;
    offerRegion: string;
    currency: string;
  };
  premium_feature_interest_recorded: BaseEventProperties & {
    featureName: "detailed_export" | "saved_comparisons" | "price_alerts" | "team_workspace" | "advanced_local_ai" | "api_access";
  };
  feedback_submitted: BaseEventProperties & {
    ratingBucket?: "positive" | "neutral" | "negative";
  };
  consent_updated: BaseEventProperties & {
    previousState: "unknown" | "essential_only" | "analytics_allowed";
    newState: "unknown" | "essential_only" | "analytics_allowed";
  };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;
