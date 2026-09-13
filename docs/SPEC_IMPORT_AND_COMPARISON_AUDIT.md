# Specification Import & Comparison Architecture Audit
**Repository**: ComputeBestSpecs  
**Inspection Date**: September 13, 2026  
**Audit Purpose**: Pre-implementation audit before developing the canonical versioned `ComputerProfile` domain model, in-browser screenshot/text specification importer, confirmation workflow, 3-slot comparison engine, and evidence transparency layers.

---

## 1. Current Routes and Screens

| Route | Primary Component | Current Purpose | Status & Readiness |
| :--- | :--- | :--- | :--- |
| `/` | `app/page.tsx` | Landing page, 3-path selection (Check PC, Recommend, Local AI), interactive proof demo. | **Active & Complete** |
| `/check` | `app/check/page.tsx` | Main diagnostic & compatibility evaluation workspace with What-If upgrade simulator. | **Active & Complete** |
| `/compare` | `app/compare/page.tsx` | Side-by-side comparison of up to 3 computers under a unified workload suite. | **Active & Complete** |
| `/recommend` | `app/recommend/page.tsx` | Guided purchase recommendation engine based on budget, form factor, and software stack. | **Active & Complete** |
| `/ai` | `app/ai/page.tsx` | Local AI VRAM, attention KV cache, and quantization sizing calculator. | **Active & Complete** |
| `/software` | `app/software/page.tsx` | Public software requirements catalog browser with search and filtering. | **Active & Complete** |
| `/software/[slug]` | `app/software/[slug]/page.tsx` | Detailed requirement profile for individual applications. | **Active & Complete** |
| `/results/[publicId]` | `app/results/[publicId]/page.tsx` | Immutable evaluation snapshot permalink with share QR code and calculation trace. | **Active & Complete** |
| `/privacy` | `app/privacy/page.tsx` | Public Privacy & Data Protection Policy and cookie explanation. | **Active & Complete** |
| `/api/health` | `app/api/health/route.ts` | Shallow liveness & DB readiness monitoring probe. | **Active & Complete** |
| `/api/compatibility/evaluate` | `app/api/compatibility/evaluate/route.ts` | Server-side evaluation execution and snapshot persistence. | **Active & Complete** |
| `/fit` | `app/fit/page.tsx` | Legacy experimental direct fit calculator. | **Legacy / Unused** |
| `/admin/dataset-health` | `app/admin/dataset-health/page.tsx` | Internal dataset consistency checker. | **Internal Admin** |

---

## 2. Current User Flows

1. **Check My Computer Flow (`/check`)**:
   - User enters OS, CPU, GPU, RAM, Storage (via manual selectors or auto-detect presets).
   - User selects 1–8 applications/games and sets the simultaneous usage toggle.
   - User triggers evaluation $\rightarrow$ Pure deterministic engine computes score (0–100), performance tier, and critical bottlenecks.
   - User can open the **What-If Simulator** to test memory/GPU upgrades in real-time or click **"Add to Comparison"**.
2. **Saved Comparison Flow (`/compare`)**:
   - User saves up to 3 configurations into local browser storage (`cbs_comparison_set_v1`).
   - Comparison screen evaluates all 3 configurations under the same workload suite and renders trade-offs.
3. **Purchase Recommendation Flow (`/recommend`)**:
   - User specifies workloads, budget slider, and platform preferences.
   - Engine filters matching prebuilts/parts and allows one-click export into `/check`.
4. **Local AI Sizing Flow (`/ai`)**:
   - User chooses model parameter size, quantization (Q4, Q8, FP16), and context window (4K–128K).
   - Engine calculates exact model weight bytes, KV cache demand, and memory fit verdict.

---

## 3. Existing Compatibility Engine & Schemas

* **Core Engine**: Located in `lib/engine/evaluate.ts`, `services/compatibility/compatibility-engine.ts`, and `lib/domain/compatibility.ts`.
* **Determinism Guarantee**:
  - `evaluateCompatibility()` is a pure TypeScript function with zero external side-effects.
  - Given identical hardware and workload parameters, output scores and bottleneck diagnoses are mathematically immutable.
* **Validation Schemas**:
  - `lib/validation/schemas.ts`: Strict Zod validation schemas (`HardwareProfileSchema`, `SelectedWorkloadSchema`, `CompatibilityEvaluationRequestSchema`).
  - `lib/comparison/schema.ts`: Zod schema for `ComparisonSet` and `CurrentDraft`.

---

## 4. Hardware, Software & Local AI Catalogs

