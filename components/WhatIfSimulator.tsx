"use client";

import React, { useState, useMemo } from "react";
import { HardwareProfile } from "@/lib/domain/hardware";
import { SelectedWorkload } from "@/lib/domain/software";
import { evaluateCompatibility } from "@/services/compatibility/compatibility-engine";
import { Sparkles, TrendingUp, ArrowRight, Layers, Cpu, Monitor, Check, Info } from "lucide-react";
import { AnimatedNumber } from "./motion/AnimatedNumber";
import { HorizontalScrollContainer } from "@/components/HorizontalScrollContainer";

interface WhatIfSimulatorProps {
  initialHardware: HardwareProfile;
  workloads: SelectedWorkload[];
  currentScore: number;
}

const RAM_OPTIONS = [8, 16, 24, 32, 48, 64, 96, 128];

const GPU_TIERS = [
  { label: "Current", badge: "Baseline", desc: "Your active GPU" },
  { label: "+1 Mid", badge: "+4GB VRAM", desc: "RTX 4070 / Apple M4" },
  { label: "+2 High", badge: "+8GB VRAM", desc: "RTX 4080 / Apple M4 Pro" },
  { label: "+3 Ultra", badge: "+16GB VRAM", desc: "RTX 4090 / Apple M4 Max" },
];

const CPU_TIERS = [
  { label: "Current", badge: "Baseline", desc: "Your active CPU" },
  { label: "+1 Mid", badge: "+15 Pts", desc: "Ryzen 7 / Core Ultra 7 / M4" },
  { label: "+2 High", badge: "+30 Pts", desc: "Ryzen 9 / Core Ultra 9 / M4 Pro" },
  { label: "+3 Ultra", badge: "+45 Pts", desc: "9950X / M4 Max / 24+ Cores" },
];

