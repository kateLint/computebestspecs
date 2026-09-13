import { describe, it, expect } from "vitest";
import {
  isValidAffiliateDestination,
  sanitizeAffiliateUrl,
  ALLOWED_RETAILER_DOMAINS,
} from "@/lib/monetization/affiliate-allowlist";
import { filterAllowedOffers } from "@/lib/monetization/affiliate-provider";
import { RetailOffer } from "@/lib/monetization/types";

describe("Monetization: Affiliate Allowlist & Anti-Open-Redirect Security", () => {
  it("should permit valid allowed retailer domains", () => {
    expect(isValidAffiliateDestination("https://www.amazon.com/dp/B0CX234XYZ")).toBe(true);
    expect(isValidAffiliateDestination("https://ksp.co.il/web/item/12345")).toBe(true);
    expect(isValidAffiliateDestination("https://www.bhphotovideo.com/c/product/123-REG")).toBe(true);
    expect(isValidAffiliateDestination("https://www.apple.com/shop/buy-mac/macbook-pro")).toBe(true);
    expect(isValidAffiliateDestination("https://www.bestbuy.com/site/laptop/123.p")).toBe(true);
  });

  it("should strictly reject open-redirect attacks and unapproved external hosts", () => {
    expect(isValidAffiliateDestination("http://www.amazon.com/insecure")).toBe(false); // HTTP rejected
    expect(isValidAffiliateDestination("https://evil-phishing-site.com/redirect?to=amazon.com")).toBe(false);
    expect(isValidAffiliateDestination("https://amazon.com.attacker.com/malicious")).toBe(false);
    expect(isValidAffiliateDestination("javascript:alert(1)")).toBe(false);
    expect(isValidAffiliateDestination("data:text/html,malicious")).toBe(false);
    expect(isValidAffiliateDestination("https://127.0.0.1/admin")).toBe(false);
    expect(isValidAffiliateDestination("https://localhost:3000/api")).toBe(false);
  });

  it("should sanitize and filter retail offers", () => {
    const mixedOffers: RetailOffer[] = [
      {
        id: "off_1",
        retailerId: "amazon",
        retailerName: "Amazon",
        productId: "p_1",
        title: "Legit Laptop",
        destinationUrl: "https://www.amazon.com/dp/B0123",
        region: "US",
        currency: "USD",
        price: 1299,
        priceType: "live",
        observedAt: new Date().toISOString(),
        affiliate: true,
        sponsored: false,
      },
      {
        id: "off_2",
        retailerId: "malicious",
        retailerName: "Bad Store",
        productId: "p_2",
        title: "Phishing Link",
        destinationUrl: "https://bad-domain.com/scam",
        region: "US",
        currency: "USD",
        price: 99,
        priceType: "live",
        observedAt: new Date().toISOString(),
        affiliate: true,
        sponsored: false,
      },
    ];

    const filtered = filterAllowedOffers(mixedOffers);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe("off_1");
  });
});
