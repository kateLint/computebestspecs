# ComputeBestSpecs — Privacy & Data Inventory

> **Document Type:** Technical & Compliance Architecture Specification  
> **Status:** Active Foundation • Version 1.0  
> **Applicability:** Client-side App Router, Route Handlers, Background Services, Subprocessors.

---

## 1. Data Minimization Architecture

ComputeBestSpecs is engineered with strict data minimization principles:
- **No Mandatory User Accounts**: Diagnostic evaluations, recommendation calculations, and local AI sizing execute without requiring authentication, email, or identity fields.
- **Client/Server Evaluation Parity**: Sizing engines run pure mathematical functions bounded by standardized hardware specifications (`lib/domain/hardware.ts`).
- **No Raw Input Persistence**: Unstructured pasted hardware text or model notes are parsed in transient memory and never written to long-term databases or analytics event payloads.

---

## 2. Storage & Cookie Inventory

| Cookie / Storage Key | Type | Purpose | Expiration | Consent Required? | Domain / Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cbs_consent_v1` | 1st-Party Cookie | Stores consent decision (`essential_only` vs `analytics_allowed`) | 365 days | No (Strictly Essential) | Host only, `SameSite=Lax`, `Path=/` |
| `cbs_display_preferences_v1` | LocalStorage | Remembers dark/light theme selection | Persistent | No (Strictly Essential) | Local origin only |
| `ph_<apiKey>_posthog` | 1st-Party Cookie | PostHog session identifier | 365 days | **Yes** (Created only after `analytics_allowed`) | Host only, `SameSite=Lax` |

---

## 3. Subprocessors & Third-Party Services

| Vendor | Role | Region / Location | Data Transferred | Privacy Guardrail |
| :--- | :--- | :--- | :--- | :--- |
| **PostHog** | Product Analytics | US / EU Cloud or Self-Hosted | Opaque anonymous session ID, route paths, high-level interaction events | `autocapture: false`, form inputs masked, raw spec text redacted |
| **Sentry** | Error Monitoring | US / EU Cloud | Stack traces, runtime exception messages, sanitized URLs | Cookies stripped, request bodies omitted, PII headers removed |

---

## 4. Product Analytics Event Catalog

All events are strictly typed in `lib/observability/analytics/events.ts` and require `schemaVersion: 1`:

| Event Name | Trigger | Permitted Safe Properties | Prohibited Properties |
| :--- | :--- | :--- | :--- |
| `homepage_viewed` | Page view on `/` | `entrySource` | Referrer query parameters with PII |
| `journey_started` | User initiates a primary tool | `journey: 'check' \| 'recommend' \| 'ai'` | Custom URLs |
| `hardware_confirmed` | Hardware spec confirmed | `method`, `deviceCategory`, `operatingSystemFamily`, `ramTierGb`, `hasDedicatedGpu` | Raw CPU/GPU names, serial numbers, MAC addresses |
| `workload_added` | App added to stack | `softwareCategory`, `intensity`, `concurrency`, `totalWorkloadsCount` | User project names, file names, file paths |
| `compatibility_check_completed` | Diagnostic result computed | `resultStatus`, `scoreBucket`, `limitingResource`, `confidenceLevel`, `durationBucket` | Full report JSON, raw memory bytes |
| `compatibility_check_failed` | Diagnostic error | `errorCode`, `workloadCount` | Stack traces, raw error messages |
| `upgrade_simulation_applied` | Slider adjusted in simulator | `deltaScore`, `newStatus` | User purchasing intentions |
| `recommendation_selected` | User clicks target spec CTA | `recommendationTier`, `action` | Payment details |
| `report_shared` | Share modal used | `shareMethod` | Generated snapshot public ID, share URLs |
| `consent_updated` | User changes privacy state | `previousState`, `newState` | User IP or identity |

---

## 5. Owner / Legal Finalization Items (TODOs)

> [!NOTE]
> The technical controls (GPC support, withdrawal cleanup, redaction, cookie headers) are fully operational. The organization deploying this codebase must finalize the following operational items:

- [ ] **Data Controller Identity**: Add official business legal name, registration number, and registered address to final legal documentation.
- [ ] **Data Protection Officer (DPO)**: Specify dedicated contact email (e.g. `privacy@yourdomain.com`).
- [ ] **Subprocessor Data Processing Agreements (DPAs)**: Execute official DPAs with PostHog and Sentry under standard contractual clauses (SCCs).
- [ ] **Retention Schedule**: Formally document corporate data retention period (e.g. 90-day retention on error logs).
