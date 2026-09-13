import { ResolutionResult, normalizeCpuQuery, normalizeGpuQuery, tokenizeHardwareQuery } from "./hardware-normalizer";
import { Cpu, Gpu, CpuArchitecture, OperatingSystemFamily, HardwareProfile } from "../../lib/domain/hardware";

export interface ParsedSpecField<T> {
  raw: string;
  status: "EXACT" | "HIGH_CONFIDENCE" | "AMBIGUOUS" | "NOT_FOUND";
  confidence: number;
  canonicalEntity?: T;
  candidates: { entity: T; confidence: number; matchReason: string }[];
  needsUserClarification: boolean;
}

export interface ParsedNaturalLanguageSpec {
  rawInput: string;
  cpu: ParsedSpecField<Cpu>;
  gpu?: ParsedSpecField<Gpu>;
  ramGb?: {
    raw: string;
    parsedGb: number;
    confidence: number;
  };
  storageGb?: {
    raw: string;
    parsedGb: number;
    isNvme: boolean;
  };
  os?: {
    raw: string;
    family: OperatingSystemFamily;
    architecture: CpuArchitecture;
  };
  isFullyResolved: boolean;
  unresolvedFields: string[];
}

export function parseNaturalLanguagePcSpec(
  input: string,
  cpuCatalog: Cpu[],
  gpuCatalog: Gpu[]
): ParsedNaturalLanguageSpec {
  const cleanInput = input.trim();
  const lower = cleanInput.toLowerCase();

  // 1. Extract RAM
  let ramGb: { raw: string; parsedGb: number; confidence: number } | undefined;
  const ramMatch = lower.match(/(\d+)\s*(?:gb|gig|gigs|gigabytes)?\s*(?:ram|memory|ddr[45]?|lpddr[45]?x?)/i) ||
                   lower.match(/(?:ram|memory)[:\s]+(\d+)\s*(?:gb|gigs)?/i) ||
                   lower.match(/\b(\d+)\s*gb\b/i);
  if (ramMatch) {
    const val = parseInt(ramMatch[1], 10);
    if (val >= 2 && val <= 512) {
      ramGb = {
        raw: ramMatch[0],
        parsedGb: val,
        confidence: 0.95,
      };
    }
  }

  // 2. Extract Storage
  let storageGb: { raw: string; parsedGb: number; isNvme: boolean } | undefined;
  const storageMatch = lower.match(/(\d+)\s*(?:gb|tb)\s*(?:ssd|nvme|hdd|hard\s*drive|storage)/i) ||
                       lower.match(/(?:ssd|nvme|hdd|storage)[:\s]+(\d+)\s*(?:gb|tb)/i);
  if (storageMatch) {
    let num = parseInt(storageMatch[1], 10);
    if (storageMatch[0].includes("tb")) num *= 1024;
    storageGb = {
      raw: storageMatch[0],
      parsedGb: num,
      isNvme: storageMatch[0].includes("nvme") || storageMatch[0].includes("ssd"),
    };
  }

  // 3. Extract OS
  let os: { raw: string; family: OperatingSystemFamily; architecture: CpuArchitecture } | undefined;
  if (lower.includes("mac") || lower.includes("macos") || lower.includes("osx") || lower.includes("apple")) {
    os = { raw: "macOS", family: "macos", architecture: lower.includes("m1") || lower.includes("m2") || lower.includes("m3") || lower.includes("m4") ? "arm64" : "x86_64" };
  } else if (lower.includes("linux") || lower.includes("ubuntu") || lower.includes("fedora") || lower.includes("arch")) {
    os = { raw: "Linux", family: "linux", architecture: "x86_64" };
  } else if (lower.includes("win") || lower.includes("windows")) {
    os = { raw: "Windows", family: "windows", architecture: "x86_64" };
  }

  // 4. Extract CPU & GPU strings by parsing segmented clauses
  // Find GPU mentions
  let rawGpuQuery = "";
  const gpuPattern = /(?:nvidia|geforce|rtx|gtx|radeon|rx|intel\s*(?:arc|iris)|m[1-4]\s*(?:pro|max|ultra)?\s*gpu|graphics)\s*[\w\d\s\-\.]+/i;
  const gpuMatch = lower.match(gpuPattern);
  if (gpuMatch) {
    rawGpuQuery = gpuMatch[0].replace(/(?:with|and|\d+gb\s*ram|\d+tb|\d+gb\s*ssd|windows|macos|linux).*/i, "").trim();
  }

  // Find CPU mentions
  let rawCpuQuery = "";
  const cpuPattern = /(?:intel|amd|ryzen|core\s*i[3579]|i[3579]|apple|snapdragon|m[1-4]|processor|cpu)\s*[\w\d\s\-\.]+/i;
  const cpuMatch = lower.match(cpuPattern);
  if (cpuMatch) {
    rawCpuQuery = cpuMatch[0]
      .replace(/(?:with|and|\d+gb\s*ram|\d+tb|\d+gb\s*ssd|rtx.*|gtx.*|geforce.*|radeon.*|windows|macos|linux).*/i, "")
      .trim();
  }

  // Normalize CPU with Ambiguity Preservation
  let cpuResolution: ResolutionResult<Cpu>;
  if (rawCpuQuery) {
    cpuResolution = normalizeCpuQuery(rawCpuQuery, cpuCatalog);
  } else {
    cpuResolution = { status: "NOT_FOUND", confidence: 0, candidates: [], normalizedQuery: "", isAmbiguous: false };
  }

  const parsedCpu: ParsedSpecField<Cpu> = {
    raw: rawCpuQuery || "unspecified",
    status: cpuResolution.status,
    confidence: cpuResolution.confidence,
    canonicalEntity: cpuResolution.canonicalEntity,
    candidates: cpuResolution.candidates,
    needsUserClarification: cpuResolution.status === "AMBIGUOUS" || cpuResolution.status === "NOT_FOUND",
  };

  // Normalize GPU with Ambiguity Preservation
  let parsedGpu: ParsedSpecField<Gpu> | undefined;
  if (rawGpuQuery) {
    const gpuResolution = normalizeGpuQuery(rawGpuQuery, gpuCatalog);
    parsedGpu = {
      raw: rawGpuQuery,
      status: gpuResolution.status,
      confidence: gpuResolution.confidence,
      canonicalEntity: gpuResolution.canonicalEntity,
      candidates: gpuResolution.candidates,
      needsUserClarification: gpuResolution.status === "AMBIGUOUS",
    };
  }

  const unresolvedFields: string[] = [];
  if (parsedCpu.needsUserClarification) unresolvedFields.push("cpu");
  if (parsedGpu?.needsUserClarification) unresolvedFields.push("gpu");
  if (!ramGb) unresolvedFields.push("ram");

  return {
    rawInput: cleanInput,
    cpu: parsedCpu,
    gpu: parsedGpu,
    ramGb,
    storageGb,
    os,
    isFullyResolved: unresolvedFields.length === 0,
    unresolvedFields,
  };
}

