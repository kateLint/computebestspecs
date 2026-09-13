"use client";

import React, { useState } from "react";
import { HardwareProfile } from "@/lib/domain/hardware";
import { Zap, AlertTriangle, CheckCircle2, TrendingDown, Gauge } from "lucide-react";

interface StressMySetupProps {
  hardware: HardwareProfile;
  baseScore: number;
}

export function StressMySetup({ hardware, baseScore }: StressMySetupProps) {
  // Stress Level: 0 = Normal Use, 1 = Heavy Multitask, 2 = Peak / Stress Load
  const [stressLevel, setStressLevel] = useState<number>(1);

  const ramGb = hardware.ram.totalGb;

  // Realistic stress scenarios based on physical RAM
  const stressProfiles = [
    {
      level: 0,
      title: "Normal Workflow",
      description: "1-2 primary apps open, standard layer/project size, 10 browser tabs.",
      ramDemandGb: Math.round(ramGb * 0.5),
      scorePenalty: 0,
      breakdown: [
        { name: "Photoshop", detail: "Standard 24MP canvas" },
        { name: "Android Studio", detail: "Single Gradle project" },
        { name: "Browser", detail: "10 tabs" },
      ],
    },
    {
      level: 1,
      title: "Heavy Multitasking",
      description: "Active simultaneous builds, 1-2 emulators running, 25+ browser tabs.",
      ramDemandGb: Math.round(ramGb * 0.85),
      scorePenalty: ramGb < 32 ? 14 : 6,
      breakdown: [
        { name: "Photoshop", detail: "Multi-layered RAW project" },
        { name: "Android Studio", detail: "Large project + Emulator ×1" },
        { name: "Browser", detail: "25 tabs + DevTools" },
      ],
    },
    {
      level: 2,
      title: "Extreme Stress / Peak Load",
      description: "Multiple emulators/containers, 4K canvas renders, 40+ browser tabs.",
      ramDemandGb: Math.round(ramGb * 1.35),
      scorePenalty: ramGb < 32 ? 28 : ramGb < 64 ? 12 : 5,
      breakdown: [
        { name: "Photoshop", detail: "Heavy 4K composite canvas" },
        { name: "Android Studio", detail: "Large build + Emulator ×2" },
        { name: "Browser & Tools", detail: "40+ tabs + background Docker" },
      ],
    },
  ];

  const current = stressProfiles[stressLevel];
  const simulatedScore = Math.max(20, baseScore - current.scorePenalty);
  const isOvercommitted = current.ramDemandGb > ramGb;

  return (
    <div className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-primary">Dynamic Simulation</span>
          <h3 className="text-base font-bold text-content-strong flex items-center gap-2 mt-0.5">
            <Gauge className="h-4 w-4 text-brand-primary" />
            Stress My Setup — What happens when everything gets busy?
          </h3>
        </div>

        {/* Stepper buttons (Touch-Friendly >= 44px) */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-2xl border border-border-subtle self-start sm:self-auto">
          {["Normal", "Heavy", "Peak Stress"].map((name, idx) => (
            <button
              key={idx}
              onClick={() => setStressLevel(idx)}
              className={`touch-target px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                stressLevel === idx
                  ? "bg-brand-primary text-white shadow-md"
                  : "text-content-muted hover:text-content-strong"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-content-strong">{current.title}</span>
          <span className="text-content-muted">
            Est. Demand: <strong className="text-content-strong">{current.ramDemandGb} GB</strong> / {ramGb} GB Physical
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="1"
          value={stressLevel}
          onChange={(e) => setStressLevel(Number(e.target.value))}
          className="w-full accent-brand-primary cursor-pointer h-2 bg-surface-subtle rounded-lg border border-border-subtle"
        />
        <div className="flex justify-between text-[10px] text-content-muted font-mono">
          <span>Level 1: Normal (10 tabs)</span>
          <span>Level 2: Heavy (25 tabs + 1 Emu)</span>
          <span>Level 3: Peak (40 tabs + 2 Emu)</span>
        </div>
      </div>

      {/* Dynamic Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Score Shift Card */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
          <div className="text-[10px] font-mono font-bold text-content-muted uppercase">Workload Readiness Score</div>
          <div className="flex items-baseline gap-2 mt-2 font-mono">
            <span className="text-3xl font-black text-content-strong">{simulatedScore}</span>
            <span className="text-xs text-content-muted">/ 100</span>
            {current.scorePenalty > 0 && (
              <span className="text-xs font-bold text-semantic-critical flex items-center gap-0.5 ml-auto">
                <TrendingDown className="h-3.5 w-3.5" />
                -{current.scorePenalty} pts
              </span>
            )}
          </div>
          <div className="text-[11px] text-content-body mt-2">
            {simulatedScore >= 80 ? "Smooth responsiveness" : simulatedScore >= 65 ? "Noticeable micro-stutters" : "Heavy paging & disk swap"}
          </div>
        </div>

        {/* Memory Pressure Meter */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle flex flex-col justify-between sm:col-span-2">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-content-muted uppercase">
            <span>Physical RAM Headroom</span>
            <span className={isOvercommitted ? "text-semantic-critical" : "text-semantic-success"}>
              {isOvercommitted ? "! Paging to SSD" : "✓ In-Memory"}
            </span>
          </div>

          <div className="space-y-1.5 mt-2">
            <div className="w-full h-3 bg-surface-main rounded-full overflow-hidden p-0.5 border border-border-subtle">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOvercommitted
                    ? "bg-gradient-to-r from-semantic-warning to-semantic-critical"
                    : "bg-gradient-to-r from-semantic-success to-brand-primary"
                }`}
                style={{ width: `${Math.min(100, (current.ramDemandGb / ramGb) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-content-muted font-mono">
              <span>0 GB</span>
              <span>{ramGb} GB (Physical)</span>
              <span>{Math.max(ramGb, current.ramDemandGb)} GB</span>
            </div>
          </div>

          <div className="text-[11px] text-content-body mt-2">
            {isOvercommitted
              ? `Your PC will swap ~${current.ramDemandGb - ramGb} GB into SSD virtual memory during peak loads.`
              : "All active working sets fit comfortably within physical RAM."}
          </div>
        </div>
      </div>

      {/* Active Workload Composition */}
      <div className="pt-2 border-t border-border-subtle">
        <div className="text-[10px] font-mono font-bold text-content-muted uppercase tracking-wider mb-2">
          Simulated Active Workloads at this intensity:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {current.breakdown.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-surface-main border border-border-subtle text-xs">
              <div className="font-bold text-content-strong">{item.name}</div>
              <div className="text-[10px] text-content-muted font-mono">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
