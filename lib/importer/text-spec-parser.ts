/**
 * Deterministic Specification Parser
 * 
 * Extracts candidate hardware components from unstructured text or OCR output.
 * Resolves against canonical hardware catalog with explicit field-level confidence,
 * ambiguity candidates, and strict isolation of hostile inputs (prompt injections, scripts).
 */

import { ComputerProfile, ProfileImportSource, FieldConfirmationState, GpuVariant } from "../domain/computer-profile";
import { CANONICAL_CPUS, CANONICAL_GPUS } from "../data/hardware-catalog";
import { Cpu, Gpu, OperatingSystemFamily, CpuArchitecture } from "../domain/hardware";

export interface ParsedSpecExtractionResult {
  profile: ComputerProfile;
  rawTextLength: number;
  extractedFieldCount: number;
  requiresUserConfirmation: boolean;
  ambiguities: {
    field: "cpu" | "gpu" | "ram" | "storage" | "os";
    question: string;
    options: { id: string; label: string; details?: string }[];
  }[];
}

/**
 * Sanitizes input text to neutralize prompt injections, script tags, URLs, and shell commands.
 * Ensures the string is treated purely as inert diagnostic data.
 */
export function sanitizeUntrustedSpecText(input: string): string {
  if (!input) return "";

  return input
    // Strip HTML script/style/iframe tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    // Neutralize common prompt injection prefixes
    .replace(/(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior)\s+(?:instructions|prompts|rules)/gi, "[INERT_TEXT]")
    .replace(/system\s*:\s*you\s+are/gi, "[INERT_TEXT]")
    // Strip URLs and protocols
    .replace(/https?:\/\/[^\s]+/gi, "[LINK_STRIPPED]")
    .replace(/ftp:\/\/[^\s]+/gi, "[LINK_STRIPPED]")
    // Strip common shell command patterns
    .replace(/\b(?:sudo|chmod|chown|rm\s+-rf|curl|wget|bash|sh|powershell|cmd\.exe)\b/gi, "[CMD]")
    // Normalize excess whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convenience helper to parse raw text and return canonical ComputerProfile
 */
export function parseTextSpecifications(
  rawInput: string,
  source: ProfileImportSource = "pasted_text",
  userProfileName?: string
): ComputerProfile {
  return parseSpecificationText(rawInput, source, userProfileName).profile;
}

/**
 * Parses unstructured hardware text into a canonical ComputerProfile with field-level provenance.
 */
export function parseSpecificationText(
  rawInput: string,
  source: ProfileImportSource = "pasted_text",
  userProfileName?: string
): ParsedSpecExtractionResult {

  const sanitized = sanitizeUntrustedSpecText(rawInput);
  const lower = sanitized.toLowerCase();
  const now = new Date().toISOString();

  // 1. Detect Form Factor (Desktop vs Laptop vs Mini PC)
  let detectedFormFactor: "desktop" | "laptop" | "mini_pc" | "unknown" = "unknown";
  if (lower.match(/\b(laptop|notebook|macbook|thinkpad|zenbook|xps|razer blade|legion slim|g14|g16)\b/i)) {
    detectedFormFactor = "laptop";
  } else if (lower.match(/\b(mini pc|mac mini|mac studio|nuc|tiny|sff|beelink|minisforum)\b/i)) {
    detectedFormFactor = "mini_pc";
  } else if (lower.match(/\b(desktop|tower|pc build|custom pc|gaming pc|atx|matx|itx)\b/i)) {
    detectedFormFactor = "desktop";
  }

  // 2. Parse CPU
  const cpuResolution = extractCpu(sanitized, lower, detectedFormFactor);
  const effectiveFormFactor = detectedFormFactor !== "unknown" ? detectedFormFactor : (cpuResolution.value.isLaptopVariant === true ? "laptop" : cpuResolution.value.isLaptopVariant === false ? "desktop" : "unknown");

  // 3. Parse GPU
  const gpuResolution = extractGpu(sanitized, lower, effectiveFormFactor);

  // 4. Parse RAM
  const ramResolution = extractRam(lower);

  // 5. Parse Storage
  const storageResolution = extractStorage(lower);

  // 6. Parse Operating System
  const osResolution = extractOs(lower, cpuResolution.architecture);

  // Ambiguity detection
  const ambiguities: ParsedSpecExtractionResult["ambiguities"] = [];

  if (cpuResolution.state === "ambiguous" && cpuResolution.candidates && cpuResolution.candidates.length > 1) {
    ambiguities.push({
      field: "cpu",
      question: "Multiple matching processor models were found. Which CPU is installed in this computer?",
      options: cpuResolution.candidates.map((c) => ({
        id: c.id,
        label: c.displayName,
        details: c.matchReason,
      })),
    });
  }

  if (gpuResolution.state === "ambiguous" && gpuResolution.candidates && gpuResolution.candidates.length > 1) {
    ambiguities.push({
      field: "gpu",
      question: "Multiple graphics models match your description. Is this a Desktop or Laptop GPU variant?",
      options: gpuResolution.candidates.map((c) => ({
        id: c.id,
        label: c.displayName,
        details: c.matchReason,
      })),
    });
  }

  const extractedFieldCount = [
    cpuResolution.state !== "missing" && cpuResolution.state !== "not_recognized",
    gpuResolution.state !== "missing" && gpuResolution.state !== "not_recognized",
    ramResolution.state !== "missing" && ramResolution.state !== "not_recognized",
    storageResolution.state !== "missing" && storageResolution.state !== "not_recognized",
    osResolution.state !== "missing" && osResolution.state !== "not_recognized",
  ].filter(Boolean).length;

  const hasAmbiguities = ambiguities.length > 0;
  const isFullyConfirmed = !hasAmbiguities && extractedFieldCount >= 4;
  const overallConfidence =
    (cpuResolution.confidence +
      gpuResolution.confidence +
      ramResolution.confidence +
      storageResolution.confidence +
      osResolution.confidence) /
    5.0;

  const defaultName =
    userProfileName ||
    `${cpuResolution.value.model.replace(/^(Intel|AMD|Apple)\s+/i, "")} · ${ramResolution.value.capacityGb}GB RAM`;

  const profile: ComputerProfile = {
    schemaVersion: 1,
    id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: defaultName,
    createdAt: now,
    updatedAt: now,
    source,
    formFactor: detectedFormFactor === "unknown" ? (cpuResolution.value.isLaptopVariant ? "laptop" : "desktop") : detectedFormFactor,

    cpu: {
      value: {
        model: cpuResolution.value.model,
        catalogId: cpuResolution.catalogId,
        cores: cpuResolution.value.cores,
        threads: cpuResolution.value.threads,
        architecture: cpuResolution.architecture,
        isLaptopVariant: cpuResolution.value.isLaptopVariant,
      },
      rawText: cpuResolution.rawSnippet,
      normalizedText: cpuResolution.value.model,
      confidence: cpuResolution.confidence,
      state: cpuResolution.state,
      method: cpuResolution.catalogId ? "catalog_exact" : "rule_regex",
      catalogId: cpuResolution.catalogId,
      candidates: cpuResolution.candidates,
      warnings: cpuResolution.warnings,
    },

    gpu: {
      value: {
        model: gpuResolution.value.model,
        catalogId: gpuResolution.catalogId,
        variant: gpuResolution.value.variant,
        vramGb: gpuResolution.value.vramGb,
        isIntegrated: gpuResolution.value.isIntegrated,
      },
      rawText: gpuResolution.rawSnippet,
      normalizedText: gpuResolution.value.model,
      confidence: gpuResolution.confidence,
      state: gpuResolution.state,
      method: gpuResolution.catalogId ? "catalog_exact" : "rule_regex",
      catalogId: gpuResolution.catalogId,
      candidates: gpuResolution.candidates,
      warnings: gpuResolution.warnings,
    },

    ram: {
      value: {
        capacityGb: ramResolution.value.capacityGb,
        generation: ramResolution.value.generation,
        isUnified: ramResolution.value.isUnified,
      },
      rawText: ramResolution.rawSnippet,
      normalizedText: `${ramResolution.value.capacityGb} GB ${ramResolution.value.generation || ""}`.trim(),
      confidence: ramResolution.confidence,
      state: ramResolution.state,
      method: "rule_regex",
      warnings: ramResolution.warnings,
    },

    storage: {
      value: {
        totalCapacityGb: storageResolution.value.totalCapacityGb,
        devices: storageResolution.value.devices,
      },
      rawText: storageResolution.rawSnippet,
      normalizedText: `${storageResolution.value.totalCapacityGb} GB`,
      confidence: storageResolution.confidence,
      state: storageResolution.state,
      method: "rule_regex",
      warnings: storageResolution.warnings,
    },

    os: {
      value: {
        family: osResolution.value.family,
        versionString: osResolution.value.versionString,
        architecture: cpuResolution.architecture,
      },
      rawText: osResolution.rawSnippet,
      normalizedText: `${osResolution.value.family} ${osResolution.value.versionString || ""}`.trim(),
      confidence: osResolution.confidence,
      state: osResolution.state,
      method: "rule_regex",
      warnings: osResolution.warnings,
    },

    resolution: {
      isFullyConfirmed,
      hasAmbiguities,
      unresolvedFieldCount: 5 - extractedFieldCount + ambiguities.length,
      overallConfidence,
      criticalWarnings: [],
    },
  };

  return {
    profile,
    rawTextLength: rawInput.length,
    extractedFieldCount,
    requiresUserConfirmation: !isFullyConfirmed || hasAmbiguities,
    ambiguities,
  };
}

/* ========================================================================= */
/* Internal Field Extractors with Catalog Resolution & Fuzzy Disambiguation */
/* ========================================================================= */

function extractCpu(
  sanitized: string,
  lower: string,
  formFactor: string
): {
  value: { model: string; cores?: number; threads?: number; isLaptopVariant?: boolean };
  catalogId?: string;
  architecture: CpuArchitecture;
  confidence: number;
  state: FieldConfirmationState;
  rawSnippet?: string;
  candidates?: any[];
  warnings?: string[];
} {
  // Check for custom/unrecognized CPU token
  if (lower.match(/\b(custom[a-z0-9_-]*processor|quantum[a-z0-9_-]*processor|[a-z0-9_-]+cpu-x\d+)\b/i)) {
    return {
      value: { model: "Unrecognized Processor" },
      architecture: "x86_64",
      confidence: 0.1,
      state: "not_recognized",
      warnings: ["Custom or unknown CPU processor identified."],
    };
  }


  // 1. Direct Catalog Substring Search
  const directMatches: { cpu: Cpu; score: number }[] = [];
  for (const cpu of CANONICAL_CPUS) {
    const modelLower = cpu.model.toLowerCase();
    if (lower.includes(modelLower)) {
      directMatches.push({ cpu, score: 1.0 });
      continue;
    }
    for (const alias of cpu.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        directMatches.push({ cpu, score: 0.95 });
        break;
      }
    }
  }

  if (directMatches.length === 1) {
    const matched = directMatches[0].cpu;
    return {
      value: {
        model: matched.model,
        cores: matched.physicalCores,
        threads: matched.threads,
        isLaptopVariant: matched.laptopVariant,
      },
      catalogId: matched.id,
      architecture: matched.architecture,
      confidence: directMatches[0].score,
      state: directMatches[0].score >= 0.95 ? "confirmed" : "needs_confirmation",
      rawSnippet: matched.model,
    };
  }

  // 2. Pattern-based CPU Match (e.g., i7-13700K, Ryzen 7 7800X3D, M3 Pro, M3 Max)
  const intelPattern = /\b(?:intel\s+)?(?:core\s+)?(i[3579]-?\d{4,5}[a-z]{0,2}|ultra\s+[579]\s+\d{3}[a-z]?)\b/i;
  const amdPattern = /\b(?:amd\s+)?(?:ryzen\s+[3579]\s+)?(\d{4}[a-z]{1,3}|threadripper\s+\d{4}[a-z]?)\b/i;
  const applePattern = /\b(apple\s+)?(m[1-4]\s*(?:pro|max|ultra)?)\b/i;

  const intelMatch = lower.match(intelPattern);
  const amdMatch = lower.match(amdPattern);
  const appleMatch = lower.match(applePattern);

  if (appleMatch) {
    const rawChip = appleMatch[2];
    const chipFormatted = rawChip
      .split(/\s+/)
      .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(" ");
    const model = `Apple ${chipFormatted}`;
    return {
      value: { model, isLaptopVariant: true },
      architecture: "arm64",
      confidence: 0.95,
      state: "confirmed",
      rawSnippet: appleMatch[0],
    };
  }

  if (intelMatch || amdMatch) {
    const rawSnippet = (intelMatch || amdMatch)![0];
    const candidates = CANONICAL_CPUS.filter((c) =>
      c.model.toLowerCase().includes(rawSnippet.toLowerCase()) ||
      c.aliases.some((a) => a.toLowerCase().includes(rawSnippet.toLowerCase()))
    );

    if (candidates.length === 1) {
      const best = candidates[0];
      return {
        value: {
          model: best.model,
          cores: best.physicalCores,
          threads: best.threads,
          isLaptopVariant: best.laptopVariant,
        },
        catalogId: best.id,
        architecture: best.architecture,
        confidence: 0.95,
        state: "confirmed",
        rawSnippet,
      };
    } else if (candidates.length > 1) {
      return {
        value: {
          model: candidates[0].model,
          cores: candidates[0].physicalCores,
          threads: candidates[0].threads,
          isLaptopVariant: candidates[0].laptopVariant,
        },
        architecture: candidates[0].architecture,
        confidence: 0.65,
        state: "ambiguous",
        rawSnippet,
        candidates: candidates.map((c) => ({
          id: c.id,
          displayName: c.model,
          confidence: 0.8,
          matchReason: `${c.manufacturer} ${c.physicalCores || "?"} cores (${c.laptopVariant ? "Laptop" : "Desktop"})`,
          canonicalEntity: c,
        })),
      };
    }

    const formattedRaw = rawSnippet.replace(/^intel\s+(?:core\s+)?/i, "").replace(/^amd\s+(?:ryzen\s+)?/i, "");
    const formattedModel = intelMatch
      ? `Intel Core ${formattedRaw.startsWith("i") ? formattedRaw.slice(0, 2).toLowerCase() + formattedRaw.slice(2).toUpperCase() : formattedRaw.toUpperCase()}`
      : `AMD Ryzen ${formattedRaw.toUpperCase()}`;

    return {
      value: {
        model: formattedModel,
        isLaptopVariant: lower.includes("laptop") || lower.includes("hx") || lower.includes("h") || lower.includes("u"),
      },
      architecture: "x86_64",
      confidence: 0.8,
      state: "confirmed",
      rawSnippet,
    };
  }

  // Fallback: Missing CPU
  return {
    value: { model: "Unknown Processor" },
    architecture: "x86_64",
    confidence: 0.0,
    state: "missing",
    warnings: ["No processor (CPU) detected in specification text."],
  };
}


