import { describe, it, expect } from 'vitest';
import { calculateCalibratedScore, normalizeMetric } from '@/lib/calibration/calibration-service';
import { CANONICAL_CALIBRATION_PROFILES } from '@/lib/calibration/calibration-models';

describe('Formal Calibration Layer & Transformation Math', () => {
  it('calibrates Blender Cycles benchmark scores with power scaling', () => {
    const blenderProfile = CANONICAL_CALIBRATION_PROFILES.find(p => p.id === 'calib-blender-4-cycles')!;

    // 100 samples/min is below min threshold (150) -> should score 0 normalized ratio
    const lowResult = normalizeMetric(100, blenderProfile);
    expect(lowResult.normalizedRatio).toBe(0);

    // 2400 samples/min is the recommended threshold -> should produce strong score
    const recResult = calculateCalibratedScore({
      workloadClass: 'BLENDER_RENDER',
      rawMetricValue: 2400
    });
    expect(recResult.calibratedScore).toBeGreaterThanOrEqual(75);
    expect(recResult.grade).toBe('TIER_S');

    // 5000+ samples/min (RTX 4090 tier) -> TIER_S
    const highResult = calculateCalibratedScore({
      workloadClass: 'BLENDER_RENDER',
      rawMetricValue: 5200
    });
    expect(highResult.calibratedScore).toBeGreaterThanOrEqual(90);
    expect(highResult.grade).toBe('TIER_S');
  });

  it('calibrates LLM inference throughput using memory bandwidth roofline', () => {
    // 5 tok/s on 68 GB/s bandwidth (M1 Air)
    const lowBwResult = calculateCalibratedScore({
      workloadClass: 'LOCAL_AI_INFERENCE',
      rawMetricValue: 9.8,
      hardwareMemoryBandwidthGbps: 68
    });
    expect(lowBwResult.calibratedScore).toBeLessThan(60);

    // 55 tok/s on 1008 GB/s bandwidth (RTX 4090) -> TIER_A
    const highBwResult = calculateCalibratedScore({
      workloadClass: 'LOCAL_AI_INFERENCE',
      rawMetricValue: 55.0,
      hardwareMemoryBandwidthGbps: 1008
    });
    expect(highBwResult.calibratedScore).toBeGreaterThanOrEqual(75);
    expect(highBwResult.grade).toBe('TIER_A');
  });

  it('inverts compile time in log-linear mode (lower duration is better)', () => {
    const fastBuild = calculateCalibratedScore({
      workloadClass: 'DEVELOPMENT_CONCURRENCY',
      rawMetricValue: 45 // 45 seconds compile time
    });
    const slowBuild = calculateCalibratedScore({
      workloadClass: 'DEVELOPMENT_CONCURRENCY',
      rawMetricValue: 450 // 450 seconds compile time
    });

    expect(fastBuild.calibratedScore).toBeGreaterThan(slowBuild.calibratedScore);
    expect(fastBuild.effectiveFinalScore).toBeGreaterThan(75);
  });

  it('applies confidence penalty when empirical sample count is below minimum required', () => {
    const blenderProfile = CANONICAL_CALIBRATION_PROFILES.find(p => p.id === 'calib-blender-4-cycles')!;
    
    // Test with only 2 samples when 10 are required
    const resultWithFewSamples = calculateCalibratedScore({
      workloadClass: 'BLENDER_RENDER',
      rawMetricValue: 3000,
      empiricalSampleCount: 2,
      profileOverride: blenderProfile
    });

    expect(resultWithFewSamples.confidenceMultiplier).toBeLessThan(1.0);
    expect(resultWithFewSamples.effectiveFinalScore).toBeLessThan(resultWithFewSamples.calibratedScore);
  });
});
