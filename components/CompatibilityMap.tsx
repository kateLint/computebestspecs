"use client";

import React, { useState } from "react";
import { SelectedWorkload } from "@/lib/domain/software";
import { HardwareProfile } from "@/lib/domain/hardware";
import { CompatibilityResult } from "@/lib/domain/compatibility";
import { Cpu, Layers, Monitor, HardDrive, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CompatibilityMapProps {
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
  result?: CompatibilityResult;
}

interface WorkloadStressMapping {
  softwareName: string;
  intensity: string;
  stressedResources: ("CPU" | "RAM" | "GPU" | "VRAM" | "Storage")[];
  memoryDemandGb: number;
}

export function CompatibilityMap({ hardware, workloads, result }: CompatibilityMapProps) {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  // Map each workload to its key stressed resources
  const workloadMappings: WorkloadStressMapping[] = workloads.map((w) => {
    const name = w.softwareName.toLowerCase();
    const stressed: ("CPU" | "RAM" | "GPU" | "VRAM" | "Storage")[] = ["RAM"];

    if (name.includes("photoshop") || name.includes("premiere") || name.includes("davinci") || name.includes("blender")) {
      stressed.push("GPU", "VRAM");
    }
    if (name.includes("android studio") || name.includes("xcode") || name.includes("unreal") || name.includes("unity")) {
      stressed.push("CPU");
    }
    if (name.includes("emulator") || name.includes("docker") || name.includes("virtualbox")) {
      stressed.push("CPU", "RAM");
    }

    return {
      softwareName: w.softwareName,
      intensity: w.intensity,
      stressedResources: Array.from(new Set(stressed)),
      memoryDemandGb: w.intensity === "heavy" ? 8 : w.intensity === "medium" ? 4 : 2,
    };
  });

  const filterButtons = [
    { id: "RAM", name: "RAM Pressure", icon: Layers, isBottleneck: result?.concurrencyMetrics.ramPressureRatio ? result.concurrencyMetrics.ramPressureRatio > 0.85 : false },
    { id: "CPU", name: "CPU Contention", icon: Cpu, isBottleneck: false },
    { id: "GPU", name: "GPU / Graphics", icon: Monitor, isBottleneck: false },
    { id: "VRAM", name: "VRAM Limits", icon: Layers, isBottleneck: false },
  ];

  return (
    <div className="surface-card p-5 sm:p-6 rounded-3xl border border-border-subtle space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-primary">Interactive Architecture</span>
          <h3 className="text-base font-bold text-content-strong flex items-center gap-2 mt-0.5">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            Workload Concurrency & Resource Map
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-content-muted mr-1 font-mono">Highlight:</span>
          {filterButtons.map((btn) => {
            const isActive = selectedResource === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setSelectedResource(isActive ? null : btn.id)}
                className={`touch-target px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? "bg-brand-primary text-white shadow-md scale-105"
                    : btn.isBottleneck
                    ? "bg-amber-500/10 text-semantic-warning border border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-surface-subtle text-content-body hover:bg-surface-elevated border border-border-subtle"
                }`}
              >
                <btn.icon className="h-3.5 w-3.5" />
                <span>{btn.id}</span>
                {btn.isBottleneck && <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Radial Map */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-surface-subtle border border-border-subtle flex flex-col items-center justify-center min-h-[340px]">
        {/* Central PC Node */}
        <div className="relative z-10 p-5 rounded-2xl bg-surface-card border-2 border-brand-primary/50 shadow-lg text-center max-w-[220px] transition-transform hover:scale-105">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-2 border border-brand-primary/20">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="text-xs font-mono font-bold text-content-strong uppercase tracking-wider">YOUR PC</div>
          <div className="text-[11px] font-mono text-content-body font-semibold truncate mt-1">
            {hardware.cpu.model.split(" ")[0]} • {hardware.ram.totalGb}GB RAM
          </div>
          <div className="text-[10px] font-mono text-content-muted truncate">
            {hardware.gpu?.model ? hardware.gpu.model : "Integrated GPU"}
          </div>
          {result && (
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-[10px] font-mono">
              Score: {result.score}/100
            </div>
          )}
        </div>

        {/* Surrounding Workload Nodes */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-8 relative z-10">
          {workloadMappings.map((w, idx) => {
            const isHighlighted = selectedResource ? w.stressedResources.includes(selectedResource as any) : true;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs transition-all duration-200 ${
                  isHighlighted
                    ? "bg-surface-card border-border-strong shadow-md scale-100 opacity-100"
                    : "bg-surface-card/40 border-border-subtle opacity-40 scale-95"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-bold text-content-strong truncate">{w.softwareName}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-surface-subtle text-content-muted font-mono font-semibold">
                    {w.intensity}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {w.stressedResources.map((res) => {
                    const matchesFilter = selectedResource === res;
                    return (
                      <span
                        key={res}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          matchesFilter
                            ? "bg-brand-primary text-white"
                            : res === "RAM"
                            ? "bg-day-blueEmphasis dark:bg-brand-primary/20 text-brand-primary"
                            : "bg-surface-subtle text-content-muted border border-border-subtle"
                        }`}
                      >
                        {res}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-border-subtle text-[10px] text-content-muted flex items-center justify-between font-mono">
                  <span>Est. Memory:</span>
                  <span className="text-content-strong font-bold">~{w.memoryDemandGb} GB</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanatory Caption */}
      <div className="text-[11px] text-content-muted flex items-center justify-between font-mono">
        <span>
          {selectedResource
            ? `Showing active applications demanding ${selectedResource} capacity.`
            : "Click any resource pill above to trace which applications contribute to system pressure."}
        </span>
        <span className="text-content-muted">{workloads.length} Workloads Connected</span>
      </div>
    </div>
  );
}
