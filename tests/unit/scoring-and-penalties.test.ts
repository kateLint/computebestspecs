import { describe, it, expect } from "vitest";
import { calculateBottleneckPenalty, clamp, mapScoreToStatus } from "../../lib/scoring/scoring-utils";

describe("Scoring and Bottleneck Penalty Utility", () => {
  it("penalizes heavily when a critical component fails rather than averaging", () => {
    // Component scores where RAM is critically low (20), but CPU and GPU are 95
    const componentScores = { cpu: 95, memory: 20, gpu: 90, vram: 90, storage: 90 };
    const weights = { cpu: 0.3, memory: 0.35, gpu: 0.15, vram: 0.1, storage: 0.1 };

    const { baseScore, criticalPenalty, finalScore } = calculateBottleneckPenalty(componentScores, weights);

    expect(baseScore).toBeGreaterThanOrEqual(65); // Naive average would be ~67
    expect(criticalPenalty).toBeGreaterThan(20); // Penalty should be significant
    expect(finalScore).toBeLessThan(55); // Final score dragged down due to RAM bottleneck
  });

  it("verifies score monotonicity: improving RAM never decreases final score (§117)", () => {
    const weights = { cpu: 0.3, memory: 0.35, gpu: 0.15, vram: 0.1, storage: 0.1 };

    const score8Gb = calculateBottleneckPenalty({ cpu: 75, memory: 40, gpu: 70, vram: 70, storage: 80 }, weights).finalScore;
    const score16Gb = calculateBottleneckPenalty({ cpu: 75, memory: 65, gpu: 70, vram: 70, storage: 80 }, weights).finalScore;
    const score32Gb = calculateBottleneckPenalty({ cpu: 75, memory: 90, gpu: 70, vram: 70, storage: 80 }, weights).finalScore;

    expect(score16Gb).toBeGreaterThanOrEqual(score8Gb);
    expect(score32Gb).toBeGreaterThanOrEqual(score16Gb);
  });
});
