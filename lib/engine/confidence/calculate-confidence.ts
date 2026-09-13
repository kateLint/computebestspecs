import { HardwareProfile } from "../../domain/hardware";
import { SoftwareVersion } from "../../domain/software";
import { Confidence, ConfidenceLevel } from "../../domain/common";

export function calculateConfidence(
  hardware: HardwareProfile,
  versions: SoftwareVersion[]
): { confidenceScore: number; confidence: Confidence } {
  let score = 70;
  const reasons: string[] = [];

  // 1. CPU Verification
  if (hardware.cpu.isVerified) {
    score += 10;
    reasons.push("Exact CPU model verified against catalog");
  } else {
    reasons.push("Generic or unverified CPU profile");
  }

  // 2. GPU Verification
  if (hardware.gpu?.isVerified) {
    score += 10;
    reasons.push("GPU verified with hardware capability metadata");
  }

  // 3. Software Provenance
  const allVerifiedReqs = versions.every(v => v.dataQuality === "VERIFIED" || v.sourceRecords.some(s => s.type === "official"));
  if (allVerifiedReqs && versions.length > 0) {
    score += 10;
    reasons.push("Official vendor software requirements");
  } else {
    reasons.push("Workload demands include empirical estimates");
  }

  const finalScore = Math.min(100, Math.max(0, score));
  let level: ConfidenceLevel = "MEDIUM";
  if (finalScore >= 85) level = "HIGH";
  else if (finalScore < 50) level = "LOW";

  return {
    confidenceScore: finalScore,
    confidence: {
      level,
      score: finalScore,
      reasons,
    },
  };
}
