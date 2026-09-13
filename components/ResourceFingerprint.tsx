"use client";

import React from "react";
import { Cpu, Database, HardDrive, Layers, Monitor, ShieldCheck } from "lucide-react";
import { usePreferencesStore } from "@/lib/stores/preferences-store";

export interface ResourceFingerprintMetrics {
  cpu: number;      // 0-100 score/usage
  ram: number;      // 0-100 utilization ratio or score
  gpu: number;      // 0-100 score/usage
  vram: number;     // 0-100 utilization ratio or score
  disk: number;     // 0-100 score/speed
  platform: boolean | "PASS" | "WARN" | "FAIL"; // Platform compatibility check
}

interface ResourceFingerprintProps {
  metrics: ResourceFingerprintMetrics;
  label?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  activeComponent?: string | null;
  onSelectComponent?: (component: string) => void;
  layout?: "auto" | "horizontal" | "stacked";
}

export function ResourceFingerprint({
  metrics,
  label,
  size = "md",
  interactive = false,
  activeComponent = null,
  onSelectComponent,
  layout = "auto",
}: ResourceFingerprintProps) {
  const detailLevel = usePreferencesStore((state) => state.detailLevel);

  // Exact Resource Color Identity (Mapped to Day/Night adaptive CSS variables)
  const bars = [
    { id: "cpu", name: "CPU", val: metrics.cpu, color: "var(--res-cpu)", icon: Cpu, desc: "Processing Throughput" },
    { id: "ram", name: "RAM", val: metrics.ram, color: "var(--res-ram)", icon: Layers, desc: "Working Memory Capacity" },
    { id: "gpu", name: "GPU", val: metrics.gpu, color: "var(--res-gpu)", icon: Monitor, desc: "Graphics & Compute Engine" },
    { id: "vram", name: "VRAM", val: metrics.vram, color: "var(--res-vram)", icon: Database, desc: "Video Memory Buffer" },
    { id: "disk", name: "Disk", val: metrics.disk, color: "var(--res-storage)", icon: HardDrive, desc: "Storage IOPS & Speed" },
    {
      id: "platform",
      name: "Platform",
      val: metrics.platform === true || metrics.platform === "PASS" ? 100 : metrics.platform === "WARN" ? 60 : 20,
      color: "var(--res-platform)",
      isPlatform: true,
      icon: ShieldCheck,
      desc: "OS & Instruction Architecture",
    },
  ];

  const getSegments = (val: number) => {
    const count = 8;
    const filled = Math.min(count, Math.max(1, Math.round((val / 100) * count)));
    return { count, filled };
  };

  return (
    <div className="w-full bg-surface-card p-4 rounded-2xl border border-border-subtle font-mono text-[10px] shadow-sm">
      {label && (
        <div className="text-[10px] uppercase tracking-wider text-content-body font-bold mb-3 pb-1.5 border-b border-border-subtle flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[9px] text-content-muted">6-RESOURCE FINGERPRINT</span>
        </div>
      )}

      {/* Responsive Layout: Horizontal on >=md, Stacked on mobile when layout="auto" */}
      <div className={`${layout === "stacked" ? "flex flex-col gap-2" : "hidden sm:flex items-end justify-between gap-2 sm:gap-3"}`}>
        {bars.map((bar) => {
          const { count, filled } = getSegments(bar.val);
          const isSelected = activeComponent === bar.id;

          return (
            <div
              key={bar.id}
              onClick={() => interactive && onSelectComponent?.(bar.id)}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${
                interactive ? "cursor-pointer hover:opacity-100 group" : ""
              } ${isSelected ? "opacity-100 scale-105" : interactive ? "opacity-80" : "opacity-100"}`}
            >
              {/* Vertical Segmented Meter */}
              <div
                className={`w-full max-w-[28px] h-20 flex flex-col-reverse gap-0.5 p-0.5 rounded-lg bg-surface-subtle border ${
                  isSelected ? "border-brand-primary ring-1 ring-brand-primary/50" : "border-border-subtle"
                }`}
              >
                {Array.from({ length: count }).map((_, idx) => {
                  const isFilled = idx < filled;
                  return (
                    <div
                      key={idx}
                      className="h-2 w-full rounded-[2px] transition-colors"
                      style={{
                        backgroundColor: isFilled ? bar.color : "var(--border-subtle)",
                        opacity: isFilled ? 1 : 0.35,
                      }}
                    />
                  );
                })}
              </div>

              {/* Label & Value */}
              <div className="text-center w-full">
                <span className="block text-[10px] font-bold text-content-body group-hover:text-content-strong">
                  {bar.name}
                </span>
                <span className="block text-[9px] text-content-muted font-mono mt-0.5">
                  {bar.isPlatform ? (bar.val >= 90 ? "✓" : "!") : `${bar.val}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Stacked Breakdown View (<sm) */}
      <div className={`${layout === "horizontal" ? "hidden" : "sm:hidden space-y-2.5"}`}>
        {bars.map((bar) => {
          const isSelected = activeComponent === bar.id;
          const Icon = bar.icon;

          return (
            <div
              key={bar.id}
              onClick={() => interactive && onSelectComponent?.(bar.id)}
              className={`p-2.5 rounded-xl border transition-all ${
                isSelected
                  ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                  : "border-border-subtle bg-surface-subtle"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" style={{ color: bar.color }} />
                  <span className="text-xs font-bold text-content-strong">{bar.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-content-strong">
                  {bar.isPlatform ? (bar.val >= 90 ? "✓ Optimal" : "! Warning") : `${bar.val}% Capacity`}
                </span>
              </div>

              {/* Horizontal Capacity Bar */}
              <div className="h-2 w-full rounded-full bg-border-subtle overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${bar.val}%`,
                    backgroundColor: bar.color,
                  }}
                />
              </div>

              {detailLevel === "technical" && (
                <div className="mt-1 text-[9px] text-content-muted">
                  {bar.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