export function WhatIfSimulator({ initialHardware, workloads, currentScore }: WhatIfSimulatorProps) {
  const [simulatedRam, setSimulatedRam] = useState<number>(Math.max(16, initialHardware.ram.totalGb));
  const [gpuTierUpgrade, setGpuTierUpgrade] = useState<number>(0);
  const [cpuTierUpgrade, setCpuTierUpgrade] = useState<number>(0);

  // Perform instant synchronous evaluation
  const simulatedResult = useMemo(() => {
    const modifiedHardware: HardwareProfile = {
      ...initialHardware,
      ram: {
        ...initialHardware.ram,
        totalGb: simulatedRam,
      },
      gpu: initialHardware.gpu
        ? {
            ...initialHardware.gpu,
            performanceScore: Math.min(100, (initialHardware.gpu.performanceScore || 50) + gpuTierUpgrade * 20),
            vramGb: Math.max(initialHardware.gpu.vramGb || 4, initialHardware.gpu.vramGb ? initialHardware.gpu.vramGb + gpuTierUpgrade * 5 : 8 + gpuTierUpgrade * 4),
          }
        : undefined,
      cpu: {
        ...initialHardware.cpu,
        performanceScore: Math.min(100, (initialHardware.cpu.performanceScore || 50) + cpuTierUpgrade * 15),
      },
    };

    return evaluateCompatibility(modifiedHardware, workloads, [], true);
  }, [initialHardware, workloads, simulatedRam, gpuTierUpgrade, cpuTierUpgrade]);

  const scoreDelta = simulatedResult.score - currentScore;

  const [showTierHelp, setShowTierHelp] = useState<boolean>(false);

  return (
    <div id="what-if-simulator-section" className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-primary">Zero-Lag Simulation</span>
          <h3 className="text-base font-bold text-content-strong flex items-center gap-2 mt-0.5">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            WHAT IF? — Instant Upgrade Simulator
          </h3>
        </div>

        {/* Live Score Diff Badge */}
        <div className="flex items-center gap-3 bg-surface-subtle px-3.5 py-1.5 rounded-xl border border-border-subtle self-start sm:self-auto shadow-sm">
          <div className="text-right">
            <span className="text-[9px] uppercase font-mono font-bold text-content-muted block">Current → Simulated</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-content-muted font-bold">{currentScore}</span>
              <ArrowRight className="h-3 w-3 text-brand-primary" />
              <span className="text-semantic-success font-extrabold text-sm">
                <AnimatedNumber value={simulatedResult.score} durationMs={250} />
              </span>
            </div>
          </div>
          {scoreDelta > 0 && (
            <span className="text-xs font-mono font-bold text-semantic-success bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20">
              +<AnimatedNumber value={scoreDelta} durationMs={250} /> pts
            </span>
          )}
        </div>
      </div>

      {/* Simulator Controls */}
      <div className="space-y-5">
        {/* RAM Slider + Discrete Touch Pill Buttons */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-content-strong flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-resource-ram" />
              Simulate System RAM
            </span>
            <span className="font-bold text-brand-primary">{simulatedRam} GB RAM</span>
          </div>

          <input
            type="range"
            min="8"
            max="128"
            step="8"
            value={simulatedRam}
            onChange={(e) => setSimulatedRam(Number(e.target.value))}
            className="w-full accent-brand-primary cursor-pointer h-2 bg-surface-subtle rounded-lg border border-border-subtle"
          />

          {/* Discrete Quick-Pill Controls with Scroll Buttons */}
          <HorizontalScrollContainer scrollStep={200}>
            {RAM_OPTIONS.map((amt) => {
              const isSelected = simulatedRam === amt;
              const isCurrent = amt === initialHardware.ram.totalGb;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSimulatedRam(amt)}
                  className={`touch-target px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                    isSelected
                      ? "bg-brand-primary text-white shadow-md ring-2 ring-brand-primary/30"
                      : isCurrent
                      ? "bg-surface-elevated text-content-strong border border-border-strong"
                      : "bg-surface-subtle text-content-body hover:bg-surface-elevated border border-border-subtle"
                  }`}
                >
                  {amt}GB {isCurrent && "★"}
                </button>
              );
            })}
          </HorizontalScrollContainer>
        </div>

        {/* GPU & CPU Upgrade Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* GPU Upgrade */}
          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 relative">
                <Monitor className="h-3.5 w-3.5 text-resource-gpu" />
                <span className="text-[10px] font-mono uppercase font-bold text-content-muted">
                  GPU Tier Simulation
                </span>
                
                {/* Interactive Tier Help Trigger */}
                <div
                  className="relative inline-block"
                  onMouseEnter={() => setShowTierHelp(true)}
                  onMouseLeave={() => setShowTierHelp(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShowTierHelp(!showTierHelp)}
                    aria-label="What do GPU & CPU tiers mean?"
                    className="touch-target p-0.5 rounded-full text-brand-primary hover:bg-brand-primary/10 transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>

                  {/* Floating Popover Tooltip */}
                  {showTierHelp && (
                    <div
                      role="tooltip"
                      className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-2xl bg-surface-card border border-border-strong shadow-xl text-xs z-50 animate-fade-in space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-content-strong text-xs">
                        <Info className="h-4 w-4 text-brand-primary" />
                        <span>What do GPU & CPU Tiers mean?</span>
                      </div>
                      <p className="text-[11px] text-content-body font-sans leading-relaxed">
                        Tiers simulate jumping to higher silicon classes.
                      </p>
                      <ul className="text-[11px] font-sans text-content-body space-y-1 list-disc list-inside">
                        <li><strong className="text-content-strong font-mono">+1 Mid:</strong> Mid-tier (RTX 4070 / Apple M4 / Ryzen 7)</li>
                        <li><strong className="text-content-strong font-mono">+2 High:</strong> Enthusiast (RTX 4080 / M4 Pro / Ryzen 9)</li>
                        <li><strong className="text-content-strong font-mono">+3 Ultra:</strong> Workstation power (RTX 4090 / M4 Max / 9950X) with extra VRAM to eliminate 4K/3D & Local AI bottlenecks.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-mono text-brand-violet font-semibold">
                {GPU_TIERS[gpuTierUpgrade].desc}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {GPU_TIERS.map((tier, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setGpuTierUpgrade(idx)}
                  className={`touch-target py-2 px-1 rounded-xl text-[11px] font-mono font-semibold transition-all flex flex-col items-center justify-center ${
                    gpuTierUpgrade === idx
                      ? "bg-brand-violet text-white shadow-sm"
                      : "bg-surface-card text-content-body hover:text-content-strong border border-border-subtle"
                  }`}
                >
                  <span>{tier.label}</span>
                  <span className={`text-[9px] opacity-80 ${gpuTierUpgrade === idx ? "text-white/90" : "text-content-muted"}`}>
                    {tier.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CPU Upgrade */}
          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 relative">
                <Cpu className="h-3.5 w-3.5 text-resource-cpu" />
                <span className="text-[10px] font-mono uppercase font-bold text-content-muted">
                  CPU Tier Simulation
                </span>
                
                {/* Interactive Tier Help Trigger */}
                <div
                  className="relative inline-block"
                  onMouseEnter={() => setShowTierHelp(true)}
                  onMouseLeave={() => setShowTierHelp(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShowTierHelp(!showTierHelp)}
                    aria-label="What do GPU & CPU tiers mean?"
                    className="touch-target p-0.5 rounded-full text-brand-primary hover:bg-brand-primary/10 transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <span className="text-[10px] font-mono text-brand-primary font-semibold">
                {CPU_TIERS[cpuTierUpgrade].desc}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {CPU_TIERS.map((tier, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCpuTierUpgrade(idx)}
                  className={`touch-target py-2 px-1 rounded-xl text-[11px] font-mono font-semibold transition-all flex flex-col items-center justify-center ${
                    cpuTierUpgrade === idx
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-surface-card text-content-body hover:text-content-strong border border-border-subtle"
                  }`}
                >
                  <span>{tier.label}</span>
                  <span className={`text-[9px] opacity-80 ${cpuTierUpgrade === idx ? "text-white/90" : "text-content-muted"}`}>
                    {tier.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Verdict Breakdown & What Improves vs Remains Limited */}
      <div className="space-y-3 pt-3 border-t border-border-subtle">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase block">RAM Pressure</span>
            <span className={`font-bold ${simulatedResult.concurrencyMetrics.ramPressureRatio <= 0.85 ? "text-semantic-success" : "text-amber-500"}`}>
              {Math.round(simulatedResult.concurrencyMetrics.ramPressureRatio * 100)}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase block">Performance Tier</span>
            <span className="font-bold text-brand-primary capitalize">
              {simulatedResult.performanceTier}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase block">Bottlenecks</span>
            <span className="font-bold text-content-strong">
              {simulatedResult.bottlenecks.length === 0 ? "✓ 0 Detected" : `! ${simulatedResult.bottlenecks.length} Remaining`}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase block">Simulated Score</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {simulatedResult.score} pts
            </span>
          </div>
        </div>

        {/* Physical Upgrade Feasibility & Trade-off Notes */}
        <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2 text-xs font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-content-strong text-[11px]">
              <Info className="h-3.5 w-3.5 text-brand-primary" />
              <span>Physical Upgrade Feasibility Check:</span>
            </div>
            {(simulatedRam !== initialHardware.ram.totalGb || gpuTierUpgrade > 0 || cpuTierUpgrade > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSimulatedRam(initialHardware.ram.totalGb);
                  setGpuTierUpgrade(0);
                  setCpuTierUpgrade(0);
                }}
                className="text-[10px] font-mono font-bold text-brand-primary hover:underline"
              >
                Reset to Baseline
              </button>
            )}
          </div>

          <p className="text-[11px] text-content-muted leading-relaxed">
            {initialHardware.ram.type === "Unified" || initialHardware.os.family === "macos"
              ? "Apple Silicon unified memory is soldered directly onto the system-on-chip and cannot be physically upgraded after purchase. A RAM increase requires choosing a higher-tier machine."
              : initialHardware.deviceType === "laptop"
              ? "Laptops with SO-DIMM slots can be physically upgraded with additional RAM modules. Always verify whether your specific laptop model has open memory slots or soldered LPDDR RAM before purchasing."
              : "Desktop PCs with standard motherboard DIMM slots can be easily upgraded by adding or replacing RAM sticks."}
          </p>
        </div>
      </div>
    </div>
  );
}
