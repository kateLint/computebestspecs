/**
 * Formal Calibration Service
 * Applies mathematical normalization transforms using versioned calibration profiles
 * to convert raw benchmark measurements into rigorous, normalized engine scores.
 */

import { CalibrationProfile, CANONICAL_CALIBRATION_PROFILES, WorkloadClass } from './calibration-models';

export interface CalibrationEvaluationInput {
  workloadClass: WorkloadClass;
  rawMetricValue: number;
  hardwareMemoryBandwidthGbps?: number;
  empiricalSampleCount?: number;
  profileOverride?: CalibrationProfile;
}

export interface CalibratedScoreResult {
  workloadClass: WorkloadClass;
  profileId: string;
  datasetVersion: string;
  coefficientVersion: string;
  rawMetricValue: number;
  metricUnit: string;
  calibratedScore: number;           // 0 - 100 continuous score
  confidenceMultiplier: number;      // 0.0 - 1.0 based on sample depth
  effectiveFinalScore: number;       // calibratedScore * confidenceMultiplier
  grade: 'TIER_S' | 'TIER_A' | 'TIER_B' | 'TIER_C' | 'TIER_F';
  calculationTrace: string[];
}

/**
 * Normalizes raw metric using the specified method in the profile
 */
export function normalizeMetric(
  rawVal: number,
  profile: CalibrationProfile,
  bandwidthGbps?: number
): { normalizedRatio: number; trace: string } {
  const { minThreshold, recommendedThreshold, target60FpsThreshold, bandwidthWeight } = profile.coefficients;

  switch (profile.normalizationMethod) {
    case 'POWER_SCALED': {
      // E.g. Blender samples/min where scaling has diminishing returns at the ultra high end
      if (rawVal <= minThreshold) {
        return { normalizedRatio: 0, trace: `Raw value ${rawVal} is below minThreshold ${minThreshold}` };
      }
      const powerExponent = 0.75;
      const normalized = Math.pow((rawVal - minThreshold) / (recommendedThreshold - minThreshold), powerExponent);
      return {
        normalizedRatio: Math.min(1.5, Math.max(0, normalized)),
        trace: `PowerScaled(val=${rawVal}, min=${minThreshold}, rec=${recommendedThreshold}, exp=${powerExponent}) -> ${normalized.toFixed(3)}`
      };
    }

    case 'ROOFTOP_BANDWIDTH': {
      // E.g. LLM decode tok/s where throughput is directly bounded by memory bandwidth
      const bwFactor = bandwidthGbps ? Math.min(1.0, bandwidthGbps / 1000) : 0.5;
      const weightBw = bandwidthWeight ?? 0.8;
      const rawRatio = rawVal / (recommendedThreshold || 1);
      const composite = (1 - weightBw) * rawRatio + weightBw * (rawVal / (target60FpsThreshold || 60));
      return {
        normalizedRatio: Math.min(1.5, Math.max(0, composite)),
        trace: `RooftopBandwidth(tok/s=${rawVal}, bwGbps=${bandwidthGbps || 'unknown'}, bwFactor=${bwFactor.toFixed(2)}) -> ${composite.toFixed(3)}`
      };
    }

    case 'LOG_LINEAR': {
      // E.g. Compile time (where lower is better!)
      // minThreshold is worst time (e.g. 600s), recommended is good time (e.g. 120s)
      if (rawVal >= minThreshold) {
        return { normalizedRatio: 0.1, trace: `LogLinear inverse (val=${rawVal}s >= maxPain=${minThreshold}s)` };
      }
      const clampedVal = Math.max(10, rawVal);
      const logWorst = Math.log(minThreshold);
      const logBest = Math.log(target60FpsThreshold || 30);
      const logCurrent = Math.log(clampedVal);
      const ratio = (logWorst - logCurrent) / (logWorst - logBest);
      return {
        normalizedRatio: Math.min(1.5, Math.max(0, ratio)),
        trace: `LogLinear inverse compile time: ${rawVal}s -> normalizedRatio ${ratio.toFixed(3)}`
      };
    }

    case 'SIGMOID_SATURATION': {
      // Sigmoid S-curve centered around recommended threshold
      const midpoint = recommendedThreshold;
      const steepness = 0.05;
      const sigmoid = 1 / (1 + Math.exp(-steepness * (rawVal - midpoint)));
      return {
        normalizedRatio: sigmoid * 1.25,
        trace: `SigmoidSaturation(val=${rawVal}, midpoint=${midpoint}) -> ${(sigmoid * 1.25).toFixed(3)}`
      };
    }

    case 'MIN_MAX':
    default: {
      const denom = (recommendedThreshold - minThreshold) || 1;
      const ratio = (rawVal - minThreshold) / denom;
      return {
        normalizedRatio: Math.min(1.5, Math.max(0, ratio)),
        trace: `MinMax(val=${rawVal}, min=${minThreshold}, rec=${recommendedThreshold}) -> ${ratio.toFixed(3)}`
      };
    }
  }
}

