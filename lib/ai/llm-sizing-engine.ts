import { AiModelArchitecture } from "./ai-models-catalog";
import { AiAccelerator } from "./ai-hardware-catalog";

export type QuantizationFormat =
  | "FP16"
  | "Q8_0"
  | "Q6_K"
  | "Q5_K_M"
  | "Q4_K_M"
  | "Q3_K_M"
  | "IQ2_XXS";

export interface QuantizationMeta {
  format: QuantizationFormat;
  bits: number;
  label: string;
  artifactFactor: number;
  qualityRetention: string;
}

export const QUANTIZATION_PRESETS: Record<QuantizationFormat, QuantizationMeta> = {
  FP16: { format: "FP16", bits: 16, label: "16-bit Unquantized (Full Precision)", artifactFactor: 1.05, qualityRetention: "100% (Reference)" },
  Q8_0: { format: "Q8_0", bits: 8, label: "8-bit (Near Zero Loss)", artifactFactor: 1.07, qualityRetention: "99.8%" },
  Q6_K: { format: "Q6_K", bits: 6.5, label: "6-bit K-Quant (High Quality)", artifactFactor: 1.08, qualityRetention: "99.1%" },
  Q5_K_M: { format: "Q5_K_M", bits: 5.5, label: "5-bit K-Medium (Sweet Spot)", artifactFactor: 1.09, qualityRetention: "98.2%" },
  Q4_K_M: { format: "Q4_K_M", bits: 4.5, label: "4-bit K-Medium (Standard Recommended)", artifactFactor: 1.10, qualityRetention: "96.5%" },
  Q3_K_M: { format: "Q3_K_M", bits: 3.5, label: "3-bit K-Medium (Low Memory)", artifactFactor: 1.12, qualityRetention: "92.0%" },
  IQ2_XXS: { format: "IQ2_XXS", bits: 2.2, label: "2-bit I-Quant (Maximum Compression)", artifactFactor: 1.15, qualityRetention: "82.5%" },
};

export interface LlmSizingResult {
  weightsGiB: number;
  kvCacheGiB: number;
  runtimeReserveGiB: number;
  totalRequiredGiB: number;
  vramCapacityGiB: number;
  headroomGiB: number;
  utilizationPercent: number;
  fitStatus: "comfortable" | "tight" | "oom" | "sharding_required";
  verdictTitle: string;
  verdictDescription: string;
  estimatedDecodeSpeedToks: number;
  requiresSharding: boolean;
  shardingGpusNeeded: number;
  calculationTrace: string[];
}

/**
 * 1. Model Weights Memory Calculation (in GiB)
 */
export function calculateWeightMemoryGiB(
  paramsB: number,
  quantizationBits: number,
  artifactFactor: number = 1.10
): number {
  // params (B) * 10^9 * (bits / 8) bytes / (1024^3) * artifactFactor
  const bytes = (paramsB * 1e9 * quantizationBits) / 8;
  const gib = (bytes / (1024 * 1024 * 1024)) * artifactFactor;
  return Number(gib.toFixed(2));
}

/**
 * 2. Exact KV Cache & State Memory Calculation (in GiB)
 * Accounts for MHA, GQA, DeepSeek MLA, Mistral Sliding Window, and Mamba State-Space.
 */
