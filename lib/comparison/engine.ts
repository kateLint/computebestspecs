import { ComparisonSet, ComparisonAnalysis, ComparisonDifferenceRow, EvaluatedComparisonItem } from "./types";
import { CompatibilityResult } from "../domain/compatibility";

/**
 * Analyzes a set of evaluated computers to extract meaningful differences and trade-offs.
 * Ensures consistent comparison against a single shared workload suite.
 */
export function analyzeComparisonSet(
  items: EvaluatedComparisonItem[]
): ComparisonAnalysis {
  if (items.length === 0) {
    return {
      evaluatedItems: [],
      rows: [],
      bestMatchItemId: null,
      tradeOffs: [],
    };
  }

  // 1. Determine overall best match based on score & critical bottlenecks
  let bestItem = items[0];
  for (const it of items) {
    if ((it.result.score || 0) > (bestItem.result.score || 0)) {
      bestItem = it;
    }
  }

  // 2. Build structured comparison difference rows
  const rows: ComparisonDifferenceRow[] = [
    // Overall Conclusion
    {
      category: "Verdict",
      label: "Overall Fit Status",
      isMeaningfulDiff: items.some((i) => i.result.performanceTier !== items[0].result.performanceTier),
      values: items.map((i) => ({
        itemId: i.item.id,
        text: formatPerformanceTier(i.result.performanceTier),
        status: i.result.score >= 80 ? "good" : i.result.score >= 60 ? "warning" : "bad",
        subtext: `Score: ${i.result.score}/100`,
      })),
    },
    // Main Limitation / Bottleneck
    {
      category: "Verdict",
      label: "Main Limitation",
      isMeaningfulDiff: true,
      values: items.map((i) => {
        const bn = i.result.bottlenecks && i.result.bottlenecks[0];
        return {
          itemId: i.item.id,
          text: bn ? `${bn.component.toUpperCase()} (${bn.severity})` : "None identified",
          status: bn ? (bn.severity === "critical" || bn.severity === "high" ? "bad" : "warning") : "good",
          subtext: bn ? bn.reason : "Sufficient headroom for target tasks",
        };
      }),
    },
    // CPU Specification
    {
      category: "Hardware",
      label: "Processor (CPU)",
      isMeaningfulDiff: items.some((i) => i.item.hardware.cpu !== items[0].item.hardware.cpu),
      values: items.map((i) => ({
        itemId: i.item.id,
        text: i.item.hardware.cpu,
        status: i.result.components?.cpu?.status === "PASS" ? "good" : "neutral",
        subtext: i.result.components?.cpu ? `Score: ${i.result.components.cpu.score}/100` : undefined,
      })),
    },
    // GPU Specification
    {
      category: "Hardware",
      label: "Graphics (GPU)",
      isMeaningfulDiff: items.some((i) => i.item.hardware.gpu !== items[0].item.hardware.gpu),
      values: items.map((i) => ({
        itemId: i.item.id,
        text: i.item.hardware.gpu,
        status: i.result.components?.gpu?.status === "PASS" ? "good" : "neutral",
        subtext: i.result.components?.gpu ? `Score: ${i.result.components.gpu.score}/100` : undefined,
      })),
    },
    // Memory (RAM)
    {
      category: "Hardware",
      label: "System Memory (RAM)",
      isMeaningfulDiff: items.some((i) => i.item.hardware.ramGb !== items[0].item.hardware.ramGb),
      values: items.map((i) => ({
        itemId: i.item.id,
        text: `${i.item.hardware.ramGb} GB`,
        status: (i.item.hardware.ramGb || 0) >= 32 ? "good" : (i.item.hardware.ramGb || 0) >= 16 ? "warning" : "bad",
        subtext: i.result.concurrencyMetrics ? `Estimated Usage: ${Math.round(i.result.concurrencyMetrics.effectiveRequiredRamGb || 0)} GB` : undefined,
      })),
    },
    // Storage
    {
      category: "Hardware",
      label: "Storage Capacity",
      isMeaningfulDiff: items.some((i) => i.item.hardware.storageGb !== items[0].item.hardware.storageGb),
      values: items.map((i) => ({
        itemId: i.item.id,
        text: `${i.item.hardware.storageGb >= 1000 ? `${(i.item.hardware.storageGb / 1000).toFixed(0)} TB` : `${i.item.hardware.storageGb} GB`}`,
        status: i.item.hardware.storageGb >= 1000 ? "good" : "neutral",
      })),
    },
    // Upgradeability
    {
      category: "Capabilities",
      label: "Upgrade Potential",
      isMeaningfulDiff: items.some((i) => i.item.hardware.formFactor !== items[0].item.hardware.formFactor),
      values: items.map((i) => {
        const ff = i.item.hardware.formFactor;
        const upgradeability = ff === "desktop" ? "High (Modular CPU, GPU, RAM)" : ff === "laptop" ? "Limited (RAM/SSD only)" : "Not upgradeable / Compact";
        return {
          itemId: i.item.id,
          text: upgradeability,
          status: ff === "desktop" ? "good" : ff === "laptop" ? "warning" : "neutral",
        };
      }),
    },
    // Operating System & Ecosystem
    {
      category: "Capabilities",
      label: "Platform / OS",
      isMeaningfulDiff: items.some((i) => i.item.hardware.os !== items[0].item.hardware.os),
      values: items.map((i) => ({
        itemId: i.item.id,
        text: i.item.hardware.os,
        status: "neutral",
      })),
    },
  ];

  // 3. Trade-off breakdown per computer
  const tradeOffs = items.map((it) => {
    const pros: string[] = [];
    const cons: string[] = [];
    const ff = it.item.hardware.formFactor;

    if (it.result.score >= 85) {
      pros.push("Meets or exceeds all recommended software requirements");
    } else if (it.result.score >= 65) {
      pros.push("Handles everyday editing and typical concurrent loads");
    }

    if (it.item.hardware.ramGb >= 32) {
      pros.push(`${it.item.hardware.ramGb}GB RAM allows multi-app multitasking without swapping`);
    } else {
      cons.push(`Lower memory (${it.item.hardware.ramGb}GB) risks slowdowns under peak workloads`);
    }

    if (ff === "desktop") {
      pros.push("High thermal headroom and straightforward component upgrades");
      cons.push("Requires dedicated desk space and external monitor");
    } else if (ff === "laptop") {
      pros.push("Portable form factor for on-the-go productivity");
      cons.push("Limited thermal envelope under sustained heavy renders");
    }

    const upgradeability: "High" | "Limited" | "Not upgradeable" | "Unknown" =
      ff === "desktop" ? "High" : ff === "laptop" ? "Limited" : "Not upgradeable";

    let bestFor = "General productivity";
    if (it.result.score >= 85) {
      bestFor = "Heavy production, rendering & professional multitasking";
    } else if (ff === "laptop") {
      bestFor = "Mobile creators and portable workflows";
    } else if (it.result.score >= 65) {
      bestFor = "Budget-conscious standard workflow";
    }

    return {
      itemId: it.item.id,
      headline: `${it.item.name}: ${it.result.score >= 80 ? "Powerhouse" : it.result.score >= 60 ? "Balanced" : "Budget Entry"}`,
      pros,
      cons,
      bestFor,
      upgradeability,
    };
  });

  return {
    evaluatedItems: items,
    rows,
    bestMatchItemId: bestItem.item.id,
    tradeOffs,
  };
}

function formatPerformanceTier(tier?: string): string {
  switch (tier?.toLowerCase()) {
    case "excellent":
      return "Excellent (Exceeds Targets)";
    case "recommended":
      return "Suitable (Recommended)";
    case "usable":
      return "Suitable with Limits";
    case "minimum":
      return "Borderline (Minimum Spec)";
    case "poor":
      return "Not Suitable (Bottlenecked)";
    default:
      return "Evaluated";
  }
}
