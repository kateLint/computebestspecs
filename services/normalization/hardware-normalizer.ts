import { Cpu, Gpu, CpuManufacturer, GpuManufacturer } from "../../lib/domain/hardware";

export type ResolutionStatus = "EXACT" | "HIGH_CONFIDENCE" | "AMBIGUOUS" | "NOT_FOUND";

export interface HardwareCandidate<T> {
  entity: T;
  confidence: number;
  matchReason: string;
}

export interface ResolutionResult<T> {
  status: ResolutionStatus;
  confidence: number;
  canonicalEntity?: T;
  candidates: HardwareCandidate<T>[];
  normalizedQuery: string;
  detectedVendor?: string;
  detectedFamily?: string;
  detectedVariant?: string;
  isAmbiguous: boolean;
}

export interface TokenizedQuery {
  raw: string;
  clean: string;
  tokens: string[];
  vendor?: CpuManufacturer | GpuManufacturer;
  family?: string;
  modelNumber?: string;
  suffix?: string;
  isLaptop: boolean;
  isDesktop: boolean;
}

export function tokenizeHardwareQuery(rawQuery: string): TokenizedQuery {
  const clean = rawQuery
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\-\.]/g, " ")
    .replace(/\s+/g, " ");

  const tokens = clean.split(" ").filter(Boolean);

  let vendor: CpuManufacturer | GpuManufacturer | undefined;
  if (tokens.some(t => t.includes("intel"))) vendor = "Intel";
  else if (tokens.some(t => t.includes("amd") || t.includes("ryzen") || t.includes("radeon"))) vendor = "AMD";
  else if (tokens.some(t => t.includes("nvidia") || t.includes("geforce") || t.includes("rtx") || t.includes("gtx"))) vendor = "NVIDIA";
  else if (tokens.some(t => t.includes("apple") || t.match(/^m[1-4]/))) vendor = "Apple";
  else if (tokens.some(t => t.includes("snapdragon") || t.includes("qualcomm"))) vendor = "Qualcomm";

  const isLaptop = tokens.some(t =>
    ["laptop", "mobile", "notebook", "max-q", "mq"].includes(t) ||
    t.endsWith("h") || t.endsWith("hx") || t.endsWith("hs") || t.endsWith("u")
  );
  const isDesktop = tokens.some(t =>
    ["desktop", "k", "kf", "non-k", "x", "x3d"].includes(t) && !isLaptop
  );

  let family: string | undefined;
  if (clean.includes("core i9") || clean.includes("i9")) family = "Core i9";
  else if (clean.includes("core i7") || clean.includes("i7")) family = "Core i7";
  else if (clean.includes("core i5") || clean.includes("i5")) family = "Core i5";
  else if (clean.includes("core i3") || clean.includes("i3")) family = "Core i3";
  else if (clean.includes("ryzen 9") || clean.includes("r9")) family = "Ryzen 9";
  else if (clean.includes("ryzen 7") || clean.includes("r7")) family = "Ryzen 7";
  else if (clean.includes("ryzen 5") || clean.includes("r5")) family = "Ryzen 5";
  else if (clean.includes("ryzen 3") || clean.includes("r3")) family = "Ryzen 3";
  else if (clean.includes("rtx 40") || clean.includes("rtx40") || clean.includes("4090") || clean.includes("4080") || clean.includes("4070") || clean.includes("4060") || clean.includes("4050")) family = "RTX 40 Series";
  else if (clean.includes("rtx 30") || clean.includes("rtx30") || clean.includes("3090") || clean.includes("3080") || clean.includes("3070") || clean.includes("3060") || clean.includes("3050")) family = "RTX 30 Series";

  const modelMatch = clean.match(/(?:rtx|gtx|rx|radeon|core|ryzen|i[3579]-?|r[3579]-?)?\s*(\d{3,5}[a-z0-9]*)/i) ||
                     clean.match(/\b(m[1-4](?:\s*(?:pro|max|ultra))?)\b/i);
  const modelNumber = modelMatch ? modelMatch[1] : undefined;

  return {
    raw: rawQuery,
    clean,
    tokens,
    vendor,
    family,
    modelNumber,
    isLaptop,
    isDesktop,
  };
}