/**
 * Calculates a formally calibrated score from an empirical benchmark observation
 */
export function calculateCalibratedScore(input: CalibrationEvaluationInput): CalibratedScoreResult {
  const profile = input.profileOverride || 
    CANONICAL_CALIBRATION_PROFILES.find(p => p.workloadClass === input.workloadClass) ||
    CANONICAL_CALIBRATION_PROFILES[0];

  const trace: string[] = [];
  trace.push(`Using Calibration Profile: ${profile.id} (${profile.datasetVersion} / ${profile.coefficientVersion})`);

  // Step 1: Normalize raw metric
  const { normalizedRatio, trace: normTrace } = normalizeMetric(
    input.rawMetricValue,
    profile,
    input.hardwareMemoryBandwidthGbps
  );
  trace.push(`Normalization: ${normTrace}`);

  // Step 2: Apply coefficients (baseWeight, scaleFactor, intercept)
  const { baseWeight, scaleFactor, intercept } = profile.coefficients;
  const rawCalculatedScore = Math.min(
    100,
    Math.max(0, intercept + normalizedRatio * scaleFactor * baseWeight * 80)
  );
  trace.push(`Score Math: intercept(${intercept}) + norm(${normalizedRatio.toFixed(3)}) * scale(${scaleFactor}) * weight(${baseWeight}) * 80 -> ${rawCalculatedScore.toFixed(1)}`);

  // Step 3: Compute confidence penalty if sample count is insufficient
  const samples = input.empiricalSampleCount ?? profile.sampleCount;
  let confidenceMultiplier = 1.0;
  if (samples < profile.minSampleCountRequired) {
    const penalty = profile.confidencePenaltyFactor * (1 - (samples / profile.minSampleCountRequired));
    confidenceMultiplier = Math.max(0.6, 1.0 - penalty);
    trace.push(`Confidence Penalty: samples (${samples} < required ${profile.minSampleCountRequired}), applied multiplier ${confidenceMultiplier.toFixed(2)}`);
  } else {
    trace.push(`Confidence Full: ${samples} empirical samples >= required ${profile.minSampleCountRequired}`);
  }

  const effectiveFinalScore = Math.round(rawCalculatedScore * confidenceMultiplier * 10) / 10;
  trace.push(`Final Effective Calibrated Score: ${effectiveFinalScore}/100`);

  let grade: CalibratedScoreResult['grade'] = 'TIER_F';
  if (effectiveFinalScore >= 90) grade = 'TIER_S';
  else if (effectiveFinalScore >= 75) grade = 'TIER_A';
  else if (effectiveFinalScore >= 60) grade = 'TIER_B';
  else if (effectiveFinalScore >= 45) grade = 'TIER_C';

  return {
    workloadClass: input.workloadClass,
    profileId: profile.id,
    datasetVersion: profile.datasetVersion,
    coefficientVersion: profile.coefficientVersion,
    rawMetricValue: input.rawMetricValue,
    metricUnit: profile.unit,
    calibratedScore: Math.round(rawCalculatedScore * 10) / 10,
    confidenceMultiplier,
    effectiveFinalScore,
    grade,
    calculationTrace: trace
  };
}