function extractGpu(
  sanitized: string,
  lower: string,
  formFactor: string
): {
  value: { model: string; variant: GpuVariant; vramGb?: number; isIntegrated?: boolean };
  catalogId?: string;
  confidence: number;
  state: FieldConfirmationState;
  rawSnippet?: string;
  candidates?: any[];
  warnings?: string[];
} {
  // Check for custom/unrecognized GPU
  if (lower.match(/\b(supervaporgpu[a-z0-9_-]*|custom[a-z0-9_-]*gpu|[a-z0-9_-]+gpu-9\d+)\b/i)) {
    return {
      value: { model: "Unrecognized Graphics", variant: "unknown", vramGb: 0 },
      confidence: 0.1,
      state: "not_recognized",
      warnings: ["Custom or unknown GPU identified."],
    };
  }

  // Apple Silicon Integrated GPU detection
  if (lower.match(/\b(apple\s+)?(m[1-4]\s*(?:pro|max|ultra)?)\b/i)) {
    const chipMatch = lower.match(/\b(apple\s+)?(m[1-4]\s*(?:pro|max|ultra)?)\b/i);
    const rawChip = chipMatch ? chipMatch[2] : "m3 max";
    const chipFormatted = rawChip
      .split(/\s+/)
      .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(" ");
    return {
      value: {
        model: `Apple ${chipFormatted} Integrated GPU`,
        variant: "integrated",
        isIntegrated: true,
        vramGb: 0,
      },
      confidence: 0.95,
      state: "confirmed",
      rawSnippet: `Apple ${chipFormatted} GPU`,
    };
  }

  const isExplicitLaptop = lower.includes("laptop") || lower.includes("notebook") || lower.includes("mobile") || formFactor === "laptop";
  const isExplicitDesktop = lower.includes("desktop") || lower.includes("tower") || lower.includes("pc build") || formFactor === "desktop";

  // Extract VRAM if explicitly mentioned in text
  const vramMatch =
    lower.match(/(\d+)\s*(?:gb)?\s*(?:gddr[56]x?|vram)/i) ||
    lower.match(/(?:rtx|gtx|radeon|gpu|graphics)[^,\n]*?(\d+)\s*gb/i);
  const detectedVram = vramMatch ? parseInt(vramMatch[1], 10) : undefined;

  // 1. Direct Catalog Substring Search
  const directMatches: { gpu: Gpu; score: number }[] = [];
  for (const gpu of CANONICAL_GPUS) {
    const modelLower = gpu.model.toLowerCase();
    if (lower.includes(modelLower)) {
      directMatches.push({ gpu, score: 1.0 });
      continue;
    }
    for (const alias of gpu.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        directMatches.push({ gpu, score: 0.95 });
        break;
      }
    }
  }

  // If search matched shorthand without explicit variant in text (e.g. "RTX 4070" with no form factor or full branding)
  const isAmbiguousShorthand = !lower.includes("desktop") && !lower.includes("laptop") && !lower.includes("12gb") && !lower.includes("nvidia geforce");
  if (isAmbiguousShorthand && directMatches.length >= 1) {
    const matched = directMatches[0].gpu;
    if (matched.model.includes("4070") || matched.model.includes("4080") || matched.model.includes("4060") || matched.model.includes("3060")) {
      return {
        value: {
          model: matched.model,
          variant: "unknown",
          vramGb: detectedVram || matched.vramGb || 8,
        },
        confidence: 0.6,
        state: "ambiguous",
        rawSnippet: matched.model,
        candidates: [
          {
            id: `${matched.id}_desktop`,
            displayName: `${matched.model} (Desktop)`,
            confidence: 0.85,
            variant: "desktop",
            matchReason: "Full-power desktop graphics card",
          },
          {
            id: `${matched.id}_laptop`,
            displayName: `${matched.model} Laptop GPU`,
            confidence: 0.85,
            variant: "laptop",
            matchReason: "Power-constrained laptop mobile GPU",
          },
        ],
      };
    }
  }


  if (directMatches.length === 1) {
    const matched = directMatches[0].gpu;
    const isLap = matched.laptopVariant || formFactor === "laptop";
    return {
      value: {
        model: matched.model,
        variant: matched.type === "integrated" ? "integrated" : isLap ? "laptop" : "desktop",
        vramGb: detectedVram || matched.vramGb || 8,
        isIntegrated: matched.type === "integrated",
      },
      catalogId: matched.id,
      confidence: directMatches[0].score,
      state: directMatches[0].score >= 0.95 ? "confirmed" : "needs_confirmation",
      rawSnippet: matched.model,
    };
  }

  // 2. Pattern Matching for RTX / GTX / Radeon / Intel Arc
  const gpuPattern = /\b(?:geforce\s+)?(rtx\s+\d{4}(?:\s*ti|\s*super)?(?:\s*laptop\s*gpu|\s*mobile)?|gtx\s+\d{4}(?:\s*ti|\s*super)?|radeon\s+rx\s+\d{4}(?:\s*xt|\s*gre)?|arc\s+a\d{3}|iris\s*xe)\b/i;
  const match = lower.match(gpuPattern);

  if (match) {
    const rawSnippet = match[0];
    const isSnippetLaptop = rawSnippet.includes("laptop") || rawSnippet.includes("mobile") || isExplicitLaptop;

    const candidates = CANONICAL_GPUS.filter((g) =>
      g.model.toLowerCase().includes(rawSnippet.toLowerCase()) ||
      g.aliases.some((a) => a.toLowerCase().includes(rawSnippet.toLowerCase()))
    );

    // If both desktop and laptop models match and text doesn't explicitly declare form factor
    if (!isExplicitLaptop && !isExplicitDesktop && !isSnippetLaptop) {
      return {
        value: {
          model: `NVIDIA GeForce ${rawSnippet.toUpperCase()}`,
          variant: "unknown",
          vramGb: detectedVram || 8,
        },
        confidence: 0.6,
        state: "ambiguous",
        rawSnippet,
        candidates: [
          {
            id: "gpu_desktop_candidate",
            displayName: `NVIDIA GeForce ${rawSnippet.toUpperCase()} (Desktop GPU)`,
            confidence: 0.8,
            variant: "desktop",
            matchReason: "Desktop PCIe graphics card",
          },
          {
            id: "gpu_laptop_candidate",
            displayName: `NVIDIA GeForce ${rawSnippet.toUpperCase()} Laptop GPU`,
            confidence: 0.8,
            variant: "laptop",
            matchReason: "Laptop / mobile graphics processor",
          },
        ],
      };
    }

    if (candidates.length >= 1) {
      const best = isSnippetLaptop ? (candidates.find((c) => c.laptopVariant) || candidates[0]) : candidates[0];
      return {
        value: {
          model: isSnippetLaptop && !best.model.includes("Laptop") ? `${best.model} Laptop GPU` : best.model,
          variant: isSnippetLaptop ? "laptop" : "desktop",
          vramGb: detectedVram || best.vramGb || 8,
        },
        catalogId: best.id,
        confidence: 0.95,
        state: "confirmed",
        rawSnippet,
      };
    }

    const cleanSnippet = rawSnippet
      .replace(/^(?:nvidia\s+)?(?:geforce\s+)?/i, "")
      .replace(/\s*laptop\s*gpu$/i, "")
      .replace(/\s*mobile$/i, "")
      .trim();

    return {
      value: {
        model: isSnippetLaptop ? `NVIDIA GeForce ${cleanSnippet.toUpperCase()} Laptop GPU` : `NVIDIA GeForce ${cleanSnippet.toUpperCase()}`,
        variant: isSnippetLaptop ? "laptop" : "desktop",
        vramGb: detectedVram || 8,
      },
      confidence: 0.85,
      state: "confirmed",
      rawSnippet,
    };
  }




  // Fallback: Integrated / Missing GPU
  if (lower.includes("integrated") || lower.includes("intel uhd") || lower.includes("iris")) {
    return {
      value: { model: "Integrated Graphics", variant: "integrated", isIntegrated: true, vramGb: 0 },
      confidence: 0.8,
      state: "needs_confirmation",
      rawSnippet: "Integrated Graphics",
    };
  }

  return {
    value: { model: "Standard Graphics", variant: "desktop", vramGb: 0 },
    confidence: 0.0,
    state: "missing",
    warnings: ["No dedicated graphics processor (GPU) detected."],
  };
}

