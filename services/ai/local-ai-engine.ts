import { HardwareProfile } from "../../lib/domain/hardware";
import {
  AiModelSpec,
  LocalAiCompatibilityResult,
  ModelResidency,
  AcceleratorBackend,
  ModelFormat,
  LlmPerformanceEstimate,
  InferenceRuntime,
  InferenceBenchmark,
  CalibrationEvidence,
} from "../../lib/domain/ai-workload";

export const AVAILABLE_INFERENCE_RUNTIMES: InferenceRuntime[] = [
  {
    id: "llama.cpp",
    name: "llama.cpp",
    supportedFormats: ["GGUF"],
    supportedAccelerators: ["cuda", "metal", "rocm", "vulkan", "sycl", "cpu"],
    supportedArchitectures: ["x86_64", "arm64"],
    cpuFeatures: [
      { feature: "AVX2", level: "RECOMMENDED" },
      { feature: "AVX512", level: "ACCELERATION_ONLY" },
      { feature: "NEON", level: "RECOMMENDED" },
    ],
    supportedOperatingSystems: ["windows", "macos", "linux"],
    supportsPartialOffload: true,
  },
  {
    id: "ollama",
    name: "Ollama",
    supportedFormats: ["GGUF"],
    supportedAccelerators: ["cuda", "metal", "rocm", "cpu"],
    supportedArchitectures: ["x86_64", "arm64"],
    supportedOperatingSystems: ["windows", "macos", "linux"],
    supportsPartialOffload: true,
  },
  {
    id: "mlx",
    name: "MLX (Apple Silicon Native)",
    supportedFormats: ["MLX", "Safetensors"],
    supportedAccelerators: ["metal"],
    supportedArchitectures: ["arm64"],
    cpuFeatures: [{ feature: "NEON", level: "REQUIRED" }],
    supportedOperatingSystems: ["macos"],
    supportsPartialOffload: false,
  },
  {
    id: "vllm",
    name: "vLLM (High Throughput / PagedAttention)",
    supportedFormats: ["Safetensors", "GGUF"],
    supportedAccelerators: ["cuda", "rocm"],
    supportedArchitectures: ["x86_64", "arm64"],
    supportedOperatingSystems: ["linux"],
    supportsPartialOffload: false,
  },
];

export const EMPIRICAL_INFERENCE_BENCHMARKS: InferenceBenchmark[] = [
  {
    gpuFamily: "RTX 4070",
    modelVariantId: "llama-3.1-8b-q4",
    runtimeVersion: "llama.cpp b3600",
    backend: "cuda",
    contextTokens: 8192,
    promptTokensPerSecond: 185,
    generationTokensPerSecond: 38,
    peakRamGb: 6.2,
    peakVramGb: 6.8,
  },
  {
    gpuFamily: "RTX 4090",
    modelVariantId: "llama-3.1-8b-q4",
    runtimeVersion: "llama.cpp b3600",
    backend: "cuda",
    contextTokens: 8192,
    promptTokensPerSecond: 420,
    generationTokensPerSecond: 98,
    peakRamGb: 6.5,
    peakVramGb: 7.1,
  },
  {
    gpuFamily: "RTX 3060",
    modelVariantId: "llama-3.1-8b-q4",
    runtimeVersion: "llama.cpp b3600",
    backend: "cuda",
    contextTokens: 8192,
    promptTokensPerSecond: 110,
    generationTokensPerSecond: 28,
    peakRamGb: 5.8,
    peakVramGb: 6.5,
  },
  {
    gpuFamily: "Apple M3 Pro",
    cpuArchitecture: "arm64",
    modelVariantId: "llama-3.1-8b-q4",
    runtimeVersion: "MLX 0.16",
    backend: "metal",
    contextTokens: 8192,
    promptTokensPerSecond: 160,
    generationTokensPerSecond: 34,
    peakRamGb: 7.2,
  },
  {
    gpuFamily: "Apple M3 Pro",
    cpuArchitecture: "arm64",
    modelVariantId: "mixtral-8x7b-q4",
    runtimeVersion: "MLX 0.16",
    backend: "metal",
    contextTokens: 4096,
    promptTokensPerSecond: 95,
    generationTokensPerSecond: 24,
    peakRamGb: 29.5,
  },
  {
    gpuFamily: "RTX 4070",
    modelVariantId: "qwen-2.5-14b-q4",
    runtimeVersion: "llama.cpp b3600",
    backend: "cuda",
    contextTokens: 8192,
    promptTokensPerSecond: 130,
    generationTokensPerSecond: 26,
    peakRamGb: 8.0,
    peakVramGb: 11.2,
  },
];

