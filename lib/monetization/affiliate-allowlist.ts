/**
 * Affiliate Destination Allowlist and Anti-Open-Redirect Security Validation
 */

export const ALLOWED_RETAILER_DOMAINS = [
  "amazon.com",
  "www.amazon.com",
  "amazon.co.uk",
  "www.amazon.co.uk",
  "amazon.de",
  "www.amazon.de",
  "ksp.co.il",
  "www.ksp.co.il",
  "bhphotovideo.com",
  "www.bhphotovideo.com",
  "bestbuy.com",
  "www.bestbuy.com",
  "newegg.com",
  "www.newegg.com",
  "apple.com",
  "www.apple.com",
] as const;

/**
 * Validates if a destination URL is a permitted, secure retailer host.
 * Strictly prevents open-redirect vulnerabilities.
 */
export function isValidAffiliateDestination(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;

  try {
    const parsed = new URL(rawUrl);

    // 1. Must be HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }

    // 2. Reject internal/local IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    // 3. Match against allowed domain list
    return ALLOWED_RETAILER_DOMAINS.some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitizes and validates an external affiliate destination.
 */
export function sanitizeAffiliateUrl(rawUrl: string): string | null {
  if (isValidAffiliateDestination(rawUrl)) {
    return rawUrl;
  }
  return null;
}