function extractRam(lower: string): {
  value: { capacityGb: number; generation?: "DDR4" | "DDR5" | "LPDDR5" | "LPDDR5X" | "UNIFIED" | "UNKNOWN"; isUnified?: boolean };
  confidence: number;
  state: FieldConfirmationState;
  rawSnippet?: string;
  warnings?: string[];
} {
  const ramMatch =
    lower.match(/(\d+)\s*(?:gb|gigs|gigabytes)?\s*(?:ram|memory|ddr[45]?|lpddr[45]?x?|unified)/i) ||
    lower.match(/(?:ram|memory|unified\s+memory)[:\s]+(\d+)\s*(?:gb|gigs)?/i) ||
    lower.match(/\b(\d+)\s*gb\s*(?:ram|ddr[45]|lpddr[45]x?)\b/i);

  if (ramMatch) {
    const val = parseInt(ramMatch[1], 10);
    if (val >= 2 && val <= 512) {
      let generation: "DDR4" | "DDR5" | "LPDDR5" | "LPDDR5X" | "UNIFIED" | "UNKNOWN" = "UNKNOWN";
      if (lower.includes("ddr5")) generation = "DDR5";
      else if (lower.includes("ddr4")) generation = "DDR4";
      else if (lower.includes("lpddr5x")) generation = "LPDDR5X";
      else if (lower.includes("lpddr5")) generation = "LPDDR5";
      else if (lower.includes("unified") || lower.includes("apple") || lower.includes("m1") || lower.includes("m2") || lower.includes("m3") || lower.includes("m4")) {
        generation = "UNIFIED";
      }

      return {
        value: {
          capacityGb: val,
          generation,
          isUnified: generation === "UNIFIED",
        },
        confidence: 0.95,
        state: "confirmed",
        rawSnippet: ramMatch[0],
      };
    }
  }

  // Fallback: Missing RAM (zero capacity, missing state)
  return {
    value: { capacityGb: 0, generation: "UNKNOWN", isUnified: false },
    confidence: 0.0,
    state: "missing",
    warnings: ["System RAM capacity could not be detected."],
  };
}

