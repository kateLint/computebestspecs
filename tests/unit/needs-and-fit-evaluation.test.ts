import { describe, it, expect } from "vitest";
import { parseNaturalLanguageNeeds } from "@/services/needs/natural-language-needs-parser";
import { evaluateNeedsFit } from "@/services/needs/needs-evaluator";
import { PERSONAS_CATALOG } from "@/services/needs/personas-catalog";
import { HardwareProfile } from "@/lib/domain/hardware";

describe("Needs Profiling & Natural Language Intent Parser", () => {
  it("correctly identifies CS student persona and extracts budget", () => {
    const prompt = "I am a computer science student. I need Android Studio, Docker, and lightweight local AI with a budget of $1200 for 4 years.";
    const profile = parseNaturalLanguageNeeds(prompt);

    expect(profile.personaId).toBe("persona-cs-student");
    expect(profile.budget).toEqual({ amount: 1200, currency: "USD" });
    expect(profile.targetLongevityYears).toBe(4);
    expect(profile.workloads.some((w) => w.softwareName.toLowerCase().includes("docker"))).toBe(true);
    expect(profile.agentProfile).toBeDefined();
  });

  it("correctly parses ILS currency and heavy AI agentbuilder persona", () => {
    const prompt = "AI researcher building autonomous agent swarms with local LLM and vector database, budget ₪7500.";
    const profile = parseNaturalLanguageNeeds(prompt);

    expect(profile.personaId).toBe("persona-ai-builder");
    expect(profile.budget?.currency).toBe("ILS");
    expect(profile.budget?.amount).toBe(7500);
    expect(profile.weights.localAi).toBe(5);
  });
});

describe("Holistic Fit Evaluation Engine (4-Tier Separation & Multi-Agent)", () => {
  const highEndRig: HardwareProfile = {
    cpu: { model: "AMD Ryzen 9 7950X", architecture: "x86_64", performanceScore: 96, isVerified: true },
    gpu: { model: "NVIDIA GeForce RTX 4090", type: "dedicated", performanceScore: 98, vramGb: 24, supportsCuda: true },
    ram: { totalGb: 64, type: "DDR5" },
    storage: [{ type: "NVME_SSD", totalGb: 2000 }],
    os: { family: "windows", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "desktop",
  };

  const budgetLaptop: HardwareProfile = {
    cpu: { model: "AMD Ryzen 5 5600H", architecture: "x86_64", performanceScore: 68, isVerified: true },
    gpu: { model: "NVIDIA RTX 3050 Laptop", type: "dedicated", performanceScore: 55, vramGb: 4, supportsCuda: true },
    ram: { totalGb: 16, type: "DDR4" },
    storage: [{ type: "NVME_SSD", totalGb: 512 }],
    os: { family: "windows", architecture: "x86_64" },
    architecture: "x86_64",
    deviceType: "laptop",
  };

  it("issues NO UPGRADE RECOMMENDED for high-spec machine exceeding requirements", () => {
    const devPersona = PERSONAS_CATALOG[0];
    const result = evaluateNeedsFit(highEndRig, {
      id: "p1",
      primaryGoal: devPersona.description,
      weights: devPersona.weights,
      workloads: devPersona.typicalWorkloads,
      agentProfile: devPersona.defaultAgentProfile,
    });

    expect(result.overallFit).toBe("excellent");
    expect(result.canRun.status).toBe(true);
    expect(result.runsWell.status).toBe(true);
    expect(result.fitsWorkload.status).toBe(true);
    expect(result.upgradeVerdict.shouldUpgrade).toBe(false);
    expect(result.upgradeVerdict.headline).toBe("NO UPGRADE RECOMMENDED");
    expect(result.executionStrategy.recommendedStrategy).toBe("LOCAL");
  });

  it("accurately flags RAM contention on 16GB machine under full-stack concurrency", () => {
    const devPersona = PERSONAS_CATALOG[0];
    const result = evaluateNeedsFit(budgetLaptop, {
      id: "p2",
      primaryGoal: devPersona.description,
      weights: devPersona.weights,
      workloads: devPersona.typicalWorkloads,
      agentProfile: devPersona.defaultAgentProfile,
    });

    expect(result.overallFit).not.toBe("excellent");
    expect(result.fitsWorkload.ramPressureRatio).toBeGreaterThan(1.0);
    expect(result.upgradeVerdict.shouldUpgrade).toBe(true);
    expect(result.upgradeVerdict.primaryUpgrade?.component).toBe("System RAM");
    expect(result.executionStrategy.recommendedStrategy).toBe("HYBRID");
  });

  it("simulates multi-agent scaling and pinpoints VRAM bottleneck count", () => {
    const aiPersona = PERSONAS_CATALOG[1];
    const result = evaluateNeedsFit(budgetLaptop, {
      id: "p3",
      primaryGoal: aiPersona.description,
      weights: aiPersona.weights,
      workloads: aiPersona.typicalWorkloads,
      agentProfile: aiPersona.defaultAgentProfile,
    });

    expect(result.agentSimulation).toBeDefined();
    expect(result.agentSimulation?.perAgentMetrics.length).toBe(5);
    // On 4GB VRAM laptop, 3+ agents should be not recommended or borderline
    const threeAgentMetric = result.agentSimulation?.perAgentMetrics.find((m) => m.agentCount === 3);
    expect(threeAgentMetric?.fitTier).toMatch(/borderline|not_recommended/);
  });
});
