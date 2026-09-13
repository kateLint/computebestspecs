import { UserNeedsProfile, WorkloadItem, AgentWorkloadProfile } from "@/lib/domain/needs-profile";
import { PERSONAS_CATALOG } from "./personas-catalog";

export function parseNaturalLanguageNeeds(prompt: string): UserNeedsProfile {
  const text = prompt.toLowerCase();
  
  // Detect matching persona or fallback to general developer
  let basePersona = PERSONAS_CATALOG[0]; // Full-stack dev default
  if (text.includes("student") || text.includes("university") || text.includes("college") || text.includes("study") || text.includes("cs ")) {
    basePersona = PERSONAS_CATALOG.find((p) => p.id === "persona-cs-student") || basePersona;
  } else if (text.includes("ai") || text.includes("llm") || text.includes("agent") || text.includes("deep learning") || text.includes("machine learning")) {
    basePersona = PERSONAS_CATALOG.find((p) => p.id === "persona-ai-builder") || basePersona;
  } else if (text.includes("mobile") || text.includes("android") || text.includes("flutter") || text.includes("react native") || text.includes("ios")) {
    basePersona = PERSONAS_CATALOG.find((p) => p.id === "persona-mobile-dev") || basePersona;
  } else if (text.includes("video") || text.includes("premiere") || text.includes("after effects") || text.includes("editing") || text.includes("youtube")) {
    basePersona = PERSONAS_CATALOG.find((p) => p.id === "persona-video-editor") || basePersona;
  } else if (text.includes("3d") || text.includes("blender") || text.includes("unreal") || text.includes("game dev") || text.includes("maya")) {
    basePersona = PERSONAS_CATALOG.find((p) => p.id === "persona-3d-artist") || basePersona;
  }

  // Extract budget if mentioned (e.g., "$1200", "5000 nis", "₪7500", "2000 euro", "budget of 1200")
  let budget: { amount: number; currency: string } | undefined;
  
  // Regex: Find currency symbols or keywords adjacent to numbers
  const symbolPrefixMatch = prompt.match(/(?:₪|\$|€)\s*(\d+)/i);
  const suffixMatch = prompt.match(/(\d+)\s*(?:₪|\$|€|ils|usd|eur|shekels|dollars|nis)/i);
  const budgetWordMatch = prompt.match(/budget\s*(?:of|is|around|:)?\s*(?:₪|\$|€)?\s*(\d+)/i);

  const matchedRaw = symbolPrefixMatch?.[1] || suffixMatch?.[1] || budgetWordMatch?.[1];
  if (matchedRaw) {
    const rawVal = parseInt(matchedRaw, 10);
    if (rawVal > 100 && rawVal <= 100000) {
      let currency = "USD";
      if (prompt.includes("₪") || text.includes("ils") || text.includes("nis") || text.includes("shekel")) {
        currency = "ILS";
      } else if (prompt.includes("€") || text.includes("eur") || text.includes("euro")) {
        currency = "EUR";
      }
      budget = { amount: rawVal, currency };
    }
  }

  // Extract target longevity (e.g. "last 4 years", "4 years", "3 yrs")
  let targetLongevityYears = 3;
  const longevityMatch = text.match(/(\d+)\s*(?:years|yrs|year)/);
  if (longevityMatch && longevityMatch[1]) {
    const parsedYears = parseInt(longevityMatch[1], 10);
    if (parsedYears >= 1 && parsedYears <= 8) {
      targetLongevityYears = parsedYears;
    }
  }

  // Customize workloads based on explicit keywords
  const workloads: WorkloadItem[] = [...basePersona.typicalWorkloads];

  if (text.includes("docker") && !workloads.some((w) => w.softwareName.toLowerCase().includes("docker"))) {
    workloads.push({
      softwareId: "soft-docker",
      softwareName: "Docker Desktop (Containers)",
      intensity: "heavy",
      concurrencyGroup: "usually_together",
      quantity: 5,
    });
  }

  if (text.includes("chrome") || text.includes("tabs")) {
    const tabMatch = text.match(/(\d+)\s*tabs/);
    const tabCount = tabMatch ? parseInt(tabMatch[1], 10) : 30;
    const existing = workloads.find((w) => w.softwareName.toLowerCase().includes("chrome"));
    if (existing) {
      existing.notes = `${tabCount}+ active browser tabs + DevTools`;
      existing.intensity = tabCount > 40 ? "extreme" : "heavy";
    }
  }

  // Agentic profile extraction
  let agentProfile: AgentWorkloadProfile | undefined = basePersona.defaultAgentProfile;
  if (text.includes("agent") || text.includes("coding agent") || text.includes("copilot") || text.includes("cline") || text.includes("aider")) {
    agentProfile = {
      llmModelId: "qwen2.5-coder-14b",
      modelName: "Qwen 2.5 Coder 14B Q4",
      quantization: "Q4_K_M",
      contextLengthTokens: 16384,
      concurrentAgents: text.includes("multiple agents") || text.includes("swarm") ? 3 : 1,
      includesEmbeddingModel: true,
      includesVectorDb: true,
      includesDockerContainers: 4,
      includesBrowserAutomation: text.includes("browser") || text.includes("web search"),
      includesMcpToolServers: 3,
      executionPreference: "HYBRID_PREFERRED",
    };
  }

  return {
    id: `profile-${Date.now()}`,
    personaId: basePersona.id,
    primaryGoal: prompt,
    budget,
    targetLongevityYears,
    weights: {
      ...basePersona.weights,
      portabilityWeight: text.includes("laptop") || text.includes("portable") || text.includes("travel") ? 5 : basePersona.weights.portabilityWeight,
      batteryLife: text.includes("battery") ? 5 : basePersona.weights.batteryLife,
      quietOperation: text.includes("quiet") || text.includes("silent") ? 5 : basePersona.weights.quietOperation,
      localAi: text.includes("local ai") || text.includes("ollama") ? 5 : basePersona.weights.localAi,
    },
    workloads,
    agentProfile,
  };
}
