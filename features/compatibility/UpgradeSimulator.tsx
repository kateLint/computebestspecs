"use client";

import { useState } from "react";
import { HardwareProfile } from "@/lib/domain/hardware";
import { SelectedWorkload } from "@/lib/domain/software";
import { evaluateCompatibility } from "@/services/compatibility/compatibility-engine";
import { Sparkles, TrendingUp } from "lucide-react";

interface UpgradeSimulatorProps {
  initialHardware: HardwareProfile;
  workloads: SelectedWorkload[];
  currentScore: number;
}

export function UpgradeSimulator({ initialHardware, workloads, currentScore }: UpgradeSimulatorProps) {
  const [simulatedRam, setSimulatedRam] = useState(initialHardware.ram.totalGb);
  const [simulatedStorageType, setSimulatedStorageType] = useState(initialHardware.storage[0]?.type || "NVME_SSD");

  // Create simulated profile
  const simulatedProfile: HardwareProfile = {
    ...initialHardware,
    ram: { ...initialHardware.ram, totalGb: simulatedRam },
    storage: [{ ...initialHardware.storage[0], type: simulatedStorageType, totalGb: 1000 }],
  };

  // Run instant deterministic evaluation for the what-if profile
  const simulatedResult = evaluateCompatibility(simulatedProfile, workloads, [], true);
  const scoreDiff = simulatedResult.score - currentScore;

  return (
    <div className="surface-card p-5 sm:p-6 rounded-3xl border border-brand-primary/20 shadow-sm space-y-5 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <h3 className="text-sm font-bold text-content-strong flex items-center gap-2 font-sans">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span>Interactive &quot;What-If&quot; Upgrade Simulator</span>
          </h3>
          <p className="text-xs text-content-body font-sans mt-0.5">
            Simulate hardware upgrades to test how bottlenecks and overall scores respond in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-subtle px-3 py-1.5 rounded-xl border border-border-subtle shrink-0">
          <span className="text-xs text-content-muted">Simulated Score:</span>
          <span className="text-sm font-black text-content-strong">{simulatedResult.score}/100</span>
          {scoreDiff > 0 && (
            <span className="text-xs font-bold text-semantic-success flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" /> +{scoreDiff} pts
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* RAM Simulator Slider */}
        <div className="p-3.5 bg-surface-subtle rounded-2xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-content-muted uppercase">Simulated RAM:</span>
            <span className="text-brand-primary">{simulatedRam} GB</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[8, 16, 32, 64, 128].map((gb) => (
              <button
                key={gb}
                type="button"
                onClick={() => setSimulatedRam(gb)}
                className={`touch-target py-1.5 rounded-xl text-xs font-bold transition-all ${
                  simulatedRam === gb
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-surface-card text-content-body border border-border-subtle hover:text-content-strong hover:bg-surface-elevated"
                }`}
              >
                {gb}GB
              </button>
            ))}
          </div>
        </div>

        {/* Storage Type Simulator */}
        <div className="p-3.5 bg-surface-subtle rounded-2xl border border-border-subtle space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-content-muted uppercase">Simulated Drive:</span>
            <span className="text-emerald-600 dark:text-emerald-400">{simulatedStorageType}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { type: "NVME_SSD", label: "NVMe SSD" },
              { type: "SATA_SSD", label: "SATA SSD" },
              { type: "HDD", label: "HDD" },
            ].map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSimulatedStorageType(type as any)}
                className={`touch-target py-1.5 rounded-xl text-xs font-bold transition-all ${
                  simulatedStorageType === type
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-surface-card text-content-body border border-border-subtle hover:text-content-strong hover:bg-surface-elevated"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
