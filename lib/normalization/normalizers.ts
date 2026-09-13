import { CpuArchitecture, GpuType, StorageType } from "../domain/hardware";

export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function matchAlias(query: string, candidate: string, aliases: string[] = []): boolean {
  const normQuery = normalizeSearchTerm(query);
  if (!normQuery) return false;

  const normCandidate = normalizeSearchTerm(candidate);
  if (normCandidate.includes(normQuery) || normQuery.includes(normCandidate)) return true;

  return aliases.some(alias => {
    const normAlias = normalizeSearchTerm(alias);
    return normAlias.includes(normQuery) || normQuery.includes(normAlias);
  });
}

export function normalizeStorageType(type: string): StorageType {
  const upper = type.toUpperCase();
  if (upper.includes("NVME")) return "NVME_SSD";
  if (upper.includes("SSD") || upper.includes("SATA")) return "SATA_SSD";
  if (upper.includes("HDD") || upper.includes("HARD")) return "HDD";
  return "UNKNOWN";
}

export function normalizeCpuArchitecture(arch: string): CpuArchitecture {
  const lower = arch.toLowerCase();
  if (lower.includes("arm") || lower.includes("m1") || lower.includes("m2") || lower.includes("m3") || lower.includes("m4") || lower.includes("snapdragon")) {
    return "arm64";
  }
  return "x86_64";
}

export function normalizeGpuType(type: string, isAppleSilicon = false): GpuType {
  if (isAppleSilicon) return "unified";
  const lower = type.toLowerCase();
  if (lower.includes("integrated") || lower.includes("igpu") || lower.includes("intel uhd") || lower.includes("radeon graphics") || lower.includes("iris")) {
    return "integrated";
  }
  return "dedicated";
}