export function calculateKvCacheMemoryGiB(
  model: AiModelArchitecture,
  contextTokens: number,
  batchSize: number = 1,
  cacheDtypeBytes: number = 2 // FP16 KV cache = 2 bytes
): { kvCacheGiB: number; trace: string } {
  const { layers, hiddenSize, attentionHeads, kvHeads, cacheType } = model;
  const headDim = model.headDim || (attentionHeads > 0 ? Math.floor(hiddenSize / attentionHeads) : 128);

  let totalBytes = 0;
  let trace = "";

  if (cacheType === "state-space") {
    // Mamba / RWKV recurrent state is constant regardless of context length!
    const stateBytesPerLayer = model.recurrentStateBytesPerLayer || hiddenSize * cacheDtypeBytes;
    totalBytes = layers * stateBytesPerLayer * batchSize;
    trace = `State-space recurrent memory = ${layers} layers × ${stateBytesPerLayer} B/layer × batch ${batchSize}`;
  } else if (cacheType === "MLA") {
    // DeepSeek Multi-Head Latent Attention
    const kvLoraRank = model.mlaKvLoraRank || 512;
    const qkRopeDim = model.qkRopeHeadDim || 64;
    const effectiveLatentDim = kvLoraRank + qkRopeDim;
    totalBytes = layers * effectiveLatentDim * contextTokens * batchSize * cacheDtypeBytes;
    trace = `DeepSeek MLA compressed cache = ${layers} layers × (${kvLoraRank} KV-LoRA + ${qkRopeDim} RoPE) × ${contextTokens} tokens × batch ${batchSize} × ${cacheDtypeBytes}B`;
  } else if (cacheType === "sliding") {
    // Mistral Sliding Window Attention
    const window = model.slidingWindow || 4096;
    const effectiveTokens = Math.min(contextTokens, window);
    totalBytes = 2 * layers * kvHeads * headDim * effectiveTokens * batchSize * cacheDtypeBytes;
    trace = `Sliding window cache = 2 × ${layers} layers × ${kvHeads} KV-heads × ${headDim} headDim × min(${contextTokens}, ${window}) tokens × ${cacheDtypeBytes}B`;
  } else if (cacheType === "hybrid") {
    // Gemma Hybrid (Sliding local + periodic full global attention)
    const window = model.slidingWindow || 4096;
    const globalEvery = model.globalAttentionEvery || 2;
    const globalLayers = Math.ceil(layers / globalEvery);
    const localLayers = layers - globalLayers;
    const localBytes = 2 * localLayers * kvHeads * headDim * Math.min(contextTokens, window) * batchSize * cacheDtypeBytes;
    const globalBytes = 2 * globalLayers * kvHeads * headDim * contextTokens * batchSize * cacheDtypeBytes;
    totalBytes = localBytes + globalBytes;
    trace = `Hybrid cache = Local (${localLayers} layers × min(${contextTokens}, ${window})) + Global (${globalLayers} layers × ${contextTokens} tokens)`;
  } else {
    // Standard GQA or MHA Transformer Attention
    totalBytes = 2 * layers * kvHeads * headDim * contextTokens * batchSize * cacheDtypeBytes;
    trace = `Standard ${cacheType} cache = 2 × ${layers} layers × ${kvHeads} KV-heads × ${headDim} headDim × ${contextTokens} tokens × batch ${batchSize} × ${cacheDtypeBytes}B`;
  }

  const kvCacheGiB = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));
  return { kvCacheGiB, trace };
}

/**
 * 3. Theoretical Decode Throughput (in tok/s)
 * Memory-bandwidth bound equation for single-token autoregressive decoding.
 */
export function calculateThroughputTokensPerSec(
  bandwidthGBs: number,
  weightGiB: number,
  efficiencyFactor: number = 0.80
): number {
  if (weightGiB <= 0 || bandwidthGBs <= 0) return 0;
  const theoreticalMax = bandwidthGBs / weightGiB;
  return Math.round(theoreticalMax * efficiencyFactor);
}

/**
 * 4. Master LLM Sizing & Compatibility Evaluation
 */
