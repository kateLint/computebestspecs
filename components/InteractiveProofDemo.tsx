"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, AlertTriangle, Layers, Cpu, Sparkles } from "lucide-react";
import { ResourceFingerprint } from "@/components/ResourceFingerprint";

export function InteractiveProofDemo() {
  const [demoRamUpgrade, setDemoRamUpgrade] = useState(false);

  return (
    <div className="surface-card p-6 sm:p-8 rounded-3xl border border-border-subtle space-y-6 relative overflow-hidden shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary font-mono">
            Interactive Proof Demo
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-content-strong mt-0.5">
            Why minimum requirements don&apos;t tell the whole story
          </h2>
          <p className="text-xs text-content-body mt-0.5 font-sans">
            Every vendor app passes individually, but concurrent load saturates system memory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ResourceFingerprint
            metrics={{
              cpu: 78,
              ram: demoRamUpgrade ? 55 : 94,
              gpu: 65,
              vram: 48,
              disk: 80,
              platform: true,
            }}
            label="Active Stack Fingerprint"
          />
        </div>
      </div>

      {/* Workload + PC Formula Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Workload Stack */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-content-muted font-mono tracking-wider">
              Simultaneous Workload Stack
            </span>
            <span className="text-[10px] font-mono text-brand-primary font-bold">4 Active Apps</span>
          </div>

          <div className="space-y-1.5">
            <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-between">
              <span className="text-content-strong font-medium">Adobe Photoshop</span>
              <span className="text-content-muted font-mono text-[10px]">Heavy RAW Canvas</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-between">
              <span className="text-content-strong font-medium">Android Studio + Emulator</span>
              <span className="text-content-muted font-mono text-[10px]">Gradle + 1080p AVD</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-between">
              <span className="text-content-strong font-medium">Google Chrome (30 Tabs)</span>
              <span className="text-content-muted font-mono text-[10px]">DevTools Active</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-between">
              <span className="text-brand-violet font-medium">Local Coding AI (14B)</span>
              <span className="text-brand-violet font-mono text-[10px]">Active Subprocess</span>
            </div>
          </div>
        </div>

        {/* Plus Symbol */}
        <div className="hidden md:flex md:col-span-1 justify-center text-content-muted font-mono text-xl font-bold">
          +
        </div>

        {/* Target PC Hardware & Result */}
        <div className="md:col-span-6 p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-content-muted font-mono tracking-wider">
              Target PC Configuration
            </span>
            <span className="text-[10px] font-mono text-brand-primary font-bold">Mid-Range Laptop</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-content-body">
              <span>CPU:</span>
              <strong className="text-content-strong">AMD Ryzen 5 5600H (6 Cores)</strong>
            </div>
            <div className="flex justify-between text-content-body">
              <span>RAM:</span>
              <strong className={demoRamUpgrade ? "text-semantic-success" : "text-semantic-warning"}>
                {demoRamUpgrade ? "32 GB DDR4 (Upgraded)" : "16 GB DDR4 (Baseline)"}
              </strong>
            </div>
            <div className="flex justify-between text-content-body">
              <span>GPU:</span>
              <strong className="text-content-strong">RTX 3050 Laptop (4 GB VRAM)</strong>
            </div>
            <div className="flex justify-between text-content-body pt-1 border-t border-border-subtle">
              <span>Estimated Peak Demand:</span>
              <strong className="text-brand-primary">22.8 GB RAM</strong>
            </div>
          </div>

          {/* Diagnostic Result Callout with Defensible Language */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs transition-colors ${
              demoRamUpgrade
                ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-content-strong"
                : "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-content-strong"
            }`}
          >
            {demoRamUpgrade ? (
              <CheckCircle2 className="h-4 w-4 text-semantic-success shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-semantic-warning shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold block font-mono text-xs">
                {demoRamUpgrade
                  ? "32 GB Upgraded • Healthy Memory Headroom"
                  : "16 GB Baseline • High Memory Pressure"}
              </span>
              <p className="text-[11px] leading-relaxed text-content-body font-sans">
                {demoRamUpgrade
                  ? "The modeled workload fits comfortably in system memory with substantially less risk of sustained swap paging."
                  : "Estimated peak concurrent demand is 22.8 GB. The system is likely to rely heavily on memory compression or swap paging during builds and AI subagent activity."}
              </p>
            </div>
          </div>

          {/* Interactive Simulation Toggle */}
          <button
            type="button"
            onClick={() => setDemoRamUpgrade(!demoRamUpgrade)}
            className="touch-target w-full py-2.5 px-4 rounded-xl bg-surface-card hover:bg-surface-elevated text-brand-primary border border-border-subtle text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>{demoRamUpgrade ? "Revert to 16 GB Baseline" : "Simulate 32 GB RAM Upgrade"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
