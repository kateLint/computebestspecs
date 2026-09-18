# Comparison Matrix UX & Decision Framework

## 1. System Comparison Matrix Overview

The comparison screen (`app/compare/page.tsx`) provides side-by-side analysis of up to 3 computer systems under an identical workload suite:
- **Unified Workload Benchmark**: Compares systems against the user's active multi-app workload rather than synthetic isolated numbers.
- **Meaningful Differences Toggle**: Users can toggle between viewing the full specification breakdown and filtering to only hardware components with meaningful capacity or score deltas.

---

## 2. Multi-Dimensional Comparison Rows

The comparison matrix evaluates:
1. **Overall Workload Fit**: Fit status (`Suitable`, `Warning`, `Severe Bottleneck`) and total compatibility score.
2. **Main Limitation**: Primary bottleneck component (RAM, VRAM, GPU, CPU, Storage).
3. **Hardware Breakdown**: CPU performance score, GPU tier & variant (Desktop vs Laptop), VRAM capacity, System RAM, and Storage speed/capacity.
4. **Operating System Support**: Platform compatibility across Windows, macOS, and Linux.
5. **Local AI & LLM Readiness**: Model parameter limits, quantization support, and estimated tokens/sec.
6. **Recommended Upgrade**: Cost-effective hardware upgrade to maximize workload headroom.

---

## 3. Honest, Contextual Recommendations

In accordance with `no_human` principles, the system never declares a single computer universally "best." Instead, it provides actionable, contextual insights:
- **Highest Capacity Match**: System with the highest composite multitasking throughput.
- **Best Suited For**: Specific user personas (e.g. Heavy Dev & Docker vs. 4K Video Editing).
- **Upgradeability**: Future expansion potential vs. soldered platforms.
- **Trade-Offs**: Honest pros and cons highlighting thermal, power, and price trade-offs.
