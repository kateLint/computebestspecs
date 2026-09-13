import { PerformanceTier } from "../domain/compatibility";

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Calculates a bottleneck penalty based on the lowest critical component scores.
 * Rather than letting a 95 CPU score hide a 40 RAM score, critical deficiencies apply an exponential penalty.
 */
export function calculateBottleneckPenalty(
  componentScores: { cpu: number; memory: number; gpu: number; vram: number; storage: number },
  weights: { cpu: number; memory: number; gpu: number; vram: number; storage: number }
): { baseScore: number; criticalPenalty: number; finalScore: number } {
  const totalWeight = weights.cpu + weights.memory + weights.gpu + weights.vram + weights.storage;
  const baseScore = totalWeight > 0
    ? (componentScores.cpu * weights.cpu +
       componentScores.memory * weights.memory +
       componentScores.gpu * weights.gpu +
       componentScores.vram * weights.vram +
       componentScores.storage * weights.storage) / totalWeight
    : 0;

  const criticalScores: number[] = [];
  if (weights.memory >= 0.15) criticalScores.push(componentScores.memory);
  if (weights.vram >= 0.15) criticalScores.push(componentScores.vram);
  if (weights.cpu >= 0.15) criticalScores.push(componentScores.cpu);
  if (weights.gpu >= 0.15) criticalScores.push(componentScores.gpu);
  if (weights.storage >= 0.15) criticalScores.push(componentScores.storage);

  const minCritical = criticalScores.length > 0 ? Math.min(...criticalScores) : 70;

  let criticalPenalty = 0;
  if (minCritical < 70) {
    criticalPenalty = (70 - minCritical) * 0.85;
  }

  const finalScore = Math.round(clamp(baseScore - criticalPenalty, 0, 100));

  return {
    baseScore: Math.round(baseScore),
    criticalPenalty: Math.round(criticalPenalty),
    finalScore,
  };
}

export function mapScoreToStatus(
  score: number,
  isHardIncompatible: boolean
): PerformanceTier {
  if (isHardIncompatible) return "poor";

  if (score >= 90) return "excellent";
  if (score >= 68) return "recommended";
  if (score >= 50) return "usable";
  if (score >= 35) return "minimum";
  return "poor";
}
