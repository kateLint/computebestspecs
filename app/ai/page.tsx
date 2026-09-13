"use client";

import React, { useState, useMemo } from "react";
import { CANONICAL_AI_MODELS, AiModelArchitecture } from "@/lib/ai/ai-models-catalog";
import { CANONICAL_AI_ACCELERATORS, AiAccelerator } from "@/lib/ai/ai-hardware-catalog";
import {
  evaluateLlmFit,
  QUANTIZATION_PRESETS,
  QuantizationFormat,
} from "@/lib/ai/llm-sizing-engine";
import {
  Cpu,
  Sparkles,
  Zap,
  Layers,
  HardDrive,
  ShieldCheck,
  Server,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronDown,
  Search,
  Gauge,
  Info,
  Terminal,
  Share2,
} from "lucide-react";

export default function LocalAiPage() {
  const [selectedModelId, setSelectedModelId] = useState<string>("llama-3-1-8b");
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>("rtx-4070-12g");
  const [quantFormat, setQuantFormat] = useState<QuantizationFormat>("Q4_K_M");
  const [contextTokens, setContextTokens] = useState<number>(8192);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [modelSearch, setModelSearch] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const selectedModel = useMemo(() => {
    return CANONICAL_AI_MODELS.find((m) => m.id === selectedModelId) || CANONICAL_AI_MODELS[0];
  }, [selectedModelId]);

  const selectedHardware = useMemo(() => {
    return CANONICAL_AI_ACCELERATORS.find((a) => a.id === selectedHardwareId) || CANONICAL_AI_ACCELERATORS[0];
  }, [selectedHardwareId]);

  const filteredModels = useMemo(() => {
    if (!modelSearch) return CANONICAL_AI_MODELS;
    return CANONICAL_AI_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.family.toLowerCase().includes(modelSearch.toLowerCase())
    );
  }, [modelSearch]);

  // Execute pure deterministic LLM Sizing evaluation
  const result = useMemo(() => {
    return evaluateLlmFit(
      selectedModel,
      selectedHardware,
      quantFormat,
      contextTokens,
      batchSize
    );
  }, [selectedModel, selectedHardware, quantFormat, contextTokens, batchSize]);

  const quantMeta = QUANTIZATION_PRESETS[quantFormat];

  // Percentage widths for stacked VRAM bar
  const weightsPercent = Math.min(100, Math.round((result.weightsGiB / result.vramCapacityGiB) * 100));
  const kvPercent = Math.min(100 - weightsPercent, Math.round((result.kvCacheGiB / result.vramCapacityGiB) * 100));
  const reservePercent = Math.min(
    100 - weightsPercent - kvPercent,
    Math.round((result.runtimeReserveGiB / result.vramCapacityGiB) * 100)
  );

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/ai?model=${selectedModel.id}&hw=${selectedHardware.id}&q=${quantFormat}&ctx=${contextTokens}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-fade-in font-sans">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 uppercase">
              Local AI Engine
            </span>
            <span className="text-xs font-mono text-content-muted">
              v1.0 Deterministic LLM Sizing
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-content-strong tracking-tight">
            Can It Run Local AI?
          </h1>
          <p className="text-xs sm:text-sm text-content-body font-normal leading-relaxed">
            Exact mathematical transformer sizing. Computes model weights, attention KV cache scaling (GQA, MLA, Sliding Window, State-Space), framework overhead, and memory-bandwidth bounded throughput (tokens/sec).
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyShareLink}
          className="touch-target px-4 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-elevated text-content-strong border border-border-subtle text-xs font-mono font-bold flex items-center gap-2 self-start sm:self-auto shadow-sm transition-all"
        >
          <Share2 className="h-4 w-4 text-brand-primary" />
          <span>{copiedLink ? "Link Copied!" : "Share Preset"}</span>
        </button>
      </div>

      {/* Main Grid: Controls vs. Real-Time Sizing Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Model & Hardware Selectors */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Model Selector */}
          <div className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-primary" />
                <h2 className="text-xs sm:text-sm font-bold font-mono text-content-strong uppercase tracking-wider">
                  1. Choose AI Model ({CANONICAL_AI_MODELS.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-subtle text-content-muted border border-border-subtle">
                {selectedModel.architecture.toUpperCase()} • {selectedModel.cacheType}
              </span>
            </div>

            {/* Model Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-content-muted" />
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Filter models (e.g. Llama 3.1, DeepSeek, Qwen, Mistral)..."
                className="w-full bg-surface-subtle border border-border-subtle hover:border-border-strong rounded-xl pl-10 pr-3 py-2 text-xs text-content-strong placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono"
              />
            </div>

            {/* Models Dropdown */}
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-surface-subtle border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2.5 text-xs text-content-strong font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
            >
              {filteredModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.paramsB}B params) {m.badge ? `• ${m.badge}` : ""}
                </option>
              ))}
            </select>

            {/* Model Specs Pill Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-center">
              <div className="p-2 rounded-xl bg-surface-subtle border border-border-subtle">
                <span className="text-[9px] uppercase text-content-muted block font-bold">Parameters</span>
                <span className="font-bold text-content-strong">{selectedModel.paramsB}B</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-subtle border border-border-subtle">
                <span className="text-[9px] uppercase text-content-muted block font-bold">Cache Type</span>
                <span className="font-bold text-brand-primary">{selectedModel.cacheType}</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-subtle border border-border-subtle">
                <span className="text-[9px] uppercase text-content-muted block font-bold">Native Context</span>
                <span className="font-bold text-content-strong">{(selectedModel.nativeContext / 1024).toFixed(0)}k</span>
              </div>
            </div>

            {/* Hugging Face Source Citation */}
            <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-content-muted">
              <span>License: <strong className="text-content-strong">{selectedModel.license}</strong></span>
              <a
                href={selectedModel.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline flex items-center gap-1"
              >
                <span>Hugging Face</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* 2. Hardware Accelerator Selector */}
          <div className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-500" />
                <h2 className="text-xs sm:text-sm font-bold font-mono text-content-strong uppercase tracking-wider">
                  2. Choose GPU / Accelerator
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-bold">
                {selectedHardware.memoryGiB} GB VRAM
              </span>
            </div>

            <select
              value={selectedHardwareId}
              onChange={(e) => setSelectedHardwareId(e.target.value)}
              className="w-full bg-surface-subtle border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2.5 text-xs text-content-strong font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
            >
              <optgroup label="NVIDIA Desktop GPUs">
                {CANONICAL_AI_ACCELERATORS.filter((a) => a.maker === "NVIDIA" && a.category === "desktop").map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • {a.bandwidthGBs} GB/s
                  </option>
                ))}
              </optgroup>
              <optgroup label="Apple Silicon Unified Memory">
                {CANONICAL_AI_ACCELERATORS.filter((a) => a.maker === "Apple").map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • {a.bandwidthGBs} GB/s
                  </option>
                ))}
              </optgroup>
              <optgroup label="NVIDIA Laptop GPUs">
                {CANONICAL_AI_ACCELERATORS.filter((a) => a.maker === "NVIDIA" && a.category === "laptop").map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • {a.bandwidthGBs} GB/s
                  </option>
                ))}
              </optgroup>
              <optgroup label="AMD Radeon GPUs">
                {CANONICAL_AI_ACCELERATORS.filter((a) => a.maker === "AMD").map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • {a.bandwidthGBs} GB/s
                  </option>
                ))}
              </optgroup>
              <optgroup label="Workstation Accelerators">
                {CANONICAL_AI_ACCELERATORS.filter((a) => a.category === "workstation").map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} • {a.bandwidthGBs} GB/s
                  </option>
                ))}
              </optgroup>
            </select>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center">
              <div className="p-2 rounded-xl bg-surface-subtle border border-border-subtle">
                <span className="text-[9px] uppercase text-content-muted block font-bold">VRAM</span>
                <span className="font-bold text-content-strong">{selectedHardware.memoryGiB} GB</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-subtle border border-border-subtle">
                <span className="text-[9px] uppercase text-content-muted block font-bold">Bandwidth</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedHardware.bandwidthGBs} GB/s</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-subtle border border-border-subtle">
                <span className="text-[9px] uppercase text-content-muted block font-bold">Memory Type</span>
                <span className="font-bold text-content-strong">{selectedHardware.memoryKind}</span>
              </div>
            </div>
          </div>

            {/* Inference Parameters (Quantization & Context Slider + Numeric Input) */}
            <div className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm font-mono text-xs">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Sliders className="h-4 w-4 text-amber-500" />
                <h2 className="text-xs sm:text-sm font-bold text-content-strong uppercase tracking-wider">
                  3. Quantization & Context Length
                </h2>
              </div>

              {/* Quantization Picker */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-bold text-content-muted uppercase">Quantization Format</label>
                  <span className="text-brand-primary font-bold">{quantMeta.qualityRetention} Quality</span>
                </div>
                <select
                  value={quantFormat}
                  onChange={(e) => setQuantFormat(e.target.value as QuantizationFormat)}
                  className="w-full bg-surface-subtle border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                >
                  {Object.entries(QUANTIZATION_PRESETS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} ({v.bits} bpw)
                    </option>
                  ))}
                </select>
              </div>

              {/* Context Slider & Numeric Input */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <label className="font-bold text-content-muted uppercase">Active Context Length</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={512}
                      max={Math.min(131072, selectedModel.nativeContext)}
                      step={512}
                      value={contextTokens}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && val >= 512) {
                          setContextTokens(Math.min(131072, val));
                        }
                      }}
                      className="w-24 px-2 py-1 bg-surface-subtle border border-border-subtle rounded-lg text-right font-bold text-content-strong focus:ring-2 focus:ring-brand-primary"
                    />
                    <span className="text-content-muted text-[10px]">tokens</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1024}
                  max={Math.min(131072, selectedModel.nativeContext)}
                  step={1024}
                  value={contextTokens}
                  onChange={(e) => setContextTokens(Number(e.target.value))}
                  className="w-full accent-brand-primary cursor-pointer h-2 bg-surface-subtle rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-content-muted">
                  <span>1,024</span>
                  <span>32,768</span>
                  <span>65,536</span>
                  <span>131,072</span>
                </div>
              </div>
            </div>
          </div>

        {/* Right Column: Deterministic Fit & Sizing Analysis */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Verdict Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-md space-y-6 relative overflow-hidden transition-all ${
              result.fitStatus === "comfortable"
                ? "bg-emerald-500/5 border-emerald-500/30"
                : result.fitStatus === "tight"
                ? "bg-amber-500/5 border-amber-500/30"
                : result.fitStatus === "sharding_required"
                ? "bg-purple-500/5 border-purple-500/30"
                : "bg-red-500/5 border-red-500/30"
            }`}
          >
            {/* Header Verdict Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {result.fitStatus === "comfortable" && <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />}
                {result.fitStatus === "tight" && <AlertTriangle className="h-7 w-7 text-amber-500 shrink-0" />}
                {result.fitStatus === "sharding_required" && <Server className="h-7 w-7 text-purple-500 shrink-0" />}
                {result.fitStatus === "oom" && <XCircle className="h-7 w-7 text-red-500 shrink-0" />}
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-content-strong">
                    {result.verdictTitle}
                  </h3>
                  <p className="text-xs text-content-body mt-0.5">
                    {result.verdictDescription}
                  </p>
                </div>
              </div>

              {/* Speed Meter Badge */}
              {result.estimatedDecodeSpeedToks > 0 && (
                <div className="flex flex-col items-center sm:items-end px-4 py-2 rounded-2xl bg-surface-card border border-border-subtle shadow-sm shrink-0">
                  <span className="text-[10px] font-mono uppercase text-content-muted font-bold">Estimated Decode</span>
                  <div className="flex items-baseline gap-1 text-2xl font-black text-brand-primary font-mono">
                    <span>{result.estimatedDecodeSpeedToks}</span>
                    <span className="text-xs font-bold text-content-muted">tok/s</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stacked VRAM Allocation Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-content-strong">
                  VRAM Allocation: {result.totalRequiredGiB} GiB / {result.vramCapacityGiB} GiB
                </span>
                <span
                  className={`font-bold ${
                    result.utilizationPercent > 100
                      ? "text-red-500"
                      : result.utilizationPercent >= 88
                      ? "text-amber-500"
                      : "text-emerald-500"
                  }`}
                >
                  {result.utilizationPercent}% Used
                </span>
              </div>

              {/* Stacked Bar */}
              <div className="h-4 w-full rounded-full bg-surface-subtle overflow-hidden flex border border-border-subtle">
                <div
                  style={{ width: `${weightsPercent}%` }}
                  className="bg-brand-primary h-full transition-all"
                  title={`Model Weights: ${result.weightsGiB} GiB`}
                />
                <div
                  style={{ width: `${kvPercent}%` }}
                  className="bg-purple-500 h-full transition-all"
                  title={`Attention KV Cache: ${result.kvCacheGiB} GiB`}
                />
                <div
                  style={{ width: `${reservePercent}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`CUDA / Runtime Overhead: ${result.runtimeReserveGiB} GiB`}
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-[11px] font-mono text-content-muted pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
                  <span>Weights: <strong className="text-content-strong">{result.weightsGiB} GiB</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span>KV Cache: <strong className="text-content-strong">{result.kvCacheGiB} GiB</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Framework Overhead: <strong className="text-content-strong">{result.runtimeReserveGiB} GiB</strong></span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span>Headroom: <strong className="text-content-strong">{Math.max(0, result.headroomGiB)} GiB</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Quantization Comparison Matrix (Multi-Precision Side-by-Side) */}
          <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-primary" />
                <h3 className="font-bold text-content-strong uppercase tracking-wider">
                  Quantization Precision Matrix
                </h3>
              </div>
              <span className="text-[10px] text-content-muted">
                At {contextTokens.toLocaleString()} tokens
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-border-subtle text-content-muted uppercase text-[10px]">
                    <th className="py-2 pr-3">Format</th>
                    <th className="py-2 px-2">Bits (bpw)</th>
                    <th className="py-2 px-2">Quality</th>
                    <th className="py-2 px-2">Total VRAM</th>
                    <th className="py-2 px-2">Fit Status</th>
                    <th className="py-2 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {(Object.keys(QUANTIZATION_PRESETS) as QuantizationFormat[]).map((qKey) => {
                    const qEval = evaluateLlmFit(
                      selectedModel,
                      selectedHardware,
                      qKey,
                      contextTokens,
                      batchSize
                    );
                    const isCurrent = quantFormat === qKey;
                    const meta = QUANTIZATION_PRESETS[qKey];

                    return (
                      <tr
                        key={qKey}
                        className={`transition-colors ${
                          isCurrent
                            ? "bg-brand-primary/10 font-bold"
                            : "hover:bg-surface-subtle"
                        }`}
                      >
                        <td className="py-2.5 pr-3 text-content-strong flex items-center gap-1.5">
                          {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />}
                          <span>{qKey}</span>
                        </td>
                        <td className="py-2.5 px-2 text-content-body">{meta.bits}</td>
                        <td className="py-2.5 px-2 text-content-body">{meta.qualityRetention}</td>
                        <td className="py-2.5 px-2 text-content-strong">
                          {qEval.totalRequiredGiB} GiB
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              qEval.fitStatus === "comfortable"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : qEval.fitStatus === "tight"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            }`}
                          >
                            {qEval.fitStatus === "comfortable"
                              ? "Fits"
                              : qEval.fitStatus === "tight"
                              ? "Tight"
                              : "OOM"}
                          </span>
                        </td>
                        <td className="py-2.5 pl-2 text-right">
                          {isCurrent ? (
                            <span className="text-[10px] text-brand-primary font-bold">Active</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setQuantFormat(qKey)}
                              className="px-2 py-0.5 rounded bg-surface-subtle hover:bg-surface-elevated text-content-strong border border-border-subtle text-[10px] transition-all hover:border-brand-primary/40"
                            >
                              Select
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Self-Hosted vs Cloud API Comparison */}
          <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h3 className="font-bold text-content-strong uppercase tracking-wider">
                  Cloud API vs. Self-Hosted Operating Estimate
                </h3>
              </div>
              <span className="text-[10px] text-content-muted">Reference Pricing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              {/* 5M Tokens/mo */}
              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase text-content-muted font-bold block">
                  Light (5M Tok/mo)
                </span>
                <div className="text-lg font-black text-content-strong">
                  ${(5 * (selectedModel.paramsB <= 14 ? 0.20 : 0.80)).toFixed(2)}/mo
                </div>
                <span className="text-[10px] text-content-muted">Est. Cloud API Cost</span>
              </div>

              {/* 25M Tokens/mo */}
              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-brand-primary/30 space-y-1">
                <span className="text-[10px] uppercase text-brand-primary font-bold block">
                  Standard (25M Tok/mo)
                </span>
                <div className="text-lg font-black text-brand-primary">
                  ${(25 * (selectedModel.paramsB <= 14 ? 0.20 : 0.80)).toFixed(2)}/mo
                </div>
                <span className="text-[10px] text-content-muted">Est. Cloud API Cost</span>
              </div>

              {/* 100M Tokens/mo */}
              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase text-content-muted font-bold block">
                  Heavy (100M Tok/mo)
                </span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ${(100 * (selectedModel.paramsB <= 14 ? 0.20 : 0.80)).toFixed(2)}/mo
                </div>
                <span className="text-[10px] text-content-muted">Est. Cloud API Cost</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle text-[11px] text-content-body font-sans space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-content-muted">Estimated Local Power Draw:</span>
                <strong className="text-content-strong">
                  ~{(selectedHardware.bandwidthGBs > 500 ? 250 : 120)}W under active generation
                </strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-content-muted">Est. Electricity at 4 hrs/day:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  ~${((selectedHardware.bandwidthGBs > 500 ? 0.25 : 0.12) * 4 * 30 * 0.15).toFixed(2)}/month
                </strong>
              </div>
              <p className="text-[10px] text-content-muted pt-1">
                * Note: Fitting within VRAM enables local offline execution; actual generation speed is strictly bounded by hardware memory bandwidth ({selectedHardware.bandwidthGBs} GB/s).
              </p>
            </div>
          </div>

          {/* Mathematical Trace & Audit Breakdown */}
          <details className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm font-mono text-xs group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-brand-primary" />
                <h3 className="font-bold text-content-strong uppercase tracking-wider">
                  Mathematical Trace & Attention Equations
                </h3>
              </div>
              <span className="text-[10px] text-brand-primary group-open:rotate-180 transition-transform">▼</span>
            </summary>

            <div className="space-y-2 text-[11px] text-content-body leading-relaxed pt-3 border-t border-border-subtle">
              {result.calculationTrace.map((traceLine, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle flex items-start gap-2">
                  <span className="text-brand-primary font-bold">›</span>
                  <span>{traceLine}</span>
                </div>
              ))}
            </div>

            {/* Cache Architecture Callout */}
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5 text-content-body">
              <div className="flex items-center gap-1.5 font-bold text-content-strong">
                <Info className="h-3.5 w-3.5 text-brand-primary" />
                <span>Attention Architecture Insights</span>
              </div>
              <p className="text-[11px] font-sans leading-relaxed text-content-muted">
                {selectedModel.cacheType === "MLA" &&
                  "DeepSeek Multi-Head Latent Attention (MLA) compresses the key-value cache into a compact 512-dim latent vector, reducing KV memory by over 80% compared to standard MHA."}
                {selectedModel.cacheType === "sliding" &&
                  "Mistral Sliding Window Attention limits the attention memory window to 4,096 tokens, ensuring constant KV memory consumption even at extended contexts."}
                {selectedModel.cacheType === "state-space" &&
                  "Mamba State-Space models do not use an attention matrix; their recurrent state is constant per layer, resulting in zero token-growing memory overhead."}
                {selectedModel.cacheType === "GQA" &&
                  "Grouped Query Attention (GQA) groups key-value heads together, reducing KV cache memory by 4x to 8x compared to standard Multi-Head Attention."}
                {selectedModel.cacheType === "hybrid" &&
                  "Gemma 2 Hybrid Attention alternates between local sliding window layers and global attention layers for balanced quality and memory efficiency."}
                {selectedModel.cacheType === "MHA" &&
                  "Standard Multi-Head Attention allocates a full separate key-value head for every query head, resulting in higher memory growth at large context sizes."}
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
