"use client";

import React from "react";
import { Code, Bot, Layers, Palette, Gamepad2, Laptop, ShieldCheck } from "lucide-react";

interface FitFingerprintRadarProps {
  metrics: {
    development: number;
    localAi: number;
    multitasking: number;
    creative: number;
    gaming: number;
    portability: number;
    futureHeadroom: number;
  };
  title?: string;
}

export function FitFingerprintRadar({ metrics, title = "Fit Fingerprint for Your Needs" }: FitFingerprintRadarProps) {
  const categories = [
    { key: "development", name: "Development", val: metrics.development, icon: Code, color: "var(--res-cpu)" },
    { key: "localAi", name: "Local AI & Agents", val: metrics.localAi, icon: Bot, color: "var(--brand-violet)" },
    { key: "multitasking", name: "Multitasking Memory", val: metrics.multitasking, icon: Layers, color: "var(--res-ram)" },
    { key: "creative", name: "Creative & Media", val: metrics.creative, icon: Palette, color: "var(--res-vram)" },
    { key: "gaming", name: "Gaming & Graphics", val: metrics.gaming, icon: Gamepad2, color: "var(--res-gpu)" },
    { key: "portability", name: "Portability & Form", val: metrics.portability, icon: Laptop, color: "var(--res-storage)" },
    { key: "futureHeadroom", name: "Future Longevity", val: metrics.futureHeadroom, icon: ShieldCheck, color: "var(--status-excellent)" },
  ];

  const getTierBadge = (val: number) => {
    if (val >= 85) return { label: "Excellent", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    if (val >= 70) return { label: "Good", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    if (val >= 50) return { label: "Moderate", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    return { label: "Constrained", bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
  };

  return (
    <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-primary">
            Holistic Sizing Matrix
          </span>
          <h3 className="text-base font-bold text-content-strong font-mono">{title}</h3>
        </div>
        <span className="text-xs text-content-muted font-mono">7 Workload Dimensions</span>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const badge = getTierBadge(cat.val);

          return (
            <div key={cat.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: cat.color }} />
                  <span className="font-bold text-content-strong">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-content-muted font-semibold w-10 text-right">{cat.val}%</span>
                </div>
              </div>

              {/* Segmented / Smooth Capacity Meter */}
              <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.val}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
