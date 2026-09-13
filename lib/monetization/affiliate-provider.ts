/**
 * Neutral Affiliate Offers Provider Interface & Safe Disabled Implementation
 */

import { RetailOffer } from "./types";
import { isValidAffiliateDestination } from "./affiliate-allowlist";

export interface AffiliateProvider {
  name: string;
  isConfigured: boolean;
  getOffersForHardware(specs: { cpu?: string; gpu?: string; ramGb?: number }): Promise<RetailOffer[]>;
  getOffersForTier(tierName: string): Promise<RetailOffer[]>;
}

export class NoopAffiliateProvider implements AffiliateProvider {
  public readonly name = "noop";
  public readonly isConfigured = false;

  public async getOffersForHardware(): Promise<RetailOffer[]> {
    return []; // No invented offers without real configured credentials
  }

  public async getOffersForTier(): Promise<RetailOffer[]> {
    return [];
  }
}

/**
 * Validates a list of retail offers to ensure all destinations are allowed.
 */
export function filterAllowedOffers(offers: RetailOffer[]): RetailOffer[] {
  return offers.filter((offer) => isValidAffiliateDestination(offer.destinationUrl));
}

export const defaultAffiliateProvider: AffiliateProvider = new NoopAffiliateProvider();