export function parseNaturalLanguageSpec(input: string): {
  confidence: number;
  inferredHardware: HardwareProfile;
  isAmbiguous: boolean;
  needsClarification: boolean;
} {
  const cleanInput = input.trim();
  const lower = cleanInput.toLowerCase();

  // Extract RAM
  let ramGb = 16;
  const ramMatch = lower.match(/(\d+)\s*(?:gb|gig|gigs|gigabytes)?\s*(?:ram|memory|ddr[45]?)/i) ||
                   lower.match(/\b(\d+)\s*gb\b/i);
  if (ramMatch) {
    const val = parseInt(ramMatch[1], 10);
    if (val >= 4 && val <= 256) ramGb = val;
  }

  // Extract GPU
  let gpuModel: string | undefined;
  let vramGb = 4;
  let supportsCuda = false;
  if (lower.includes("4090")) {
    gpuModel = "NVIDIA GeForce RTX 4090";
    vramGb = 24;
    supportsCuda = true;
  } else if (lower.includes("4080")) {
    gpuModel = "NVIDIA GeForce RTX 4080";
    vramGb = 16;
    supportsCuda = true;
  } else if (lower.includes("4070")) {
    gpuModel = lower.includes("laptop") ? "NVIDIA GeForce RTX 4070 Laptop GPU" : "NVIDIA GeForce RTX 4070";
    vramGb = lower.includes("laptop") ? 8 : 12;
    supportsCuda = true;
  } else if (lower.includes("4060")) {
    gpuModel = lower.includes("laptop") ? "NVIDIA GeForce RTX 4060 Laptop GPU" : "NVIDIA GeForce RTX 4060";
    vramGb = 8;
    supportsCuda = true;
  } else if (lower.includes("3060")) {
    gpuModel = "NVIDIA GeForce RTX 3060";
    vramGb = 12;
    supportsCuda = true;
  } else if (lower.includes("3050")) {
    gpuModel = "NVIDIA GeForce RTX 3050 Laptop GPU";
    vramGb = 4;
    supportsCuda = true;
  }

  // Extract CPU
  let cpuModel = "Intel Core i7-13700H";
  let arch: "x86_64" | "arm64" = "x86_64";
  let osFamily: "windows" | "macos" | "linux" = "windows";

  if (lower.includes("m3 pro") || lower.includes("m3pro")) {
    cpuModel = "Apple M3 Pro";
    arch = "arm64";
    osFamily = "macos";
  } else if (lower.includes("m2 ultra") || lower.includes("m2ultra")) {
    cpuModel = "Apple M2 Ultra";
    arch = "arm64";
    osFamily = "macos";
  } else if (lower.includes("m1") || lower.includes("m2") || lower.includes("m3") || lower.includes("apple") || lower.includes("mac")) {
    cpuModel = "Apple M3";
    arch = "arm64";
    osFamily = "macos";
  } else if (lower.includes("ryzen 5") || lower.includes("5600h")) {
    cpuModel = "AMD Ryzen 5 5600H";
  } else if (lower.includes("ryzen 7") || lower.includes("7700")) {
    cpuModel = "AMD Ryzen 7 7700X";
  } else if (lower.includes("ryzen 9") || lower.includes("7950")) {
    cpuModel = "AMD Ryzen 9 7950X";
  } else if (lower.includes("i9") || lower.includes("13900") || lower.includes("14900")) {
    cpuModel = "Intel Core i9-13900K";
  } else if (lower.includes("i5") || lower.includes("12400") || lower.includes("13400")) {
    cpuModel = "Intel Core i5-13400";
  }

  const inferredHardware: HardwareProfile = {
    cpu: {
      model: cpuModel,
      architecture: arch,
      performanceScore: 85,
      laptopVariant: lower.includes("laptop") || lower.includes("macbook"),
      isVerified: true,
    },
    gpu: gpuModel
      ? {
          model: gpuModel,
          type: "dedicated",
          performanceScore: 80,
          vramGb,
          supportsCuda,
          laptopVariant: lower.includes("laptop"),
          isVerified: true,
        }
      : undefined,
    ram: { totalGb: ramGb, type: "DDR5" },
    storage: [{ type: "NVME_SSD", totalGb: 512, isSystemDrive: true }],
    os: { family: osFamily, architecture: arch },
    architecture: arch,
    deviceType: lower.includes("laptop") || lower.includes("macbook") ? "laptop" : "desktop",
  };

  return {
    confidence: 94,
    inferredHardware,
    isAmbiguous: lower.includes("4070") && !lower.includes("laptop") && !lower.includes("desktop"),
    needsClarification: false,
  };
}
