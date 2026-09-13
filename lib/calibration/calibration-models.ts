/**
 * Formal Calibration Models and Schemas
 * Decouples raw third-party benchmark observations (Blender Open Data, Phoronix Test Suite,
 * llama-bench, Cinebench, Geekbench) from raw engine scores through versioned calibration profiles.
 */

export type WorkloadClass = 
  | 'BLENDER_RENDER'
  | 'VIDEO_EXPORT'
  | 'LOCAL_AI_INFERENCE'
  | 'DEVELOPMENT_CONCURRENCY'
  | 'GAMING_RASTER'
  | 'GAMING_RAYTRACING'
  | 'CAD_3D_MODELING'
  | 'AUDIO_DAW_DSP';

export type NormalizationMethod = 
  | 'LOG_LINEAR'
  | 'MIN_MAX'
  | 'POWER_SCALED'
  | 'ROOFTOP_BANDWIDTH'
  | 'SIGMOID_SATURATION';

export interface CalibrationCoefficients {
  baseWeight: number;            // 0.0 - 1.0 weight in final composite score
  scaleFactor: number;           // Multiplier applied to normalized metric
  intercept: number;             // Base offset
  minThreshold: number;          // Minimum metric value for non-zero score
  recommendedThreshold: number;  // Metric value corresponding to 80/100 score
  target60FpsThreshold?: number; // Metric value needed for rock-solid 60 FPS or 20 tok/s
  bandwidthWeight?: number;      // Influence of memory bandwidth for memory-bound tasks
  thermalPenaltySlope?: number;  // Penalty factor if sustained thermal throttling is detected
}

export interface CalibrationProfile {
  id: string;
  workloadClass: WorkloadClass;
  metric: string;
  unit: string;
  normalizationMethod: NormalizationMethod;
  datasetVersion: string;
  coefficientVersion: string;
  coefficients: CalibrationCoefficients;
  confidencePenaltyFactor: number; // Penalty applied if hardware has zero empirical benchmark observations
  minSampleCountRequired: number;  // Minimum empirical runs required for 100% confidence
  sampleCount: number;             // Number of samples backing this calibration profile
  description: string;
  createdDate: string;
}

/**
 * Standard Canonical Calibration Profiles
 */
export const CANONICAL_CALIBRATION_PROFILES: CalibrationProfile[] = [
  {
    id: 'calib-blender-4-cycles',
    workloadClass: 'BLENDER_RENDER',
    metric: 'blender_samples_per_minute',
    unit: 'samples/min',
    normalizationMethod: 'POWER_SCALED',
    datasetVersion: '2026.03-blender-opendata-v4',
    coefficientVersion: 'coeff-v3.0',
    coefficients: {
      baseWeight: 0.85,
      scaleFactor: 1.25,
      intercept: 5.0,
      minThreshold: 150,           // e.g. Entry GPU
      recommendedThreshold: 2400, // e.g. RTX 4070 / RTX 3080 level
      target60FpsThreshold: 5000  // e.g. RTX 4090 / RTX 5090 level
    },
    confidencePenaltyFactor: 0.15,
    minSampleCountRequired: 10,
    sampleCount: 1420,
    description: 'Blender 4.0 Cycles monster/junkshop/classroom geometric mean calibration.',
    createdDate: '2026-03-01'
  },
  {
    id: 'calib-llama-bench-tok-sec',
    workloadClass: 'LOCAL_AI_INFERENCE',
    metric: 'llama_bench_tg128_tokens_per_sec',
    unit: 'tok/s',
    normalizationMethod: 'ROOFTOP_BANDWIDTH',
    datasetVersion: '2026.03-llama-cpp-b3200',
    coefficientVersion: 'coeff-v2.5',
    coefficients: {
      baseWeight: 0.90,
      scaleFactor: 1.0,
      intercept: 0.0,
      minThreshold: 5.0,           // Minimum acceptable interactive reading speed
      recommendedThreshold: 25.0,  // Smooth conversational speed
      target60FpsThreshold: 60.0,  // Instantaneous agentic reasoning speed
      bandwidthWeight: 0.80
    },
    confidencePenaltyFactor: 0.10,
    minSampleCountRequired: 5,
    sampleCount: 890,
    description: 'llama-bench text generation (tg128) memory-bandwidth roofline calibration.',
    createdDate: '2026-03-01'
  },
  {
    id: 'calib-phoronix-compile-speed',
    workloadClass: 'DEVELOPMENT_CONCURRENCY',
    metric: 'pts_build_linux_kernel_seconds',
    unit: 'seconds',
    normalizationMethod: 'LOG_LINEAR',
    datasetVersion: '2026.03-phoronix-suite-v11',
    coefficientVersion: 'coeff-v1.8',
    coefficients: {
      baseWeight: 0.70,
      scaleFactor: 1.5,
      intercept: 10.0,
      minThreshold: 600,          // >10 min is painful
      recommendedThreshold: 120,  // 2 min is smooth
      target60FpsThreshold: 45    // <45s is top tier
    },
    confidencePenaltyFactor: 0.20,
    minSampleCountRequired: 8,
    sampleCount: 650,
    description: 'Phoronix Test Suite Linux Kernel & LLVM build-time concurrency calibration.',
    createdDate: '2026-03-01'
  },
  {
    id: 'calib-gaming-raytracing-4k',
    workloadClass: 'GAMING_RAYTRACING',
    metric: 'cyberpunk_rt_overdrive_fps',
    unit: 'fps',
    normalizationMethod: 'SIGMOID_SATURATION',
    datasetVersion: '2026.03-3dmark-speedway-v2',
    coefficientVersion: 'coeff-v2.0',
    coefficients: {
      baseWeight: 0.95,
      scaleFactor: 1.1,
      intercept: 0.0,
      minThreshold: 30.0,
      recommendedThreshold: 60.0,
      target60FpsThreshold: 120.0
    },
    confidencePenaltyFactor: 0.12,
    minSampleCountRequired: 12,
    sampleCount: 2100,
    description: 'Hardware raytracing & BVH traversal hardware saturation calibration.',
    createdDate: '2026-03-01'
  }
];
