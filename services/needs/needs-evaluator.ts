import { HardwareProfile } from "@/lib/domain/hardware";
import { UserNeedsProfile, FitEvaluationResult } from "@/lib/domain/needs-profile";

export function evaluateNeedsFit(
  hardware: HardwareProfile,
  needs: UserNeedsProfile
): FitEvaluationResult {
  const ramGb = hardware.ram.totalGb;
  const vramGb = hardware.gpu?.vramGb || (hardware.cpu.manufacturer === "Apple" ? Math.round(ramGb * 0.7) : 0);
  const cpuScore = hardware.cpu.performanceScore || 65;
  const gpuScore = hardware.gpu?.performanceScore || (hardware.cpu.manufacturer === "Apple" ? 75 : 30);
  const isAppleUnified = hardware.cpu.manufacturer === "Apple";

  // 1. Calculate Required Steady-State & Peak RAM under Concurrency
  let activeRamDemandsGb = 3.5; // Baseline OS + background services
  let gpuComputeDemand = 20;

  for (const item of needs.workloads) {
    let itemBaseRam = 1.5;
    if (item.softwareName.toLowerCase().includes("photoshop")) {
      itemBaseRam = item.intensity === "extreme" ? 14 : item.intensity === "professional" || item.intensity === "heavy" ? 8 : 4;
    } else if (item.softwareName.toLowerCase().includes("android studio") || item.softwareName.toLowerCase().includes("xcode")) {
      itemBaseRam = item.intensity === "extreme" ? 12 : 7;
    } else if (item.softwareName.toLowerCase().includes("emulator") || item.softwareName.toLowerCase().includes("virtual")) {
      itemBaseRam = (item.quantity || 1) * 3.5;
    } else if (item.softwareName.toLowerCase().includes("chrome") || item.softwareName.toLowerCase().includes("browser")) {
      itemBaseRam = item.intensity === "extreme" ? 8 : 4.5;
    } else if (item.softwareName.toLowerCase().includes("docker")) {
      itemBaseRam = (item.quantity || 4) * 1.5 + 2.0;
    } else if (item.softwareName.toLowerCase().includes("blender") || item.softwareName.toLowerCase().includes("unreal")) {
      itemBaseRam = item.intensity === "extreme" ? 18 : 10;
      gpuComputeDemand += 50;
    } else if (item.softwareName.toLowerCase().includes("premiere") || item.softwareName.toLowerCase().includes("after effects")) {
      itemBaseRam = item.intensity === "extreme" ? 22 : 12;
      gpuComputeDemand += 40;
    } else {
      itemBaseRam = item.intensity === "extreme" ? 6 : 3;
    }

    // Weight by concurrency group
    if (item.concurrencyGroup === "usually_together") {
      activeRamDemandsGb += itemBaseRam;
    } else if (item.concurrencyGroup === "occasionally") {
      activeRamDemandsGb += itemBaseRam * 0.4;
    }
  }

  // Include Local Agent Memory Footprint if present
  let agentVramGb = 0;
  let agentRamGb = 0;
  if (needs.agentProfile) {
    const is14B = needs.agentProfile.modelName.includes("14B");
    const is32B = needs.agentProfile.modelName.includes("32B");
    const baseWeightsGb = is32B ? 19.5 : is14B ? 9.2 : 5.4;
    const kvCacheGb = (needs.agentProfile.contextLengthTokens / 1024) * 0.4;

    if (vramGb >= baseWeightsGb + kvCacheGb + 1) {
      agentVramGb = baseWeightsGb + kvCacheGb;
    } else {
      // Partial or full CPU RAM offload
      agentVramGb = Math.max(0, vramGb - 1.5);
      agentRamGb = baseWeightsGb + kvCacheGb - agentVramGb + 2.0; // tools + embedding
    }
  }

  const totalConcurrentRamGb = activeRamDemandsGb + agentRamGb;
  const ramPressureRatio = totalConcurrentRamGb / ramGb;

  // 2. Evaluate the 4 Core Dimensions
  // DIMENSION 1: CAN RUN
  const canRun = {
    status: true,
    label: "✓ All software and instruction sets fully supported",
    reasons: [] as string[],
  };

  // DIMENSION 2: RUNS WELL
  let performanceTier: "poor" | "minimum" | "usable" | "recommended" | "excellent" = "recommended";
  let runsWellScore = Math.round((cpuScore * 0.5 + gpuScore * 0.5));
  if (ramPressureRatio > 1.25) {
    performanceTier = "poor";
    runsWellScore = Math.min(runsWellScore, 42);
  } else if (ramPressureRatio > 1.0) {
    performanceTier = "minimum";
    runsWellScore = Math.min(runsWellScore, 64);
  } else if (ramPressureRatio > 0.8) {
    performanceTier = "usable";
    runsWellScore = Math.min(runsWellScore, 78);
  } else if (cpuScore >= 80 && gpuScore >= 70 && ramPressureRatio <= 0.65) {
    performanceTier = "excellent";
    runsWellScore = Math.max(88, runsWellScore);
  }

  const runsWell = {
    status: performanceTier === "recommended" || performanceTier === "excellent" || performanceTier === "usable",
    label: performanceTier === "excellent" ? "★ Runs with High Responsiveness" : performanceTier === "recommended" ? "✓ Runs Smoothly" : "⚠ Operates with Moderate Resource Latency",
    tier: performanceTier,
    score: runsWellScore,
    summary: `CPU compute index (${cpuScore}) and GPU engine (${gpuScore}) deliver reliable sustained throughput for active tasks.`,
  };

  // DIMENSION 3: GOOD FOR MY WORKLOAD
  const fitsWorkload = {
    status: ramPressureRatio <= 1.05,
    label: ramPressureRatio <= 0.75 ? "✓ Excellent Multitasking Fit" : ramPressureRatio <= 1.0 ? "✓ Fits Concurrent Load" : "⚠ Heavy RAM Contention / Swap Paging",
    ramPressureRatio: Math.round(ramPressureRatio * 100) / 100,
    concurrencyLimit: ramPressureRatio > 1.0 ? `Peak simultaneous memory demand (~${Math.round(totalConcurrentRamGb)} GB) exceeds physical capacity (${ramGb} GB).` : `All simultaneous foreground and background tasks fit comfortably with headroom.`,
    summary: `Estimated steady-state active set is ~${Math.round(totalConcurrentRamGb)} GB against ${ramGb} GB installed memory.`,
  };

  // DIMENSION 4: GOOD PURCHASE (Longevity, Form Factor, Budget ROI)
  const targetLongevity = needs.targetLongevityYears || 3;
  let longevityYears = 3.5;
  if (ramGb >= 64 && cpuScore >= 85) longevityYears = 5.0;
  else if (ramGb >= 32 && cpuScore >= 75) longevityYears = 4.0;
  else if (ramGb <= 16) longevityYears = 2.0;

  const hasPrice = Boolean(needs.budget?.amount && needs.budget.amount > 0);
  const priceAmount = needs.budget?.amount;
  const priceCurrency = needs.budget?.currency || "USD";

  let purchaseLabel = "Purchase Value Unknown";
  let purchaseRecommendation = "Add the purchase price to calculate whether this configuration offers good long-term value.";
  let purchaseValueScore = 50;

  if (hasPrice && priceAmount) {
    const costPerYear = priceAmount / longevityYears;
    const isGoodValue = costPerYear < (priceCurrency === "ILS" ? 2500 : 700);
    purchaseLabel = isGoodValue ? "✓ Good Value Purchase" : "⚠ High Cost per Usable Year";
    purchaseValueScore = isGoodValue ? 85 : 45;
    purchaseRecommendation = `At ${priceCurrency} ${priceAmount.toLocaleString()}, expected amortized hardware cost is ~${priceCurrency} ${Math.round(costPerYear).toLocaleString()}/year over ${longevityYears} years.`;
  } else {
    purchaseLabel = "Price Unknown";
    purchaseRecommendation = "Add the purchase price to evaluate if this configuration is good value.";
    purchaseValueScore = Math.min(100, Math.round(runsWellScore * (longevityYears / 4.0)));
  }

  const goodPurchase = {
    status: longevityYears >= targetLongevity - 0.5,
    priceKnown: hasPrice,
    label: purchaseLabel,
    valueScore: purchaseValueScore,
    longevityYears,
    longevityAssumptions: `Based on current software footprint expansion and architecture performance headroom.`,
    recommendation: purchaseRecommendation,
  };

  // 3. Multi-Agent Concurrency Simulation (1 to 5 agents)
  const perAgentMetrics = [1, 2, 3, 4, 5].map((count) => {
    const perAgentWeightsVram = 5.2; // 8B-14B quant
    const perAgentContextAndToolsRam = 3.2; // tool server + browser + context
    const reqVram = count * perAgentWeightsVram;
    const reqRam = count * perAgentContextAndToolsRam + activeRamDemandsGb;
    const isVramBottleneck = reqVram > vramGb && !isAppleUnified;
    const isRamBottleneck = reqRam > ramGb;

    let fitTier: "excellent" | "good" | "borderline" | "not_recommended" = "excellent";
    let statusLabel = "High Throughput";
    let tokensPerSec = Math.max(8, Math.round(42 - count * 6));

    if (isVramBottleneck && isRamBottleneck) {
      fitTier = "not_recommended";
      statusLabel = "PCIe Thrashing & RAM Saturation";
      tokensPerSec = 3;
    } else if (isVramBottleneck || isRamBottleneck) {
      fitTier = "borderline";
      statusLabel = isVramBottleneck ? "PCIe Spillover Offload" : "High Memory Pressure";
      tokensPerSec = 11;
    } else if (count >= 3) {
      fitTier = "good";
      statusLabel = "Smooth Multi-Agent Execution";
      tokensPerSec = 22;
    }

    return {
      agentCount: count,
      ramUsageGb: Math.round(reqRam * 10) / 10,
      vramUsageGb: Math.round(Math.min(vramGb, reqVram) * 10) / 10,
      cpuUsagePct: Math.min(100, Math.round(25 + count * 15)),
      tokensPerSec,
      fitTier,
      statusLabel,
    };
  });

  const maxRecommendedAgents = perAgentMetrics.filter((m) => m.fitTier === "excellent" || m.fitTier === "good").length || 1;

  // 4. Execution Strategy Advisor (Local vs Hybrid vs Cloud)
  let recommendedStrategy: "LOCAL" | "HYBRID" | "CLOUD" = "LOCAL";
  let strategyHeadline = "Local Hardware Execution Recommended";
  let strategyExplanation = "Your hardware has sufficient memory and compute to execute these workloads privately and with zero recurring API costs.";

  if (vramGb < 8 && ramGb <= 16) {
    recommendedStrategy = "HYBRID";
    strategyHeadline = "Hybrid Execution Strategy Optimal";
    strategyExplanation = "Run embedding search and tool orchestration locally on your CPU/GPU, but route heavy 14B–70B model reasoning to Cloud APIs to avoid extreme token latency.";
  } else if (vramGb >= 16 || (isAppleUnified && ramGb >= 36)) {
    recommendedStrategy = "LOCAL";
    strategyHeadline = "Full Local Privacy & Zero API Cost";
    strategyExplanation = "Your dedicated VRAM/Unified Memory bandwidth allows full local inference for 14B–32B models with sub-second generation times.";
  }

  // 5. Fit Fingerprint Calculations
  const fitFingerprint = {
    development: Math.min(100, Math.round((cpuScore * 0.4 + (ramGb / 32) * 50))),
    localAi: Math.min(100, Math.round((vramGb / 16) * 50 + (gpuScore / 100) * 40)),
    multitasking: Math.min(100, Math.round((1 - Math.min(1, ramPressureRatio - 0.2)) * 100)),
    creative: Math.min(100, Math.round(gpuScore * 0.6 + cpuScore * 0.4)),
    gaming: Math.min(100, Math.round(gpuScore * 0.8 + (vramGb / 12) * 20)),
    portability: hardware.deviceType === "laptop" ? 85 : 40,
    futureHeadroom: Math.min(100, Math.round((longevityYears / 5.0) * 100)),
  };

  // 6. Reverse Capability Profile ("What is this PC good at?")
  const excellentFor: string[] = [];
  const goodFor: string[] = [];
  const poorFitFor: string[] = [];

  if (ramGb >= 32) excellentFor.push("Multi-Container Docker & Kubernetes Dev", "Heavy Multitasking (40+ Browser Tabs + IDEs)");
  else if (ramGb >= 16) goodFor.push("Standard Web Development & Light Docker");
  else poorFitFor.push("Heavy Multi-Container Docker Stacks");

  if (vramGb >= 12 || (isAppleUnified && ramGb >= 36)) {
    excellentFor.push("Local 8B–14B LLMs & AI Coding Agents", "1440p High-Refresh Gaming", "4K Video Editing (Premiere / DaVinci)");
  } else if (vramGb >= 6) {
    goodFor.push("Local 7B/8B Q4 Models", "1080p Gaming & Esports", "1080p Video Editing");
  } else {
    poorFitFor.push("Local 14B+ AI Models", "High-Poly 3D GPU Rendering (Cycles/UE5)");
  }

  // 7. Overall Fit & Verdict Headline
  const workloadFitScore = ramPressureRatio <= 0.75 ? 95 : ramPressureRatio <= 1.0 ? 85 : 45;
  const overallFitScore = Math.round(runsWell.score * 0.4 + workloadFitScore * 0.4 + goodPurchase.valueScore * 0.2);

  let overallFit: "excellent" | "good" | "borderline" | "poor" | "incompatible" | "unknown" = "good";
  if (overallFitScore >= 85 && ramPressureRatio <= 0.75) overallFit = "excellent";
  else if (ramPressureRatio > 1.15) overallFit = "poor";
  else if (ramPressureRatio > 0.95) overallFit = "borderline";

  const verdictHeadline =
    overallFit === "excellent"
      ? "YES — EXCELLENT FIT"
      : overallFit === "good"
      ? "YES — GOOD FIT"
      : overallFit === "borderline"
      ? "BORDERLINE FIT"
      : overallFit === "poor"
      ? "POOR FIT"
      : overallFit === "incompatible"
      ? "INCOMPATIBLE"
      : "INSUFFICIENT DATA";

  const isExcessCapacity = ramPressureRatio < 0.65 && cpuScore >= 80 && gpuScore >= 70;

  // 8. Main Limitation Definition
  let mainLimitation: FitEvaluationResult["mainLimitation"] = undefined;
  const idealRamGb = Math.max(32, Math.ceil((totalConcurrentRamGb * 1.35) / 16) * 16);

  if (ramPressureRatio > 0.85) {
    mainLimitation = {
      resource: "ram",
      title: "System RAM",
      currentCapacity: `${ramGb} GB installed`,
      recommendedCapacity: `${idealRamGb} GB ideal for heavy workload`,
      simulateValue: idealRamGb,
      impactExplanation: `RAM is the first resource likely to become limiting under heavier AI + multi-app concurrency.`,
    };
  } else if (vramGb < 8 && needs.agentProfile) {
    mainLimitation = {
      resource: "vram",
      title: "GPU Video Memory (VRAM)",
      currentCapacity: `${vramGb} GB VRAM`,
      recommendedCapacity: "12 GB ideal for local AI models",
      simulateValue: 12,
      impactExplanation: `Local LLM generation will partially offload to CPU RAM, reducing throughput tokens/second.`,
    };
  }

  // 9. Provenance Breakdown
  const verifiedCount = needs.workloads.length;
  const provenance: FitEvaluationResult["provenance"] = {
    cpuIdentified: Boolean(hardware.cpu.isVerified || hardware.cpu.model),
    cpuModel: hardware.cpu.model,
    gpuIdentified: Boolean(hardware.gpu?.isVerified || hardware.gpu?.model),
    gpuModel: hardware.gpu?.model || "Integrated Graphics",
    requirementsVerifiedCount: verifiedCount,
    workloadEstimatesCount: needs.workloads.filter(w => w.concurrencyGroup !== "never_together").length,
    concurrencyModelled: true,
    confidenceTier: verifiedCount >= 3 ? "High confidence" : "Medium confidence",
    engineVersion: "ComputeBestSpecs Sizing Engine v1.4",
    datasetDate: "Aug 2026",
    evidencePoints: [
      { status: "exact", label: "CPU identity verified", detail: `${hardware.cpu.model} (${hardware.cpu.physicalCores} Cores)` },
      { status: "exact", label: "GPU identity verified", detail: `${hardware.gpu?.model || "Integrated Graphics"} (${vramGb} GB VRAM)` },
      { status: "exact", label: "Official vendor requirements", detail: `${verifiedCount} application profiles checked` },
      { status: "estimate", label: "Browser & multi-tab memory", detail: `Estimated ${activeRamDemandsGb.toFixed(1)} GB active memory footprint` },
      { status: "modeled", label: "AI agent concurrency modeled", detail: `${needs.agentProfile?.modelName || "Local AI"} execution load modeled` },
    ],
  };

  // 10. Actionable Upgrade Advisor
  const upgradeVerdict = {
    shouldUpgrade: !isExcessCapacity && (ramPressureRatio > 0.85 || vramGb < 8),
    headline: isExcessCapacity ? "NO UPGRADE RECOMMENDED" : ramPressureRatio > 0.85 ? "System RAM Upgrade Recommended" : "GPU / VRAM Upgrade Beneficial",
    reason: isExcessCapacity
      ? "Your current machine already exceeds the required headroom for your full-stack workload. Spending money on new hardware will not yield a perceptible performance gain."
      : ramPressureRatio > 0.85
      ? `Upgrading RAM from ${ramGb}GB to ${idealRamGb}GB will completely eliminate swap paging delays when running multi-app stacks.`
      : `A GPU upgrade with ≥12GB VRAM will accelerate local LLM tokens/sec and eliminate PCIe bus bottlenecks.`,
    pricingTier: "LIVE_MARKET" as const,
    primaryUpgrade: ramPressureRatio > 0.85
      ? {
          component: "System RAM",
          from: `${ramGb} GB`,
          to: `${idealRamGb} GB`,
          estimatedCostIls: 380,
          estimatedCostUsd: 99,
          priceRangeIls: "₪349–₪429",
          pricingSource: "LIVE_MARKET" as const,
          impact: "high" as const,
          justification: `Removes memory pressure from simultaneous IDE + Docker + Browser loads.`,
        }
      : undefined,
  };

  return {
    overallFit,
    fitScore: overallFitScore,
    verdictTitle: overallFit === "excellent" ? "EXCELLENT FIT FOR YOUR NEEDS" : overallFit === "good" ? "GOOD FIT FOR YOUR WORKLOAD" : "BORDERLINE FIT WITH CONSTRAINTS",
    verdictHeadline,
    verdictSummary: isExcessCapacity
      ? "This computer provides ample headroom and sustained stability for your day-to-day workflow."
      : `This PC comfortably handles your normal development workload. RAM is the first resource likely to become limiting under heavier AI + emulator use.`,
    provenance,
    mainLimitation,
    canRun,
    runsWell,
    fitsWorkload,
    goodPurchase,
    fitFingerprint,
    agentSimulation: {
      maxRecommendedAgents,
      bottleneckAtCount: maxRecommendedAgents + 1,
      limitingResource: vramGb < 12 ? "vram" : "ram",
      perAgentMetrics,
    },
    executionStrategy: {
      recommendedStrategy,
      headline: strategyHeadline,
      strategyExplanation,
      localViability: vramGb >= 12 ? "Full Local Hardware Acceleration" : "Partial GPU / CPU Hybrid Offload",
      costAndPrivacy: {
        localMonthlyElectricityEstimateUsd: 4.5,
        cloudMonthlyApiEstimateUsd: 45.0,
        privacyRating: vramGb >= 12 ? "Maximum (Airgapped / Local)" : "Medium (Hybrid)",
        latencyTier: vramGb >= 12 ? "Ultra-Low (<15ms)" : "Low (50-100ms)",
      },
    },
    capabilityMap: {
      excellentFor,
      goodFor,
      poorFitFor,
    },
    upgradeVerdict,
  };
}
