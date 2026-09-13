# ComputeBestSpecs — Monetization & Affiliate Foundation

> **Document Type:** Monetization Strategy, Partner Security, & Integrity Rules  
> **Status:** Active Foundation • Version 1.0

---

## 1. Monetization Principles & Trust Invariants

1. **Deterministic Independence**:
   - Hardware sizing calculations, bottleneck detection, and target recommendations are derived strictly from workload requirements and official hardware specifications.
   - Affiliate partnerships, merchant commissions, and sponsorship agreements **never alter ranking scores or recommendation order**.
2. **Prominent Disclosures**:
   - Every commercial or affiliate link is accompanied by a plain-language disclosure: *"ComputeBestSpecs may earn an affiliate commission when you purchase hardware through our links."*
   - All links include standard attributes: `rel="sponsored nofollow noopener"`.
3. **Anti-Open-Redirect Security**:
   - All destination URLs are validated server-side against `ALLOWED_RETAILER_DOMAINS` (`lib/monetization/affiliate-allowlist.ts`). Arbitrary external redirect queries are blocked.
4. **Honest Price Freshness**:
   - Output prices display explicit price types: `live`, `dated_estimate`, or `unavailable` alongside observation timestamps. Static price estimates are never claimed as "live".

---

## 2. Revenue Channels

| Channel | Model | Implementation State | Required External Setup |
| :--- | :--- | :--- | :--- |
| **Retailer Affiliate Offers** | Cost-per-Sale (CPS) via Amazon Associates, KSP, B&H, Best Buy | Foundation layer active; `NoopAffiliateProvider` default | Approved merchant affiliate accounts and API keys |
| **System Builder & Lead Gen** | Qualified hardware configurations sent to certified custom PC builders | Domain model ready | Enterprise B2B agreements |
| **B2B Sizing API & Embedded Widget** | SaaS licensing for software vendors & e-commerce stores | Future phase | API gateway & billing integration (Stripe) |
| **Professional PDF Export** | One-time unlock for deep multi-page procurement reports | Entitlement boundary ready (`detailed_export`) | Payment gateway (Stripe Checkout) |

---

## 3. Entitlement & Premium Feature Boundaries

The internal entitlement system (`lib/monetization/entitlements.ts`) controls future paid capabilities:
- `detailed_export`: Comprehensive printable procurement PDF reports.
- `saved_comparisons`: Cloud sync of multi-machine simulation comparisons.
- `price_alerts`: Historical price tracking on recommended hardware tiers.
- `advanced_local_ai`: Multi-GPU cluster tensor-parallel sharding simulations.
- `api_access`: Programmatic REST API for enterprise hardware compatibility checks.

*All core diagnostic evaluation and recommendation tools remain 100% free and functional.*