export const SAMPLE_AI_MODELS: AiModelSpec[] = [
  {
    id: "llama-3.1-8b-q4",
    name: "Llama 3.1 8B (Q4_K_M)",
    family: "Llama 3.1",
    type: "LLM_INFERENCE",
    modality: "TEXT",
    architecture: {
      architectureType: "DENSE",
      totalParametersBillions: 8.03,
      layers: 32,
      hiddenDim: 4096,
      kvHeads: 8,
    },
    quantization: "Q4",
    modelFileSizeGb: 4.9,
    minimumRamGb: 8,
    recommendedRamGb: 16,
    minimumVramGb: 6,
    recommendedVramGb: 8,
    supportsCpuOnly: true,
    requiresDedicatedGpu: false,
    requiresCudaOrMetal: false,
    supportedBackends: ["cuda", "metal", "rocm", "vulkan", "cpu"],
  },
  {
    id: "qwen-2.5-14b-q4",
    name: "Qwen 2.5 14B (Q4_K_M)",
    family: "Qwen 2.5",
    type: "LLM_INFERENCE",
    modality: "TEXT",
    architecture: {
      architectureType: "DENSE",
      totalParametersBillions: 14.7,
      layers: 48,
      hiddenDim: 5120,
      kvHeads: 8,
    },
    quantization: "Q4",
    modelFileSizeGb: 8.9,
    minimumRamGb: 16,
    recommendedRamGb: 32,
    minimumVramGb: 10,
    recommendedVramGb: 16,
    supportsCpuOnly: true,
    requiresDedicatedGpu: false,
    requiresCudaOrMetal: false,
    supportedBackends: ["cuda", "metal", "rocm", "vulkan", "cpu"],
  },
  {
    id: "mixtral-8x7b-q4",
    name: "Mixtral 8x7B (Q4_K_M MoE)",
    family: "Mixtral",
    type: "LLM_INFERENCE",
    modality: "TEXT",
    architecture: {
      architectureType: "MOE",
      totalParametersBillions: 46.7,
      activeParametersPerTokenBillions: 12.9,
      expertCount: 8,
      activeExpertsPerToken: 2,
      layers: 32,
      hiddenDim: 4096,
      kvHeads: 8,
    },
    quantization: "Q4",
    modelFileSizeGb: 26.4,
    minimumRamGb: 32,
    recommendedRamGb: 64,
    minimumVramGb: 28,
    recommendedVramGb: 32,
    supportsCpuOnly: true,
    requiresDedicatedGpu: false,
    requiresCudaOrMetal: false,
    supportedBackends: ["cuda", "metal", "rocm", "vulkan", "cpu"],
  },
  {
    id: "llama-3.1-70b-q4",
    name: "Llama 3.1 70B (Q4_K_M)",
    family: "Llama 3.1",
    type: "LLM_INFERENCE",
    modality: "TEXT",
    architecture: {
      architectureType: "DENSE",
      totalParametersBillions: 70.6,
      layers: 80,
      hiddenDim: 8192,
      kvHeads: 8,
    },
    quantization: "Q4",
    modelFileSizeGb: 40.5,
    minimumRamGb: 64,
    recommendedRamGb: 128,
    minimumVramGb: 48,
    recommendedVramGb: 48,
    supportsCpuOnly: true,
    requiresDedicatedGpu: false,
    requiresCudaOrMetal: false,
    supportedBackends: ["cuda", "metal", "rocm", "cpu"],
  },
  {
    id: "qwen-2-vl-7b-q4",
    name: "Qwen 2-VL 7B Vision (Q4_K_M)",
    family: "Qwen",
    type: "VISION_LANGUAGE",
    modality: "VISION",
    architecture: {
      architectureType: "DENSE",
      totalParametersBillions: 7.6,
      layers: 32,
      hiddenDim: 4096,
      kvHeads: 8,
    },
    quantization: "Q4",
    modelFileSizeGb: 5.2,
    minimumRamGb: 12,
    recommendedRamGb: 24,
    minimumVramGb: 8,
    recommendedVramGb: 12,
    supportsCpuOnly: true,
    requiresDedicatedGpu: false,
    requiresCudaOrMetal: false,
    supportedBackends: ["cuda", "metal", "rocm", "cpu"],
  },
];

