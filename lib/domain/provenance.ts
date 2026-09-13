export type ProvenanceDataType =
  | "OFFICIAL_REQUIREMENT" // Official vendor documentation (e.g. Adobe, Google)
  | "HARDWARE_SPEC"        // Official manufacturer spec sheet (e.g. Intel, AMD, NVIDIA)
  | "BENCHMARK"            // Normalized benchmark dataset
  | "WORKLOAD_ESTIMATE";   // Estimated empirical working sets

export interface ProvenanceRecord {
  provider: string;
  sourceUrl?: string;
  dataType: ProvenanceDataType;
  licenseType?: "PUBLIC_DOMAIN" | "OFFICIAL_DOCS_FAIR_USE" | "COMMERCIAL_LICENSE" | "PROPRIETARY";
  commercialUseAllowed: boolean;
  retrievedAt: string;
  verifiedAt?: string;
  confidence: number;
}

export function formatProvenanceBadge(dataType: ProvenanceDataType, verifiedAt?: string): {
  icon: string;
  label: string;
  badgeClass: string;
  tooltip: string;
} {
  switch (dataType) {
    case "OFFICIAL_REQUIREMENT":
      return {
        icon: "✓",
        label: "Official requirement",
        badgeClass: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
        tooltip: `Source: Official vendor documentation (Verified ${verifiedAt ? new Date(verifiedAt).toLocaleDateString() : "Recently"})`,
      };
    case "BENCHMARK":
      return {
        icon: "◉",
        label: "Benchmark-derived",
        badgeClass: "text-cyan-400 bg-cyan-950/60 border-cyan-800",
        tooltip: "Normalized from versioned hardware benchmark dataset",
      };
    case "HARDWARE_SPEC":
      return {
        icon: "⚙",
        label: "Hardware specification",
        badgeClass: "text-blue-400 bg-blue-950/60 border-blue-800",
        tooltip: "Official chip manufacturer specification",
      };
    case "WORKLOAD_ESTIMATE":
    default:
      return {
        icon: "≈",
        label: "Estimated workload",
        badgeClass: "text-amber-400 bg-amber-950/60 border-amber-800",
        tooltip: "Empirical concurrent working set estimate",
      };
  }
}