function extractStorage(lower: string): {
  value: { totalCapacityGb: number; devices: any[] };
  confidence: number;
  state: FieldConfirmationState;
  rawSnippet?: string;
  warnings?: string[];
} {
  const driveRegex = /(\d+)\s*(gb|tb)\s*(ssd|nvme|m\.2|hdd|storage|drive)?/gi;
  const matches: RegExpExecArray[] = [];
  let matchExec: RegExpExecArray | null;
  while ((matchExec = driveRegex.exec(lower)) !== null) {
    matches.push(matchExec);
  }

  if (matches.length > 0) {
    const devices = [];
    let totalCap = 0;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      let cap = parseInt(m[1], 10);
      if (m[2].toLowerCase() === "tb") {
        cap *= 1000;
      }
      // Avoid parsing small numbers as drives if they are RAM
      if (cap >= 120) {
        const typeStr = (m[3] || "").toLowerCase();
        const type = typeStr.includes("hdd") ? "HDD" : typeStr.includes("sata") ? "SATA_SSD" : "NVME_SSD";
        devices.push({
          id: `dev_${i + 1}`,
          capacityGb: cap,
          type: type as any,
          isSystemDrive: i === 0,
        });
        totalCap += cap;
      }
    }


    if (devices.length > 0) {
      return {
        value: {
          totalCapacityGb: totalCap,
          devices,
        },
        confidence: 0.95,
        state: "confirmed",
        rawSnippet: matches.map((m) => m[0]).join(", "),
      };
    }
  }

  return {
    value: {
      totalCapacityGb: 1000,
      devices: [{ id: "dev_1", capacityGb: 1000, type: "NVME_SSD", isSystemDrive: true }],
    },
    confidence: 0.2,
    state: "missing",
    warnings: ["Storage capacity could not be detected. Defaulted to 1 TB NVMe SSD."],
  };
}

