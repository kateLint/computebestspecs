"use client";

import React, { useState } from "react";
import { Bot, Zap, Cpu, Database, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { FitEvaluationResult } from "@/lib/domain/needs-profile";

interface AgentConcurrencySimulatorProps {
  agentSimulation: NonNullable<FitEvaluationResult["agentSimulation"]>;
  modelName?: string;
}

export function AgentConcurrencySimulator({
  agentSimulation,
  modelName = "Qwen 2.5 Coder 14B Q4",
}: AgentConcurrencySimulatorProps) {
  const [selectedAgents, setSelectedAgents] = useState(agentSimulation.maxRecommendedAgents || 2);

  const currentMetric =
    agentSimulation.perAgentMetrics.find((m) => m.agentCount === selectedAgents) ||
    agentSimulation.perAgentMetrics[0];

  const isLimiting = selectedAgents > agentSimulation.maxRecommendedAgents;

  return (
    <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-violet">
              Agentic Workload Sizing
            </span>
            <span className="px-2 py-0.5 rounded-md bg-brand-violet/10 text-brand-violet text-[10px] font-mono font-bold">
              {modelName}
            </span>
          </div>
          <h3 className="text-base font-bold text-content-strong flex items-center gap-2 mt-0.5">
            <Bot className="h-5 w-5 text-brand-violet" />
            Concurrent Autonomous Subagents Simulation
          </h3>
        </div>

        {/* Live Token Speed Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-subtle border border-border-subtle self-start sm:self-auto font-mono text-xs">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Expected:</span>
          <strong className="text-brand-primary font-black">{currentMetric.tokensPerSec} tok/s / agent</strong>
        </div>
      </div>

      {/* Interactive Step Selector (1 to 5 agents) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-content-strong">Simulated Concurrent Agents</span>
          <span className="text-brand-violet font-black">{selectedAgents} Active Agent{selectedAgents > 1 ? "s" : ""}</span>
        </div>

        {/* 44px Touch Stepped Pill Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((count) => {
            const isRec = count <= agentSimulation.maxRecommendedAgents;
            const isSelected = selectedAgents === count;

            return (
              <button
                key={count}
                type="button"
                onClick={() => setSelectedAgents(count)}
                className={`touch-target p-2 rounded-xl font-mono font-bold text-xs flex flex-col items-center justify-center transition-all border ${
                  isSelected
                    ? "bg-brand-violet text-white border-brand-violet shadow-md scale-105"
                    : isRec
                    ? "bg-surface-subtle text-content-strong border-border-subtle hover:bg-surface-elevated"
                    : "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                }`}
                aria-label={`Simulate ${count} concurrent subagents`}
              >
                <span className="text-sm">{count}</span>
                <span className="text-[9px] font-normal opacity-80">
                  {count === 1 ? "Single" : isRec ? "Fit" : "Limit"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Realtime Resource Load Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
          <div className="text-[10px] text-content-muted flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-brand-violet" />
            VRAM Residency
          </div>
          <div className="text-sm font-bold text-content-strong">{currentMetric.vramUsageGb} GB</div>
          <div className="text-[10px] text-content-muted">Model Weights & Context</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
          <div className="text-[10px] text-content-muted flex items-center gap-1">
            <Database className="h-3.5 w-3.5 text-brand-cyan" />
            System RAM Load
          </div>
          <div className="text-sm font-bold text-content-strong">{currentMetric.ramUsageGb} GB</div>
          <div className="text-[10px] text-content-muted">Tools, Docker & Browser</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
          <div className="text-[10px] text-content-muted flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-brand-primary" />
            CPU Core Saturation
          </div>
          <div className="text-sm font-bold text-content-strong">{currentMetric.cpuUsagePct}%</div>
          <div className="text-[10px] text-content-muted">Compiler & Subprocesses</div>
        </div>
      </div>

      {/* Diagnosis Verdict */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 ${
          isLimiting
            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
        }`}
      >
        {isLimiting ? (
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 text-xs">
          <strong className="block font-mono">
            {isLimiting
              ? `Capacity Boundary Exceeded at ${selectedAgents} Agents (${currentMetric.statusLabel})`
              : `Sustainable Multi-Agent Concurrency (${selectedAgents} Agents)`}
          </strong>
          <p className="leading-relaxed opacity-90 font-sans">
            {isLimiting
              ? `Spawning ${selectedAgents} concurrent agents saturates your ${agentSimulation.limitingResource.toUpperCase()} bus, forcing tokens/sec down to ~${currentMetric.tokensPerSec} tok/s as agents compete for inference execution slots.`
              : `Your PC smoothly schedules ${selectedAgents} autonomous agents simultaneously with active tools, Docker containers, and browser automation.`}
          </p>
        </div>
      </div>
    </div>
  );
}
