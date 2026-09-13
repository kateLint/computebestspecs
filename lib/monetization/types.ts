/**
 * Monetization & Affiliate Offers Domain Types
 */

export type PriceStatus = "live" | "dated_estimate" | "unavailable";

export interface RetailOffer {
  id: string;
  retailerId: string;
  retailerName: string;
  productId: string;
  title: string;
  destinationUrl: string;
  region: string; // e.g. "US", "IL", "EU", "GLOBAL"
  currency: string; // e.g. "USD", "ILS", "EUR"
  price: number | null;
  priceType: PriceStatus;
  observedAt: string | null; // ISO Date String
  affiliate: boolean;
  sponsored: boolean;
}

export type PremiumFeatureKey =
  | "detailed_export"
  | "saved_comparisons"
  | "price_alerts"
  | "team_workspace"
  | "advanced_local_ai"
  | "api_access";

export interface EntitlementsState {
  isPremium: boolean;
  features: Record<PremiumFeatureKey, boolean>;
}
