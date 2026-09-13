import { OperatingSystemFamily } from "../../domain/hardware";
import { AggregatedDemands } from "./aggregate-resource-demand";
import { EvaluationPolicy, DEFAULT_EVALUATION_POLICY } from "../policy/evaluation-policy";

export interface ConcurrencyEvaluationResult {
  osReserveGb: number;
  safetyHeadroomGb: number;
  typicalTotalGb: number;
  peakTotalGb: number;
  typicalPressureRatio: number;
  peakPressureRatio: number;
  swapLikelihood: "NONE" | "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  isBottleneck: boolean;
}

export function evaluateConcurrency(
  installedRamGb: number,
  osFamily: OperatingSystemFamily,
  demands: AggregatedDemands,
  policy: EvaluationPolicy = DEFAULT_EVALUATION_POLICY
): ConcurrencyEvaluationResult {
  const osReserve = policy.osBackgroundReserveGb[osFamily] ?? policy.osBackgroundReserveGb.other;
  const safetyHeadroom = demands.peakRamGb * policy.safetyHeadroomRatio;

  const typicalTotal = Math.round((osReserve + demands.typicalRamGb) * 10) / 10;
  const peakTotal = Math.round((osReserve + demands.peakRamGb + safetyHeadroom) * 10) / 10;

  const availableRam = Math.max(1, installedRamGb);
  const typicalPressureRatio = Math.round((typicalTotal / availableRam) * 100) / 100;
  const peakPressureRatio = Math.round((peakTotal / availableRam) * 100) / 100;

  let swapLikelihood: "NONE" | "LOW" | "MODERATE" | "HIGH" | "SEVERE" = "LOW";
  if (peakPressureRatio > policy.bottleneckThresholds.ramPressureSevere) {
    swapLikelihood = "SEVERE";
  } else if (peakPressureRatio > policy.bottleneckThresholds.ramPressureCritical) {
    swapLikelihood = "HIGH";
  } else if (typicalPressureRatio > policy.bottleneckThresholds.ramPressureWarning) {
    swapLikelihood = "MODERATE";
  } else if (typicalPressureRatio < 0.7) {
    swapLikelihood = "NONE";
  }

  const isBottleneck = peakPressureRatio > policy.bottleneckThresholds.ramPressureCritical;

  return {
    osReserveGb: osReserve,
    safetyHeadroomGb: Math.round(safetyHeadroom * 10) / 10,
    typicalTotalGb: typicalTotal,
    peakTotalGb: peakTotal,
    typicalPressureRatio,
    peakPressureRatio,
    swapLikelihood,
    isBottleneck,
  };
}