export function calculateKvCacheGb(model: AiModelSpec, contextTokens: number): number {
  const layers = model.architecture.layers || 32;
  const kvHeads = model.architecture.kvHeads || 8;
  const hiddenDim = model.architecture.hiddenDim || 4096;
  const headDim = hiddenDim / (model.architecture.layers ? 32 : 32); // standard 128 dim

  // Standard FP16 KV cache formula: 2 (K+V) * layers * kv_heads * head_dim * context * 2 bytes
  const bytesPerToken = 2 * layers * kvHeads * headDim * 2;
  const totalBytes = bytesPerToken * contextTokens;
  return Math.round((totalBytes / (1024 * 1024 * 1024)) * 10) / 10;
}

export function estimateHardwareMemoryBandwidthGbps(hardware: HardwareProfile): {
  gpuBandwidthGbps?: number;
  systemMemoryBandwidthGbps: number;
} {
  const isApple = hardware.cpu.manufacturer === "Apple" && hardware.cpu.architecture === "arm64";
  
  // Apple Silicon Unified Memory Bandwidth
  if (isApple) {
    let bw = 100; // Base M2/M3
    if (hardware.cpu.model.includes("Ultra")) bw = 800;
    else if (hardware.cpu.model.includes("Max")) bw = 300;
    else if (hardware.cpu.model.includes("Pro")) bw = 150;
    return { gpuBandwidthGbps: bw, systemMemoryBandwidthGbps: bw };
  }

  // Discrete GPU Bandwidth
  let gpuBw: number | undefined;
  if (hardware.gpu?.type === "dedicated") {
    const gpuName = hardware.gpu.model.toLowerCase();
    if (gpuName.includes("4090")) gpuBw = 1008;
    else if (gpuName.includes("4080")) gpuBw = 717;
    else if (gpuName.includes("4070")) gpuBw = 504;
    else if (gpuName.includes("4060")) gpuBw = 272;
    else if (gpuName.includes("3060")) gpuBw = 360;
    else if (gpuName.includes("3050")) gpuBw = 192;
    else gpuBw = 250;
  }

  // System DDR4/DDR5 Bandwidth (Dual-channel)
  const isDdr5 = (hardware.cpu.performanceScore ?? 50) >= 70;
  const sysBw = isDdr5 ? 65 : 40; // ~65 GB/s for DDR5-5600, ~40 GB/s for DDR4-3200

  return {
    gpuBandwidthGbps: gpuBw,
    systemMemoryBandwidthGbps: sysBw,
  };
}

export function findMatchingBenchmarks(
  hardware: HardwareProfile,
  model: AiModelSpec,
  backend: AcceleratorBackend
): InferenceBenchmark[] {
  const isApple = hardware.cpu.manufacturer === "Apple" && hardware.cpu.architecture === "arm64";
  const gpuName = (hardware.gpu?.model || "").toLowerCase();

  return EMPIRICAL_INFERENCE_BENCHMARKS.filter(bm => {
    if (bm.modelVariantId !== model.id) return false;
    if (isApple && bm.cpuArchitecture === "arm64") {
      if (hardware.cpu.model.includes("Pro") && bm.gpuFamily?.includes("Pro")) return true;
      if (hardware.cpu.model.includes("Max") && bm.gpuFamily?.includes("Max")) return true;
      if (hardware.cpu.model.includes("Ultra") && bm.gpuFamily?.includes("Ultra")) return true;
      return true;
    }
    if (bm.gpuFamily && gpuName.includes(bm.gpuFamily.toLowerCase())) return true;
    return false;
  });
}