export function normalizeCpuQuery(query: string, catalog: Cpu[]): ResolutionResult<Cpu> {
  const tokenized = tokenizeHardwareQuery(query);
  if (!tokenized.clean) {
    return {
      status: "NOT_FOUND",
      confidence: 0,
      candidates: [],
      normalizedQuery: "",
      isAmbiguous: false,
    };
  }

  // Exact Match Check
  const exactMatch = catalog.find(c =>
    c.model.toLowerCase() === tokenized.clean ||
    c.aliases.some(a => a.toLowerCase() === tokenized.clean)
  );
  if (exactMatch) {
    return {
      status: "EXACT",
      confidence: 1.0,
      canonicalEntity: exactMatch,
      candidates: [{ entity: exactMatch, confidence: 1.0, matchReason: "Exact catalog match" }],
      normalizedQuery: tokenized.clean,
      detectedVendor: exactMatch.manufacturer,
      isAmbiguous: false,
    };
  }

  // Candidate generation & scoring
  const scoredCandidates: HardwareCandidate<Cpu>[] = [];

  for (const cpu of catalog) {
    let score = 0;
    const cpuLower = cpu.model.toLowerCase();

    // Vendor match
    if (tokenized.vendor && cpu.manufacturer.toLowerCase() === tokenized.vendor.toLowerCase()) {
      score += 0.25;
    }

    // Model / Number match
    if (tokenized.modelNumber && cpuLower.includes(tokenized.modelNumber.toLowerCase())) {
      score += 0.50;
    }

    // Form Factor match
    if (tokenized.isLaptop && cpu.laptopVariant) {
      score += 0.20;
    } else if (tokenized.isDesktop && !cpu.laptopVariant) {
      score += 0.20;
    }

    // Alias matching
    for (const alias of cpu.aliases) {
      if (tokenized.clean.includes(alias.toLowerCase()) || alias.toLowerCase().includes(tokenized.clean)) {
        score = Math.max(score, 0.85);
      }
    }

    if (score >= 0.40) {
      scoredCandidates.push({
        entity: cpu,
        confidence: Math.min(0.98, Math.round(score * 100) / 100),
        matchReason: `Matched ${cpu.manufacturer} ${cpu.model} (${cpu.laptopVariant ? "Laptop" : "Desktop"})`,
      });
    }
  }

  scoredCandidates.sort((a, b) => b.confidence - a.confidence);

  if (scoredCandidates.length === 0) {
    return {
      status: "NOT_FOUND",
      confidence: 0,
      candidates: [],
      normalizedQuery: tokenized.clean,
      isAmbiguous: false,
    };
  }

  const top = scoredCandidates[0];
  const second = scoredCandidates[1];

  // Ambiguity detection (§4, §5)
  // If top 2 candidates have close confidence (e.g. 4070 Desktop vs 4070 Laptop), mark AMBIGUOUS
  const isAmbiguous = second && (top.confidence - second.confidence) < 0.15 && top.confidence < 0.95;

  if (isAmbiguous) {
    return {
      status: "AMBIGUOUS",
      confidence: top.confidence * 0.7,
      canonicalEntity: undefined, // Do NOT automatically pick when ambiguous
      candidates: scoredCandidates.slice(0, 5),
      normalizedQuery: tokenized.clean,
      detectedVendor: tokenized.vendor,
      detectedFamily: tokenized.family,
      isAmbiguous: true,
    };
  }

  return {
    status: top.confidence >= 0.80 ? "HIGH_CONFIDENCE" : "AMBIGUOUS",
    confidence: top.confidence,
    canonicalEntity: top.confidence >= 0.80 ? top.entity : undefined,
    candidates: scoredCandidates.slice(0, 5),
    normalizedQuery: tokenized.clean,
    detectedVendor: top.entity.manufacturer,
    isAmbiguous: top.confidence < 0.80,
  };
}

