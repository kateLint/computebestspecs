import { describe, it, expect } from "vitest";
import { CANONICAL_AI_MODELS } from "../../lib/ai/ai-models-catalog";
import { CANONICAL_AI_ACCELERATORS } from "../../lib/ai/ai-hardware-catalog";
import {
  calculateWeightMemoryGiB,
  calculateKvCacheMemoryGiB,
  calculateThroughputTokensPerSec,
  evaluateLlmFit,
} from "../../lib/ai/llm-sizing-engine";

describe("Deterministic LLM Sizing & Attention KV Cache Mathematics", () => {
  const llama3_8b = CANONICAL_AI_MODELS.find((m) => m.id === "llama-3-1-8b")!;
  const llama3_70b = CANONICAL_AI_MODELS.find((m) => m.id === "llama-3-1-70b")!;
  const deepseek_v3 = CANONICAL_AI_MODELS.find((m) => m.id === "deepseek-v3-671b")!;
  const mistral_7b = CANONICAL_AI_MODELS.find((m) => m.id === "mistral-7b-v03")!;
  const mamba_2_8b = CANONICAL_AI_MODELS.find((m) => m.id === "mamba-2-8b")!;

  const rtx4070 = CANONICAL_AI_ACCELERATORS.find((a) => a.id === "rtx-4070-12g")!;
  const rtx4090 = CANONICAL_AI_ACCELERATORS.find((a) => a.id === "rtx-4090-24g")!;
  const m4_max_128g = CANONICAL_AI_ACCELERATORS.find((a) => a.id === "apple-m4-max-128g")!;

  it("calculates accurate GGUF 4-bit weight size for 8B and 70B models", () => {
    const weight8b = calculateWeightMemoryGiB(8.03, 4.5, 1.10);
    // 8.03B * 4.5 bits / 8 * 1.10 = ~4.97 GiB
    expect(weight8b).toBeGreaterThan(4.5);
    expect(weight8b).toBeLessThan(5.5);

    const weight70b = calculateWeightMemoryGiB(70.6, 4.5, 1.10);
    // 70.6B * 4.5 bits / 8 * 1.10 = ~43.7 GiB
    expect(weight70b).toBeGreaterThan(40);
    expect(weight70b).toBeLessThan(48);
  });

  it("calculates GQA KV cache scaling with context length", () => {
    const cache4k = calculateKvCacheMemoryGiB(llama3_8b, 4096, 1);
    const cache32k = calculateKvCacheMemoryGiB(llama3_8b, 32768, 1);

    expect(cache4k.kvCacheGiB).toBeGreaterThan(0.2);
    expect(cache4k.kvCacheGiB).toBeLessThan(0.8);

    // 32k should be 8x the 4k cache
    expect(cache32k.kvCacheGiB).toBeGreaterThan(cache4k.kvCacheGiB * 7);
  });

  it("proves DeepSeek MLA compression saves massive VRAM over traditional MHA", () => {
    const mlaResult = calculateKvCacheMemoryGiB(deepseek_v3, 32768, 1);
    // For 671B model, MLA KV cache at 32k tokens is only ~7-8 GiB instead of ~60+ GiB for uncompressed MHA!
    expect(mlaResult.kvCacheGiB).toBeLessThan(15.0);
  });

  it("proves Mistral sliding window caps KV memory growth beyond 4096 tokens", () => {
    const cache4k = calculateKvCacheMemoryGiB(mistral_7b, 4096, 1);
    const cache32k = calculateKvCacheMemoryGiB(mistral_7b, 32768, 1);

    // Sliding window limits memory so 32k context uses the same KV cache as 4k!
    expect(cache32k.kvCacheGiB).toEqual(cache4k.kvCacheGiB);
  });

  it("proves Mamba state-space memory remains completely constant across any context length", () => {
    const state1k = calculateKvCacheMemoryGiB(mamba_2_8b, 1024, 1);
    const state32k = calculateKvCacheMemoryGiB(mamba_2_8b, 32768, 1);

    // Constant recurrent state
    expect(state1k.kvCacheGiB).toEqual(state32k.kvCacheGiB);
    expect(state1k.kvCacheGiB).toBeLessThan(0.5);
  });

  it("evaluates Llama 3.1 8B on RTX 4070 (12GB) -> Fits comfortably", () => {
    const result = evaluateLlmFit(llama3_8b, rtx4070, "Q4_K_M", 8192);

    expect(result.fitStatus).toBe("comfortable");
    expect(result.requiresSharding).toBe(false);
    expect(result.totalRequiredGiB).toBeLessThan(12.0);
    expect(result.estimatedDecodeSpeedToks).toBeGreaterThan(50); // ~65-90 tok/s on RTX 4070
  });

  it("evaluates Llama 3.1 70B on RTX 4090 (24GB) -> Requires Sharding / Multi-GPU", () => {
    const result = evaluateLlmFit(llama3_70b, rtx4090, "Q4_K_M", 8192);

    expect(result.fitStatus).toBe("sharding_required");
    expect(result.requiresSharding).toBe(true);
    expect(result.shardingGpusNeeded).toBe(2); // Fits across 2x RTX 4090 (48GB total)
  });

  it("evaluates Llama 3.1 70B on Apple M4 Max 128GB -> Fits comfortably on single machine", () => {
    const result = evaluateLlmFit(llama3_70b, m4_max_128g, "Q4_K_M", 32768);

    expect(result.fitStatus).toBe("comfortable");
    expect(result.requiresSharding).toBe(false);
    expect(result.totalRequiredGiB).toBeLessThan(60.0);
    expect(result.estimatedDecodeSpeedToks).toBeGreaterThan(8);
  });
});