export function evaluateLocalAiCompatibility(
  hardware: HardwareProfile,
  model: AiModelSpec,
  contextTokens: number = 8192,
  concurrentSystemRamDemandGb: number = 4.0
): LocalAiCompatibilityResult {
  const isAppleUnified = hardware.cpu.manufacturer === "Apple" && hardware.cpu.architecture === "arm64";
  const physicalRam = hardware.ram.totalGb;
  const rawVram = hardware.gpu?.vramGb ?? (isAppleUnified ? physicalRam * 0.85 : (hardware.gpu?.type === "integrated" ? 0 : 4));
  const availableVram = isAppleUnified ? Math.round(physicalRam * 0.85 * 10) / 10 : rawVram;
  const availableRam = physicalRam - concurrentSystemRamDemandGb;

  const bandwidth = estimateHardwareMemoryBandwidthGbps(hardware);

  // Memory demand calculation
  const modelWeightsGb = model.modelFileSizeGb;
  const kvCacheGb = calculateKvCacheGb(model, contextTokens);
  const visionEncoderOverheadGb = model.modality === "VISION" ? 1.5 : 0;
  const runtimeOverheadGb = 1.0;
  const totalModelDemandGb = Math.round((modelWeightsGb + kvCacheGb + visionEncoderOverheadGb + runtimeOverheadGb) * 10) / 10;

  let residency: ModelResidency = "CPU_ONLY";
  let vramAllocatedGb = 0;
  let systemRamAllocatedGb = 0;
  let canRun = true;
  let score = 80;
  let tier: "poor" | "minimum" | "usable" | "recommended" | "excellent" = "recommended";
  const recommendations: string[] = [];
  const caveats: string[] = [];
  const assumptions: string[] = [
    `Context length: ${contextTokens} tokens`,
    `Quantization: ${model.quantization} (GGUF format via llama.cpp/Ollama)`,
    "Single active inference session (batch size = 1)",
  ];

  // Backend Stack Selection
  let recommendedBackend: AcceleratorBackend = "cpu";
  let recommendedRuntime = "llama.cpp / Ollama";
  let modelFormat: ModelFormat = "GGUF";

  if (isAppleUnified) {
    recommendedBackend = "metal";
    recommendedRuntime = "MLX / Ollama Metal";
    modelFormat = "MLX";
  } else if (hardware.gpu?.supportsCuda) {
    recommendedBackend = "cuda";
    recommendedRuntime = "llama.cpp (CUDA) / Ollama";
    modelFormat = "GGUF";
  } else if (hardware.gpu?.type === "dedicated") {
    recommendedBackend = "rocm";
    recommendedRuntime = "llama.cpp (ROCm)";
  }

  // Memory Residency & Topology Determination
  if (isAppleUnified && availableVram >= totalModelDemandGb) {
    residency = "FULL_UNIFIED_MEMORY";
    vramAllocatedGb = totalModelDemandGb;
    systemRamAllocatedGb = 0;
    score = 94;
    tier = "excellent";
    recommendations.push("Full unified memory residency active: CPU and GPU share unified memory bus with zero PCIe transfer penalties.");
  } else if (!isAppleUnified && availableVram >= totalModelDemandGb) {
    residency = "FULL_GPU";
    vramAllocatedGb = totalModelDemandGb;
    systemRamAllocatedGb = 0;
    score = 92;
    tier = "excellent";
    recommendations.push("Full discrete GPU residency: 100% of model layers and KV cache fit directly in high-bandwidth VRAM.");
  } else if (!isAppleUnified && availableVram >= modelWeightsGb * 0.35 && (availableRam + availableVram) >= totalModelDemandGb) {
    residency = "PARTIAL_GPU_OFFLOAD";
    vramAllocatedGb = availableVram;
    systemRamAllocatedGb = Math.round((totalModelDemandGb - availableVram) * 10) / 10;
    score = 64;
    tier = "usable";
    const vramPct = Math.round((availableVram / totalModelDemandGb) * 100);
    recommendations.push(`Hybrid GPU/CPU offload: ~${vramPct}% of layers fit in VRAM; remainder executes in system RAM.`);
    caveats.push("Performance is constrained by system RAM bandwidth and PCIe bus interconnect during layer transfers.");
  } else if (availableRam >= totalModelDemandGb && model.supportsCpuOnly) {
    residency = "CPU_ONLY";
    vramAllocatedGb = 0;
    systemRamAllocatedGb = totalModelDemandGb;
    score = 45;
    tier = "minimum";
    recommendations.push("Model fits completely in system RAM (CPU execution mode).");
    caveats.push("CPU-only execution is throughput-limited by DDR memory bandwidth (typically 3–8 tokens/sec).");
  } else {
    residency = "INSUFFICIENT_MEMORY";
    canRun = false;
    score = 10;
    tier = "poor";
    recommendations.push(`Cannot load configuration: Model requires ~${totalModelDemandGb}GB (Weights + ${contextTokens} context), exceeding available system memory.`);
  }

  // Performance Estimates: Decoupled Prefill vs Decode Ranges
  // MoE awareness: Compute uses active parameters; Memory transfer uses total weights
  const activeComputeParams = model.architecture.activeParametersPerTokenBillions || model.architecture.totalParametersBillions;
  const effectiveMemoryBandwidth = (residency === "FULL_GPU" || residency === "FULL_UNIFIED_MEMORY")
    ? (bandwidth.gpuBandwidthGbps || 250)
    : (residency === "PARTIAL_GPU_OFFLOAD" ? (bandwidth.systemMemoryBandwidthGbps * 0.65) : bandwidth.systemMemoryBandwidthGbps);

  // Decode generation TPS range (Bandwidth bound)
  // decode_tps ≈ (effective_bandwidth_GBps / bytes_per_token_weights) * efficiency_coeff (0.6 - 0.85)
  const bytesPerWeightToken = modelWeightsGb;
  const theoreticalMaxDecodeTps = Math.max(1, (effectiveMemoryBandwidth / bytesPerWeightToken));
  
  let decodeMin = Math.round(theoreticalMaxDecodeTps * 0.55);
  let decodeMax = Math.round(theoreticalMaxDecodeTps * 0.82);

  if (residency === "PARTIAL_GPU_OFFLOAD") {
    decodeMin = Math.max(4, Math.round(decodeMin * 0.45));
    decodeMax = Math.max(7, Math.round(decodeMax * 0.55));
  } else if (residency === "CPU_ONLY") {
    decodeMin = Math.max(2, Math.min(6, Math.round(35 / activeComputeParams)));
    decodeMax = Math.max(3, Math.min(9, Math.round(55 / activeComputeParams)));
  } else if (!canRun) {
    decodeMin = 0;
    decodeMax = 0;
  }

  // Prefill prompt processing TPS range (Compute & Memory bound)
  let prefillMin = 0;
  let prefillMax = 0;
  if (canRun) {
    if (residency === "FULL_GPU" || residency === "FULL_UNIFIED_MEMORY") {
      const gpuTflopsEstimate = ((hardware.gpu?.performanceScore ?? 50) / 100) * 45; // ~20-40 TFLOPs
      prefillMin = Math.round(Math.max(120, (gpuTflopsEstimate * 1000) / (2 * activeComputeParams * 4)));
      prefillMax = Math.round(prefillMin * 1.5);
    } else {
      prefillMin = Math.max(15, Math.round(180 / activeComputeParams));
      prefillMax = Math.round(prefillMin * 1.4);
    }
  }

  // Empirical Benchmark Calibration Integration
  const matchingBenchmarks = findMatchingBenchmarks(hardware, model, recommendedBackend);
  let calibration: CalibrationEvidence | undefined;

  if (matchingBenchmarks.length > 0 && canRun) {
    const avgMeasuredDecode = matchingBenchmarks.reduce((sum, b) => sum + b.generationTokensPerSecond, 0) / matchingBenchmarks.length;
    const avgMeasuredPrefill = matchingBenchmarks.reduce((sum, b) => sum + b.promptTokensPerSecond, 0) / matchingBenchmarks.length;

    // Calibrate theoretical estimate with empirical measurements (weighted blend)
    decodeMin = Math.round(decodeMin * 0.25 + (avgMeasuredDecode * 0.88) * 0.75);
    decodeMax = Math.round(decodeMax * 0.25 + (avgMeasuredDecode * 1.12) * 0.75);
    prefillMin = Math.round(prefillMin * 0.25 + (avgMeasuredPrefill * 0.88) * 0.75);
    prefillMax = Math.round(prefillMax * 0.25 + (avgMeasuredPrefill * 1.12) * 0.75);

    calibration = {
      matchedBenchmarksCount: matchingBenchmarks.length,
      hardwareBasis: matchingBenchmarks[0].gpuFamily || hardware.cpu.model,
      runtimeBackendBasis: matchingBenchmarks[0].runtimeVersion,
      confidenceScore: "high",
      calibrationNotes: [
        `Calibrated against ${matchingBenchmarks.length} empirical benchmark run(s)`,
        `Runtime: ${matchingBenchmarks[0].runtimeVersion} on ${recommendedBackend.toUpperCase()}`,
        `Hardware family match: ${matchingBenchmarks[0].gpuFamily}`,
      ],
    };
  }

  const performance: LlmPerformanceEstimate = {
    prefill: {
      estimatedPromptTokensPerSecond: { min: prefillMin, max: prefillMax },
      confidence: calibration ? "high" : (canRun ? (residency === "FULL_GPU" ? "high" : "medium") : "low"),
    },
    decode: {
      estimatedGenerationTokensPerSecond: { min: decodeMin, max: decodeMax },
      confidence: calibration ? "high" : (canRun ? (residency === "FULL_GPU" ? "high" : "medium") : "low"),
    },
  };

  // Context Analysis
  let maxContextTokens = 131072;
  const maxSafeContextMem = Math.max(0, (isAppleUnified ? physicalRam * 0.75 : (rawVram > 0 ? rawVram : availableRam)) - modelWeightsGb - runtimeOverheadGb);
  const calculatedMaxContext = Math.floor((maxSafeContextMem * (1024 * 1024 * 1024)) / (2 * (model.architecture.layers || 32) * (model.architecture.kvHeads || 8) * 128 * 2));
  maxContextTokens = Math.min(131072, Math.max(2048, calculatedMaxContext));

  let contextWarning: string | undefined;
  if (contextTokens > maxContextTokens && canRun) {
    contextWarning = `Selected context of ${contextTokens} tokens exceeds recommended VRAM headroom (safe context limit is ~${maxContextTokens} tokens).`;
    caveats.push(contextWarning);
  }

  return {
    modelId: model.id,
    modelName: model.name,
    canRun,
    residency,
    compatibilityTier: tier,
    score,
    performance,
    calibration,
    memoryBreakdown: {
      modelWeightsGb,
      kvCacheGb,
      visionEncoderOverheadGb,
      runtimeOverheadGb,
      totalModelDemandGb,
      vramAllocatedGb,
      systemRamAllocatedGb,
      availableVramGb: availableVram,
      availableRamGb: availableRam,
      isMemoryPressured: (vramAllocatedGb + systemRamAllocatedGb) >= (availableRam + availableVram) * 0.9,
    },
    topology: {
      isUnifiedMemory: isAppleUnified,
      gpuVramBandwidthGbps: bandwidth.gpuBandwidthGbps,
      systemMemoryBandwidthGbps: bandwidth.systemMemoryBandwidthGbps,
      pcieBandwidthConstraint: residency === "PARTIAL_GPU_OFFLOAD",
    },
    contextAnalysis: {
      selectedContextTokens: contextTokens,
      maxSupportedContextTokens: maxContextTokens,
      contextWarning,
    },
    runtimeStack: {
      recommendedRuntime,
      recommendedBackend,
      modelFormat,
    },
    assumptions,
    recommendations,
    caveats,
  };
}

export function findLargestSupportedAiModels(hardware: HardwareProfile): {
  comfortableModels: string[];
  compromiseModels: string[];
  poorFitModels: string[];
} {
  const comfortable: string[] = [];
  const compromise: string[] = [];
  const poorFit: string[] = [];

  for (const model of SAMPLE_AI_MODELS) {
    const evalResult = evaluateLocalAiCompatibility(hardware, model, 8192);
    if (evalResult.canRun && (evalResult.residency === "FULL_GPU" || evalResult.residency === "FULL_UNIFIED_MEMORY")) {
      comfortable.push(model.name);
    } else if (evalResult.canRun && (evalResult.residency === "PARTIAL_GPU_OFFLOAD" || evalResult.residency === "CPU_ONLY")) {
      compromise.push(model.name);
    } else {
      poorFit.push(model.name);
    }
  }

  return {
    comfortableModels: comfortable,
    compromiseModels: compromise,
    poorFitModels: poorFit,
  };
}