export function normalizeGpuQuery(query: string, catalog: Gpu[]): ResolutionResult<Gpu> {
  const tokenized = tokenizeHardwareQuery(query);
  if (!tokenized.clean) {
    return {
      status: "NOT_FOUND",
      confidence: 0,
      candidates: [],
      normalizedQuery: "",
      isAmbiguous: false,
    };
  }

  const exactMatch = catalog.find(g =>
    g.model.toLowerCase() === tokenized.clean ||
    g.aliases.some(a => a.toLowerCase() === tokenized.clean)
  );
  if (exactMatch) {
    return {
      status: "EXACT",
      confidence: 1.0,
      canonicalEntity: exactMatch,
      candidates: [{ entity: exactMatch, confidence: 1.0, matchReason: "Exact catalog match" }],
      normalizedQuery: tokenized.clean,
      detectedVendor: exactMatch.manufacturer,
      isAmbiguous: false,
    };
  }

  const scoredCandidates: HardwareCandidate<Gpu>[] = [];

  for (const gpu of catalog) {
    let score = 0;
    const gpuLower = gpu.model.toLowerCase();

    if (tokenized.vendor && gpu.manufacturer.toLowerCase() === tokenized.vendor.toLowerCase()) {
      score += 0.25;
    }

    if (tokenized.modelNumber && gpuLower.includes(tokenized.modelNumber.toLowerCase())) {
      score += 0.50;
    }

    // Form Factor match & mismatch penalty
    if (tokenized.isLaptop) {
      if (gpu.laptopVariant) score += 0.25;
      else score -= 0.35; // Mismatch penalty for desktop when user explicitly specified laptop/mobile
    } else if (tokenized.isDesktop) {
      if (!gpu.laptopVariant) score += 0.25;
      else score -= 0.35;
    }

    for (const alias of gpu.aliases) {
      const aliasLower = alias.toLowerCase();
      if (tokenized.clean === aliasLower || tokenized.clean.includes(aliasLower) || aliasLower.includes(tokenized.clean)) {
        score = Math.max(score, 0.90);
        if (tokenized.isLaptop && gpu.laptopVariant) score = Math.max(score, 0.96);
      }
    }

    if (score >= 0.40) {
      scoredCandidates.push({
        entity: gpu,
        confidence: Math.min(0.99, Math.max(0.1, Math.round(score * 100) / 100)),
        matchReason: `Matched ${gpu.manufacturer} ${gpu.model} (${gpu.laptopVariant ? "Laptop" : "Desktop"})`,
      });
    }
  }

  scoredCandidates.sort((a, b) => b.confidence - a.confidence);

  if (scoredCandidates.length === 0) {
    return {
      status: "NOT_FOUND",
      confidence: 0,
      candidates: [],
      normalizedQuery: tokenized.clean,
      isAmbiguous: false,
    };
  }

  const top = scoredCandidates[0];
  const second = scoredCandidates[1];

  // Specific check: query "4070" matches both desktop 4060/4070 and laptop 4070
  const isAmbiguous = second && (top.confidence - second.confidence) < 0.15 && top.confidence < 0.95;

  if (isAmbiguous) {
    return {
      status: "AMBIGUOUS",
      confidence: top.confidence * 0.7,
      canonicalEntity: undefined,
      candidates: scoredCandidates.slice(0, 5),
      normalizedQuery: tokenized.clean,
      detectedVendor: tokenized.vendor,
      detectedFamily: tokenized.family,
      isAmbiguous: true,
    };
  }

  return {
    status: top.confidence >= 0.80 ? "HIGH_CONFIDENCE" : "AMBIGUOUS",
    confidence: top.confidence,
    canonicalEntity: top.confidence >= 0.80 ? top.entity : undefined,
    candidates: scoredCandidates.slice(0, 5),
    normalizedQuery: tokenized.clean,
    detectedVendor: top.entity.manufacturer,
    isAmbiguous: top.confidence < 0.80,
  };
}
