# ComputeBestSpecs — Master Engineering Roadmap & Architecture Specification

This document defines the unified architectural blueprint, domain invariants, bounded contexts, and multi-phase implementation roadmap for **ComputeBestSpecs**.

---

## 1. Unified System Architecture

All user flows (evaluating an existing PC, sizing a prospective purchase, fleet diagnosis, or local AI workload modeling) execute over a single shared capability engine.

```text
                         COMPUTEBESTSPECS

                           USER NEEDS
                               │
                ┌──────────────┴──────────────┐
                │                             │
          Existing device              Need a device
                │                             │
                ▼                             ▼
        Hardware Resolver              Recommendation Engine
                │                             │
                └──────────────┬──────────────┘
                               ▼
                         WORKLOAD MODEL
                               │
                  ┌────────────┼────────────┐
                  ▼            ▼            ▼
              Software      Local AI      Agents
                  │            │            │
                  └────────────┼────────────┘
                               ▼
                      CAPABILITY ENGINE
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
           Compatibility   Performance   Workload Fit
                 │             │             │
                 └─────────────┼─────────────┘
                               ▼
                         RECOMMENDATION
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
          Upgrade            Buy PC           Local/Cloud
                               │
                               ▼
                        PRODUCT CATALOG
                               │
                         Price Tracking
                               │
                           Marketplace
```

---

## 2. Core Invariants & Bounded Contexts

### 2.1 The Prime Invariant: Truthful Provenance
> **"Missing requirement $\neq$ default requirement. Never turn missing data into a fake number."**

Every requirement, specification, and capability metric operates under explicit knowledge states:
```ts
export type KnowledgeState =
  | "KNOWN"
  | "UNKNOWN"
  | "CONFLICTING"
  | "STALE"
  | "INSUFFICIENT";
```

### 2.2 Bounded Contexts
Even within a unified codebase, strict logical boundaries are maintained:

1. **`catalog/`** — Canonical hardware components (CPU, GPU, RAM, Storage, NPU), software entities, AI model specifications, and commercial devices.
2. **`requirements/`** — Versioned software hardware requirements, capability assertions, and intensity-based workload profiles.
3. **`evaluation/`** — Evaluation snapshots, compatibility results, deterministic bottleneck derivations, recommendations, and structured explanations.
4. **`benchmarks/`** — Benchmark observations, empirical datasets (Phoronix, Blender Open Data, `llama-bench`, UL Procyon, PassMark), and calibration indices.
5. **`commerce/`** — Commercial product SKUs, merchant offers, price observations, historical trends, and affiliate routing.
6. **`accounts/`** — Users, subscriptions, and capability-based entitlements.
7. **`fleet/`** — Organizations, device inventories, workload policies, bulk evaluation runs, and remediation plans.
8. **`control-plane/`** — Raw snapshots, ingestion parsers, candidate staging, validation suites, regression testing, and dataset revision publishing.

---

## 3. Subsystem Specifications

### 3.1 Data Control Plane & Ingestion Pipeline
Production requirements and benchmarks are never directly edited. All data passes through a multi-stage promotion pipeline:

```text
Source Document → Raw Snapshot → Parser → Normalized Candidate → Schema & Consistency Validation → Review Gate → Staging Dataset → Regression Tests → Impact Analysis → Published Revision
```

```ts
export interface RequirementCandidate {
  id: string;
  softwareVersionId: string;
  sourceDocumentId: string;
  rawPayload: unknown;
  normalizedPayload: unknown;
  parserVersion: string;
  modelVersion?: string;
  confidence: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  status:
    | "UNVERIFIED"
    | "PARSED"
    | "VALIDATED"
    | "VERIFIED"
    | "PUBLISHED"
    | "REJECTED";
}
```

### 3.2 Hardware Identity & Canonical Resolution
The resolver matches raw user/system strings (from manual entry, JSON imports, or desktop scanner) into canonical components, distinguishing desktop vs. laptop variants and thermal envelopes:

```ts
export interface ResolutionResult<T> {
  status: "EXACT" | "HIGH_CONFIDENCE" | "AMBIGUOUS" | "NOT_FOUND";
  confidence: number;
  canonical?: T;
  candidates: T[];
}
```

### 3.3 Vectorized Workload Simulation & Concurrency
Resources are modeled as continuous multidimensional demand vectors across execution phases:

```ts
export interface ResourceVector {
  cpu: number;               // Normalized core utilization %
  cpuSingleThread?: number;  // Single-thread bottleneck demand %
  ramGb: number;             // Allocation in GB
  gpu?: number;              // GPU compute demand %
  vramGb?: number;           // VRAM allocation in GB
  diskReadMBps?: number;
  diskWriteMBps?: number;
  tempStorageGb?: number;
  networkMbps?: number;
}

export interface ResourceDemand {
  idle: ResourceVector;
  typical: ResourceVector;
  peak: ResourceVector;
  confidence: "HIGH" | "MEDIUM" | "ESTIMATED";
  evidence: EvidenceRecord[];
}
```

**Total Concurrency Demand Calculation:**
$$\text{Total Demand} = \text{OS Reserve} + \text{Foreground Workload} + \sum (\text{Background Workload}_i \times \text{Policy Factor}_i) + \text{Containers} + \text{Emulators} + \text{AI Runtimes} + \text{Headroom}$$

