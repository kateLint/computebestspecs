"use client";

import React from "react";
import { ShieldCheck, Cloud, Cpu, DollarSign, Lock, Zap } from "lucide-react";
import { FitEvaluationResult } from "@/lib/domain/needs-profile";

interface ExecutionStrategyCardProps {
  strategy: FitEvaluationResult["executionStrategy"];
}

export function ExecutionStrategyCard({ strategy }: ExecutionStrategyCardProps) {
  const options = [
    {
      id: "LOCAL",
      title: "Local Hardware Execution",
      icon: Cpu,
      cost: `$${strategy.costAndPrivacy.localMonthlyElectricityEstimateUsd}/mo (Electricity)`,
      privacy: strategy.costAndPrivacy.privacyRating,
      latency: strategy.costAndPrivacy.latencyTier,
      isRecommended: strategy.recommendedStrategy === "LOCAL",
      desc: "Zero ongoing API subscription costs, complete data privacy, and zero latency dependency on internet connectivity.",
    },
    {
      id: "HYBRID",
      title: "Hybrid Local + Cloud",
      icon: Zap,
      cost: "~$15–$25/mo (Targeted API Tokens)",
      privacy: "Medium (Embeddings Local, Complex Cloud)",
      latency: "Low to Moderate (100–180ms)",
      isRecommended: strategy.recommendedStrategy === "HYBRID",
      desc: "Run embeddings and tool parsing locally on your GPU, while routing heavy multi-agent reasoning to Cloud frontier models.",
    },
    {
      id: "CLOUD",
      title: "Pure Cloud API Execution",
      icon: Cloud,
      cost: `$${strategy.costAndPrivacy.cloudMonthlyApiEstimateUsd}/mo (Usage API)`,
      privacy: "External Provider Bound",
      latency: "Network Dependent (>300ms)",
      isRecommended: strategy.recommendedStrategy === "CLOUD",
      desc: "Ideal if local GPU lacks VRAM for model residency, completely offloading heavy computation to cloud datacenters.",
    },
  ];

  return (
    <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-primary">
            Execution Strategy Advisor
          </span>
          <h3 className="text-base font-bold text-content-strong font-mono">
            {strategy.headline}
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-mono text-xs font-bold border border-brand-primary/20">
          Strategy: {strategy.recommendedStrategy}
        </span>
      </div>

      <p className="text-xs text-content-body leading-relaxed font-sans">
        {strategy.strategyExplanation}
      </p>

      {/* 3-Column Execution Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <div
              key={opt.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                opt.isRecommended
                  ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/40 shadow-sm"
                  : "border-border-subtle bg-surface-subtle opacity-80"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-content-strong">
                    <Icon className="h-4 w-4 text-brand-primary" />
                    <span>{opt.title}</span>
                  </div>
                  {opt.isRecommended && (
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-brand-primary text-white font-black">
                      BEST FIT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-content-body font-sans leading-normal">
                  {opt.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-1.5 text-[10px] text-content-muted">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Cost:</span>
                  <strong className="text-content-strong">{opt.cost}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Privacy:</span>
                  <strong className="text-content-strong truncate max-w-[120px]">{opt.privacy}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Latency:</span>
                  <strong className="text-content-strong truncate max-w-[120px]">{opt.latency}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