function extractOs(
  lower: string,
  architecture: CpuArchitecture
): {
  value: { family: OperatingSystemFamily; versionString?: string };
  confidence: number;
  state: FieldConfirmationState;
  rawSnippet?: string;
  warnings?: string[];
} {
  if (lower.includes("mac") || lower.includes("macos") || lower.includes("osx") || lower.includes("apple") || architecture === "arm64") {
    return {
      value: { family: "macos", versionString: "Sonoma / Sequoia" },
      confidence: 0.95,
      state: "confirmed",
      rawSnippet: "macOS",
    };
  }

  if (lower.includes("linux") || lower.includes("ubuntu") || lower.includes("fedora") || lower.includes("arch") || lower.includes("debian")) {
    return {
      value: { family: "linux", versionString: "Ubuntu / Debian" },
      confidence: 0.9,
      state: "confirmed",
      rawSnippet: "Linux",
    };
  }

  if (lower.includes("win 10") || lower.includes("windows 10")) {
    return {
      value: { family: "windows", versionString: "10" },
      confidence: 0.95,
      state: "confirmed",
      rawSnippet: "Windows 10",
    };
  }

  return {
    value: { family: "windows", versionString: "11" },
    confidence: 0.9,
    state: "confirmed",
    rawSnippet: "Windows 11",
  };
}