### 3.4 Local AI Sizing & Multi-Agent Concurrency
AI workloads are modeled deterministically from model weight size, quantization bit-depth, context window length, and KV cache overhead:

```text
Model → Variant → Quantization → Runtime → Backend → Hardware → Residency → Context / KV Cache → TPS Range & Confidence
```

```ts
export type ResidencyMode =
  | "FULL_GPU"
  | "FULL_UNIFIED_MEMORY"
  | "PARTIAL_GPU_OFFLOAD"
  | "CPU_ONLY"
  | "INSUFFICIENT_MEMORY";
```

**Multi-Agent Resource Accounting:**
- **Shared**: Model base weights (single instance in memory) + runtime engine overhead.
- **Per-Agent Session**: Dedicated KV cache allocation + tool servers/processes + browser/terminal sandbox memory.

### 3.5 Upgrade Simulation Engine
Upgrade recommendations are generated by simulating counterfactual hardware configurations:

```ts
export interface UpgradeImpact {
  upgrade: UpgradeCandidate;
  before: EvaluationSummary;
  after: EvaluationSummary;
  workloadImprovement: number; // 0-100 delta
  estimatedCost?: { amount: number; currency: string };
  valueScore?: number;
}
```

### 3.6 Structured Explanations & Localization
Explanations originate as structured parameter objects from the engine rather than unconstrained LLM text, ensuring 100% factual accuracy across English, Hebrew, and future languages:

```ts
export interface EngineDiagnosticCode {
  code: "RAM_PEAK_EXCEEDS_AVAILABLE" | "VRAM_SPILL_DETECTED" | "CPU_INSUFFICIENT_CORES" | "ARCH_INCOMPATIBLE";
  params: Record<string, string | number>;
}
```

---

## 4. Phased Engineering Execution Roadmap

```text
PHASE 0  — Core Contracts: Domain types, engine invariants, SQLite/PostgreSQL schemas, versioning & cryptographic fingerprints.
PHASE 1  — Trustworthy PC MVP: Hardware catalog, software requirements with provenance, concurrency engine, bottlenecks, recommendations.
PHASE 2  — Productionization: Golden corpus test suite, security controls, backup/restore verification, observability, mobile & WCAG 2.2 AA parity.
PHASE 3  — Real User Alpha: Closed testing (10–20 users), engine calibration against real hardware discrepancies.
PHASE 4  — Public Beta: Open access (50–500 users), anonymous-first evaluation, progressive accounts, saved profiles.
PHASE 5  — Local AI Sizing: Quantized model catalog, runtime matrix (llama.cpp, MLX, vLLM, Ollama), llama-bench calibration, TPS bands.
PHASE 6  — Advanced Simulation: What-If upgrade optimizer, stress modeling, multi-agent concurrency sizing.
PHASE 7  — Hardware Scanner: Lightweight signed native application (Windows, macOS, Linux) with user review gate before upload.
PHASE 8  — Purchasing Engine: Required specs generation, commercial product matching, budget/preference optimization.
PHASE 9  — Price Tracking: Merchant feed ingestion, historical price observations, price alerts, affiliate outbound checkout.
PHASE 10 — Payments & Entitlements: Idempotent webhook processing, capability-based entitlements (`can(user, ...)`).
PHASE 11 — Enterprise Fleet: Organization management, RBAC, bulk CSV/MDM imports, fleet-wide remediation & procurement plans.
PHASE 12 — Community Benchmarks: Benchmark collection pipeline, outlier filtering, MAD statistics, calibrated trust weights.
PHASE 13 — Multi-Device Extension: Generalization to Smartphones, Tablets, and Handhelds via unified `DeviceProfile`.
PHASE 14 — Marketplace: Merchant integration and direct purchasing only if product discovery validates high commercial demand.
```

---

## 5. Production Readiness Gate (v1.0 Checklist)

Before declaring v1.0 production ready, every item below must pass:

- [x] Hardware input is reliably resolved & normalized (desktop vs. laptop variants).
- [x] Software requirements carry explicit source provenance.
- [x] Missing requirements render as `UNKNOWN` / `Not published` (zero fake fallbacks).
- [x] Compatibility decisions and bottleneck identifications are 100% deterministic.
- [x] Multi-workload concurrency calculations are unit-tested and property-tested.
- [x] Recommendations originate directly in the engine.
- [x] All evaluations display confidence levels and evidence sources.
- [x] Every evaluation snapshot includes version strings and a SHA-256 fingerprint.
- [x] Golden scenario corpus passes without regressions.
- [x] Dataset release gate verifies differential impacts over stored evaluation scenarios.
- [x] API inputs and outputs are validated with runtime Zod schemas.
- [x] Security controls (CSRF, rate limiting, CSP, secure headers, nonsequential IDs) are verified.
- [x] Observability tracks evaluation latency, error rates, and unknown/ambiguity rates.
- [x] Mobile UX and WCAG 2.2 AA accessibility standards ($\ge 44\text{px}$ touch targets, visible focus, high contrast) are verified across all views.