* **Hardware Catalog (`lib/data/hardware-catalog.ts`)**:
  - 80+ curated CPUs (Intel Core 8th–14th Gen, AMD Ryzen 3000–9000, Apple M1–M4 Max).
  - 60+ curated GPUs (NVIDIA RTX 20/30/40 series, AMD RX 6000/7000, Intel Arc, Apple integrated).
  - Normalized benchmark performance scores, architectural capabilities (AVX2, AVX-512, CUDA, Metal, Ray Tracing), and laptop vs. desktop variant flags.
* **Software Catalog (`prisma/schema.prisma` & `lib/data/catalog-helper.ts`)**:
  - Creative suites (Adobe Premiere, After Effects, Photoshop, Blender, DaVinci Resolve).
  - Development tools (VS Code, Android Studio, Docker, Xcode).
  - Modern games (Cyberpunk 2077, Starfield, Flight Simulator).
* **Local AI Models (`lib/domain/ai-workload.ts` & `lib/engine/local-ai.ts`)**:
  - Parameter counts, layer dimensions, head counts, and GQA factors for Llama 3/3.1, Mistral, Mixtral, Gemma, Phi-3, Qwen 2.5, and DeepSeek.

---

## 5. Storage & Cookie Inventory

* **Cookies**:
  - `cbs_consent_v1`: First-party cookie storing consent choice (`unknown` | `essential_only` | `analytics_allowed`). Attributes: `SameSite=Lax`, `Path=/`, `Max-Age=365d`, `Secure` in production.
  - Zero authentication cookies (application is stateless/anonymous).
* **Local Browser Storage (`localStorage`)**:
  - `cbs_comparison_set_v1`: Array of 0 to 3 saved computer specifications.
  - `cbs_current_draft_v1`: Auto-saved draft form from `/check`.
  - `cbs_display_preferences_v1`: Theme selection (`light`, `dark`, `system`).
* **IndexedDB**: Not currently active (clean target for rich profile history in Phase 4).

---

## 6. Observability, Privacy & Redaction

* **Redaction Pipeline (`lib/observability/privacy/redact.ts`)**:
  - `redactSensitiveData()`: Recursively scans objects and redacts passwords, tokens, auth headers, cookies, pasted text, and raw hardware strings.
  - `redactQueryParameters()`: Strips sensitive URL parameters.
* **PostHog Integration (`lib/observability/analytics/`)**:
  - Autocapture disabled (`autocapture: false`).
  - Gated behind explicit user consent (`isAnalyticsAllowed()`).
  - Closed 27-event taxonomy with safe property allowlist.
* **Sentry Integration (`lib/observability/errors/`)**:
  - `sendDefaultPii: false`.
  - `beforeSend` strips raw specs, cookies, and authorization headers.
  - Replay session recording masked by default and disabled until consent.

---

## 7. Security Headers & CSP

Implemented in `middleware.ts`:
* `Content-Security-Policy`: Restricts scripts and connections strictly to `'self'`, `*.posthog.com`, and `*.sentry.io`. Excludes `_next/static` to ensure clean asset streaming.
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: DENY` (anti-clickjacking)
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy: camera=(), microphone=(), geolocation=()`
* `Strict-Transport-Security` enabled in production.

---

## 8. Test Suite & Verification Status

* Test runner: Vitest 2.1.9 (`npm test`).
* Current test suite: **38 test files, 174 passing unit & golden tests**.
* TypeScript type checking: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
* Production build: `npm run build` succeeds (17 static/dynamic pages).

---

## 9. Duplicate or Conflicting Implementations to Consolidate

1. **Spec Parsers**:
   - `services/normalization/natural-language-spec-parser.ts` exists alongside `services/normalization/system-info-parser.ts` and `lib/normalization/hardware-resolver.ts`.
   - **Resolution**: Consolidate into the new canonical `ComputerProfile` extractor pipeline in Phase 1 & 2.
2. **Comparison Domain Models**:
   - `lib/comparison/types.ts` has an initial comparison structure.
   - **Resolution**: Expand to support the versioned `ComputerProfile` with full field-level provenance and confidence tracking.

---

## 10. Audit Conclusion & Non-Negotiable Rule Reaffirmation

The codebase is clean, well-typed, and strictly deterministic. The deterministic compatibility engine (`lib/engine/evaluate.ts`) remains the sole authority for all scoring and bottleneck calculations. The upcoming specification importer will strictly operate as a candidate extractor and normalization pipeline, requiring human confirmation before any uncertain data is applied.