export function evaluateLlmFit(
  model: AiModelArchitecture,
  hardware: AiAccelerator,
  quantFormat: QuantizationFormat = "Q4_K_M",
  contextTokens: number = 4096,
  batchSize: number = 1
): LlmSizingResult {
  const quant = QUANTIZATION_PRESETS[quantFormat] || QUANTIZATION_PRESETS.Q4_K_M;

  // 1. Calculate Weights
  const weightsGiB = calculateWeightMemoryGiB(model.paramsB, quant.bits, quant.artifactFactor);

  // 2. Calculate Attention KV Cache
  const { kvCacheGiB, trace: kvTrace } = calculateKvCacheMemoryGiB(model, contextTokens, batchSize);

  // 3. Runtime & CUDA Overhead buffer (CUDA context + PyTorch scratchpad: ~0.8 GB to 1.5 GB)
  const runtimeReserveGiB = hardware.maker === "Apple" ? 0.6 : 1.2;

  // 4. Total Sizing & Headroom
  const totalRequiredGiB = Number((weightsGiB + kvCacheGiB + runtimeReserveGiB).toFixed(2));
  const vramCapacityGiB = hardware.memoryGiB;
  const headroomGiB = Number((vramCapacityGiB - totalRequiredGiB).toFixed(2));
  const utilizationPercent = Math.round((totalRequiredGiB / vramCapacityGiB) * 100);

  // 5. Sharding Requirements for Multi-GPU
  const requiresSharding = totalRequiredGiB > vramCapacityGiB;
  const shardingGpusNeeded = requiresSharding ? Math.ceil(totalRequiredGiB / vramCapacityGiB) : 1;

  // 6. Verdict Classification
  let fitStatus: "comfortable" | "tight" | "oom" | "sharding_required";
  let verdictTitle: string;
  let verdictDescription: string;

  if (requiresSharding) {
    if (shardingGpusNeeded > 1 && totalRequiredGiB <= vramCapacityGiB * 8) {
      fitStatus = "sharding_required";
      verdictTitle = `Requires Sharding across ${shardingGpusNeeded}x ${hardware.name}`;
      verdictDescription = `Model memory (${totalRequiredGiB} GiB) exceeds single GPU VRAM (${vramCapacityGiB} GiB). It will fit when sharded across ${shardingGpusNeeded} GPUs using Tensor Parallelism (vLLM / llama.cpp RPC).`;
    } else {
      fitStatus = "oom";
      verdictTitle = "Out of Memory (OOM)";
      verdictDescription = `Model requires ${totalRequiredGiB} GiB VRAM, exceeding the ${vramCapacityGiB} GiB available on ${hardware.name}. Lower the quantization bits or context tokens.`;
    }
  } else if (utilizationPercent >= 88) {
    fitStatus = "tight";
    verdictTitle = "Fits (Close to the limit)";
    verdictDescription = `Model fits in VRAM (${utilizationPercent}% utilized) with ${headroomGiB} GiB headroom remaining. Avoid large background GPU processes.`;
  } else {
    fitStatus = "comfortable";
    verdictTitle = "Runs Comfortably on Full GPU";
    verdictDescription = `100% of weights and ${contextTokens.toLocaleString()} tokens of KV cache reside in fast VRAM (${utilizationPercent}% capacity). Zero CPU paging penalty.`;
  }

  // 7. Estimated Throughput
  const estimatedDecodeSpeedToks = !requiresSharding
    ? calculateThroughputTokensPerSec(hardware.bandwidthGBs, weightsGiB)
    : 0;

  const calculationTrace = [
    `Model: ${model.name} (${model.paramsB}B parameters, ${model.architecture.toUpperCase()} architecture)`,
    `Precision: ${quant.label} (${quant.bits} bits/weight, ${quant.qualityRetention} quality retention)`,
    `Weights Memory: ${weightsGiB} GiB`,
    `Attention KV Cache: ${kvCacheGiB} GiB (${kvTrace})`,
    `Framework Runtime Reserve: ${runtimeReserveGiB} GiB (${hardware.maker} ${hardware.runtimeSupport.join("/")} runtime)`,
    `Total Required VRAM: ${totalRequiredGiB} GiB / ${vramCapacityGiB} GiB (${utilizationPercent}% memory pressure)`,
    `Theoretical Decode Throughput: ~${estimatedDecodeSpeedToks} tok/s (${hardware.bandwidthGBs} GB/s bus / ${weightsGiB} GiB weight size)`,
  ];

  return {
    weightsGiB,
    kvCacheGiB,
    runtimeReserveGiB,
    totalRequiredGiB,
    vramCapacityGiB,
    headroomGiB,
    utilizationPercent,
    fitStatus,
    verdictTitle,
    verdictDescription,
    estimatedDecodeSpeedToks,
    requiresSharding,
    shardingGpusNeeded,
    calculationTrace,
  };
}
