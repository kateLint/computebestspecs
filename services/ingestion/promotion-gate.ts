import { CandidatePromotionResult } from "./data-control-plane";

export interface PromotionGateDecision {
  status: "APPROVED" | "BLOCKED" | "MANDATORY_REVIEW_REQUIRED";
  blockReasons: string[];
  reviewReasons: string[];
  metrics: {
    hardRegressionPercentage: number;
    tierShiftPercentage: number;
    scoreShiftPercentage: number;
    unchangedPercentage: number;
  };
}

export function evaluatePromotionGate(promotionResult: CandidatePromotionResult): PromotionGateDecision {
  const blockReasons: string[] = [];
  const reviewReasons: string[] = [];

  const regressionImpact = promotionResult.regressionImpact || {
    totalScenariosTested: 1,
    unchangedCount: 1,
    minorScoreShiftCount: 0,
    tierShiftCount: 0,
    newlyIncompatibleCount: 0,
    newlyIncompatibleScenarios: [],
  };

  const total = Math.max(1, regressionImpact.totalScenariosTested);
  const hardRegressionPct = (regressionImpact.newlyIncompatibleCount / total) * 100;
  const tierShiftPct = (regressionImpact.tierShiftCount / total) * 100;
  const scoreShiftPct = (regressionImpact.minorScoreShiftCount / total) * 100;
  const unchangedPct = (regressionImpact.unchangedCount / total) * 100;

  // Release Blocker Rule 1: > 0.5% unexpected hard compatibility regressions -> BLOCK
  if (hardRegressionPct > 0.5) {
    blockReasons.push(
      `Hard compatibility regression rate of ${hardRegressionPct.toFixed(2)}% exceeds maximum allowed threshold of 0.5% (${regressionImpact.newlyIncompatibleCount} scenarios became incompatible).`
    );
  }

  // Release Blocker Rule 2: Any architecture or OS removal -> Mandatory Review
  const droppedPlatforms = promotionResult.changes.filter(c => c.field === "operatingSystems" || c.field === "architectures");
  if (droppedPlatforms.length > 0) {
    reviewReasons.push(`Platform or CPU architecture support was removed: ${droppedPlatforms.map(p => p.description).join("; ")}`);
  }

  // Release Blocker Rule 3: Breaking severity changes
  if (promotionResult.overallSeverity === "BREAKING") {
    reviewReasons.push("Candidate contains BREAKING semantic requirement changes requiring manual sign-off.");
  }

  let status: "APPROVED" | "BLOCKED" | "MANDATORY_REVIEW_REQUIRED" = "APPROVED";
  if (blockReasons.length > 0) {
    status = "BLOCKED";
  } else if (reviewReasons.length > 0) {
    status = "MANDATORY_REVIEW_REQUIRED";
  }

  return {
    status,
    blockReasons,
    reviewReasons,
    metrics: {
      hardRegressionPercentage: Math.round(hardRegressionPct * 100) / 100,
      tierShiftPercentage: Math.round(tierShiftPct * 100) / 100,
      scoreShiftPercentage: Math.round(scoreShiftPct * 100) / 100,
      unchangedPercentage: Math.round(unchangedPct * 100) / 100,
    },
  };
}
