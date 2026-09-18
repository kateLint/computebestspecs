"use client";

import React, { useState, useRef, useEffect } from "react";
import { SelectedWorkload } from "@/lib/domain/software";
import { Layers, Plus, Trash2, ChevronDown, ChevronUp, Sliders, Sparkles, X, Info } from "lucide-react";
import { SearchableApplicationPicker, AppPresetOption, EXTENDED_APP_CATALOG } from "./SearchableApplicationPicker";
import { HorizontalScrollContainer } from "@/components/HorizontalScrollContainer";

interface WorkloadBundle {
  id: string;
  name: string;
  emoji: string;
  appIds: string[];
}

export const POPULAR_WORKLOAD_BUNDLES: WorkloadBundle[] = [
  {
    id: "content-creator",
    name: "Video & Design",
    emoji: "🎨",
    appIds: ["premiere-pro", "after-effects", "adobe-photoshop", "google-chrome"],
  },
  {
    id: "fullstack-dev",
    name: "Full-Stack Dev",
    emoji: "💻",
    appIds: ["vs-code", "docker-desktop", "android-studio", "google-chrome"],
  },
  {
    id: "local-ai",
    name: "Local AI & LLMs",
    emoji: "🧠",
    appIds: ["ollama-local-ai", "comfyui-stable-diffusion", "vs-code", "docker-desktop"],
  },
  {
    id: "3d-game-dev",
    name: "3D & Game Engine",
    emoji: "🕹️",
    appIds: ["blender", "unreal-engine", "adobe-photoshop"],
  },
  {
    id: "productivity",
    name: "Office & Multitask",
    emoji: "🏢",
    appIds: ["google-chrome", "slack", "notion", "figma-desktop"],
  },
];

export interface AppVersionHistoryItem {
  version: string;
  label: string;
  isLatest?: boolean;
  minRamBadge?: string;
  releaseYear?: number;
}

export const APP_VERSION_HISTORIES: Record<string, AppVersionHistoryItem[]> = {
  "adobe-photoshop": [
    { version: "2025 (v26.0)", label: "2025 (Latest • Neural & Firefly)", isLatest: true, minRamBadge: "16GB", releaseYear: 2025 },
    { version: "2024 (v25.0)", label: "2024 (1 Ver Down • Generative Fill)", minRamBadge: "16GB", releaseYear: 2024 },
    { version: "2023 (v24.0)", label: "2023 (2 Ver Down • Object Finder)", minRamBadge: "8GB", releaseYear: 2023 },
    { version: "2022 (v23.0)", label: "2022 (3 Ver Down • Legacy LTS)", minRamBadge: "8GB", releaseYear: 2022 },
  ],
  "android-studio": [
    { version: "2024.2 Ladybug", label: "2024.2 Ladybug (Latest)", isLatest: true, minRamBadge: "32GB", releaseYear: 2024 },
    { version: "2024.1 Koala / Iguana", label: "2024.1 Koala / Iguana (1 Ver Down)", minRamBadge: "16GB", releaseYear: 2024 },
    { version: "2023.3 Hedgehog", label: "2023.3 Hedgehog (2 Ver Down)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "2023.1 Giraffe", label: "2023.1 Giraffe (3 Ver Down • Legacy)", minRamBadge: "8GB", releaseYear: 2023 },
  ],
  "blender": [
    { version: "4.2 LTS", label: "4.2 LTS (Latest • Cycles Next)", isLatest: true, minRamBadge: "32GB", releaseYear: 2024 },
    { version: "4.0", label: "4.0 (1 Ver Down • AgX Color)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "3.6 LTS", label: "3.6 LTS (2 Ver Down • Simulation Nodes)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "2.93 LTS", label: "2.93 LTS (3 Ver Down • Legacy OpenGL)", minRamBadge: "8GB", releaseYear: 2021 },
  ],
  "premiere-pro": [
    { version: "2025 (v25.0)", label: "2025 (Latest • Text-Based Edit)", isLatest: true, minRamBadge: "32GB", releaseYear: 2025 },
    { version: "2024 (v24.0)", label: "2024 (1 Ver Down)", minRamBadge: "32GB", releaseYear: 2024 },
    { version: "2023 (v23.0)", label: "2023 (2 Ver Down)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "2022 (v22.0)", label: "2022 (3 Ver Down • Legacy)", minRamBadge: "16GB", releaseYear: 2022 },
  ],
  "after-effects": [
    { version: "2025 (v25.0)", label: "2025 (Latest • 3D Model Import)", isLatest: true, minRamBadge: "32GB", releaseYear: 2025 },
    { version: "2024 (v24.0)", label: "2024 (1 Ver Down • MFR)", minRamBadge: "32GB", releaseYear: 2024 },
    { version: "2023 (v23.0)", label: "2023 (2 Ver Down)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "2022 (v22.0)", label: "2022 (3 Ver Down • Legacy)", minRamBadge: "16GB", releaseYear: 2022 },
  ],
  "unreal-engine": [
    { version: "5.5", label: "5.5 (Latest • MegaLights)", isLatest: true, minRamBadge: "64GB", releaseYear: 2024 },
    { version: "5.4", label: "5.4 (1 Ver Down • Motion Matching)", minRamBadge: "64GB", releaseYear: 2024 },
    { version: "5.3", label: "5.3 (2 Ver Down • Nanite Foliage)", minRamBadge: "32GB", releaseYear: 2023 },
    { version: "4.27", label: "4.27 (3 Ver Down • Legacy UE4)", minRamBadge: "16GB", releaseYear: 2021 },
  ],
  "davinci-resolve": [
    { version: "19.0 Studio", label: "19.0 Studio (Latest • AI Neural)", isLatest: true, minRamBadge: "32GB", releaseYear: 2024 },
    { version: "18.6 Studio", label: "18.6 Studio (1 Ver Down)", minRamBadge: "32GB", releaseYear: 2023 },
    { version: "18.0 Studio", label: "18.0 Studio (2 Ver Down)", minRamBadge: "16GB", releaseYear: 2022 },
    { version: "17.4 Studio", label: "17.4 Studio (3 Ver Down • Legacy)", minRamBadge: "16GB", releaseYear: 2021 },
  ],
  "xcode": [
    { version: "16.0", label: "16.0 (Latest • iOS 18 / macOS 15)", isLatest: true, minRamBadge: "32GB", releaseYear: 2024 },
    { version: "15.4", label: "15.4 (1 Ver Down • iOS 17)", minRamBadge: "16GB", releaseYear: 2024 },
    { version: "15.0", label: "15.0 (2 Ver Down)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "14.3", label: "14.3 (3 Ver Down • iOS 16 Legacy)", minRamBadge: "16GB", releaseYear: 2023 },
  ],
  "autocad": [
    { version: "2025", label: "2025 (Latest • Smart Blocks)", isLatest: true, minRamBadge: "16GB", releaseYear: 2025 },
    { version: "2024", label: "2024 (1 Ver Down)", minRamBadge: "16GB", releaseYear: 2024 },
    { version: "2023", label: "2023 (2 Ver Down)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "2022", label: "2022 (3 Ver Down • Legacy)", minRamBadge: "8GB", releaseYear: 2022 },
  ],
  "solidworks": [
    { version: "2025", label: "2025 (Latest)", isLatest: true, minRamBadge: "32GB", releaseYear: 2025 },
    { version: "2024", label: "2024 (1 Ver Down)", minRamBadge: "32GB", releaseYear: 2024 },
    { version: "2023", label: "2023 (2 Ver Down)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "2022", label: "2022 (3 Ver Down • Legacy)", minRamBadge: "16GB", releaseYear: 2022 },
  ],
  "ableton-live": [
    { version: "12.0", label: "12.0 (Latest • Roar & Meld)", isLatest: true, minRamBadge: "16GB", releaseYear: 2024 },
    { version: "11.3", label: "11.3 (1 Ver Down)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "11.0", label: "11.0 (2 Ver Down)", minRamBadge: "8GB", releaseYear: 2021 },
    { version: "10.1", label: "10.1 (3 Ver Down • Legacy)", minRamBadge: "8GB", releaseYear: 2019 },
  ],
  "fl-studio": [
    { version: "24.1", label: "24.1 (Latest • Kepler Exo)", isLatest: true, minRamBadge: "16GB", releaseYear: 2024 },
    { version: "21.2", label: "21.2 (1 Ver Down • Stem Separation)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "21.0", label: "21.0 (2 Ver Down)", minRamBadge: "8GB", releaseYear: 2022 },
    { version: "20.9", label: "20.9 (3 Ver Down • Legacy)", minRamBadge: "8GB", releaseYear: 2021 },
  ],
  "logic-pro": [
    { version: "11.0", label: "11.0 (Latest • Session Players & Stem Splitter)", isLatest: true, minRamBadge: "16GB", releaseYear: 2024 },
    { version: "10.8", label: "10.8 (1 Ver Down • Mastering Assistant)", minRamBadge: "16GB", releaseYear: 2023 },
    { version: "10.7", label: "10.7 (2 Ver Down • Spatial Audio)", minRamBadge: "8GB", releaseYear: 2022 },
    { version: "10.6", label: "10.6 (3 Ver Down • Legacy)", minRamBadge: "8GB", releaseYear: 2020 },
  ],
  "docker-desktop": [
    { version: "4.34", label: "4.34 (Latest • Docker AI)", isLatest: true, minRamBadge: "16GB", releaseYear: 2024 },
    { version: "4.30", label: "4.30 (1 Ver Down)", minRamBadge: "16GB", releaseYear: 2024 },
    { version: "4.26", label: "4.26 (2 Ver Down)", minRamBadge: "8GB", releaseYear: 2023 },
    { version: "4.20", label: "4.20 (3 Ver Down • Legacy)", minRamBadge: "8GB", releaseYear: 2023 },
  ],
  "ollama-local-ai": [
    { version: "0.3.12", label: "0.3.12 (Latest • Qwen2.5 & Llama 3.2)", isLatest: true, minRamBadge: "32GB", releaseYear: 2024 },
    { version: "0.3.0", label: "0.3.0 (1 Ver Down • Concurrency)", minRamBadge: "32GB", releaseYear: 2024 },
    { version: "0.1.48", label: "0.1.48 (2 Ver Down)", minRamBadge: "16GB", releaseYear: 2024 },
    { version: "0.1.30", label: "0.1.30 (3 Ver Down • Early GGUF)", minRamBadge: "16GB", releaseYear: 2023 },
  ],
};

export function getVersionsForApp(appId: string, currentVersion?: string): AppVersionHistoryItem[] {
  if (APP_VERSION_HISTORIES[appId]) {
    return APP_VERSION_HISTORIES[appId];
  }
  const cur = currentVersion || "Current";
  return [
    { version: cur, label: `${cur} (Latest Release)`, isLatest: true },
    { version: `${cur} - 1`, label: `${cur} (1 Version Down)` },
    { version: `${cur} - 2`, label: `${cur} (2 Versions Down)` },
    { version: `${cur} - 3`, label: `${cur} (3 Versions Down • Legacy)` },
  ];
}

interface WorkloadStackBuilderProps {
  selectedWorkloads: SelectedWorkload[];
  onChange: (workloads: SelectedWorkload[]) => void;
  isSimultaneous: boolean;
  onSimultaneousChange: (val: boolean) => void;
}

export function WorkloadStackBuilder({
  selectedWorkloads,
  onChange,
  isSimultaneous,
  onSimultaneousChange,
}: WorkloadStackBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleApplyBundle = (bundle: WorkloadBundle) => {
    const newWorkloads: SelectedWorkload[] = [];
    for (const appId of bundle.appIds) {
      const app = EXTENDED_APP_CATALOG.find((a) => a.id === appId);
      if (app) {
        newWorkloads.push({
          softwareId: app.id,
          softwareName: app.name,
          softwareVersionId: `ver_${app.id}_${app.versionString.replace(/\./g, "")}`,
          versionString: app.versionString,
          workloadId: `w_${app.id}`,
          workloadName: app.desc,
          intensity: app.defaultIntensity,
          concurrency: app.defaultConcurrency,
          quantity: 1,
        });
      }
    }
    if (newWorkloads.length > 0) {
      onChange(newWorkloads);
    }
  };

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    }
    if (showAddMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddMenu]);

  const handleUpdateIntensity = (index: number, intensity: "light" | "medium" | "heavy") => {
    const updated = [...selectedWorkloads];
    updated[index] = { ...updated[index], intensity };
    onChange(updated);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...selectedWorkloads];
    const newQty = Math.max(1, (updated[index].quantity || 1) + delta);
    updated[index] = { ...updated[index], quantity: newQty };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = selectedWorkloads.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleAddApp = (app: AppPresetOption) => {
    const newWorkload: SelectedWorkload = {
      softwareId: app.id,
      softwareName: app.name,
      softwareVersionId: `ver_${app.id}_${app.versionString.replace(/\./g, "")}`,
      versionString: app.versionString,
      workloadId: `w_${app.id}`,
      workloadName: app.desc,
      intensity: app.defaultIntensity,
      concurrency: app.defaultConcurrency,
      quantity: 1,
    };
    onChange([...selectedWorkloads, newWorkload]);
    setShowAddMenu(false);
  };

  const [showSimultaneousInfo, setShowSimultaneousInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  // Close info popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowSimultaneousInfo(false);
      }
    }
    if (showSimultaneousInfo) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSimultaneousInfo]);

  return (
    <div className="space-y-4">
      {/* Header & Concurrency Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-brand-primary">Workload Stack</span>
          <h3 className="text-sm font-bold text-content-strong flex items-center gap-1.5 mt-0.5">
            <Layers className="h-4 w-4 text-brand-primary" />
            Active Software Applications ({selectedWorkloads.length})
          </h3>
        </div>

        <div className="flex items-center gap-1.5 relative" ref={infoRef}>
          <label className="flex items-center gap-2 cursor-pointer bg-surface-elevated px-3 py-1.5 rounded-xl border border-border-subtle text-xs hover:border-border-strong transition-colors">
            <input
              type="checkbox"
              checked={isSimultaneous}
              onChange={(e) => onSimultaneousChange(e.target.checked)}
              className="rounded border-border-strong bg-surface-card text-brand-primary focus:ring-brand-primary h-4 w-4"
            />
            <span className="font-semibold text-content-strong">Will these run at the same time?</span>
          </label>

          <button
            type="button"
            onClick={() => setShowSimultaneousInfo(!showSimultaneousInfo)}
            className="p-1.5 rounded-lg text-content-muted hover:text-brand-primary hover:bg-surface-elevated transition-colors"
            title="Explain: Run at the same time?"
            aria-label="Explain Run at the same time"
          >
            <Info className="h-4 w-4" />
          </button>

          {/* Explanatory Popover */}
          {showSimultaneousInfo && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-2xl bg-surface-card border border-border-strong shadow-xl z-30 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150 font-sans">
              <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
                <span className="font-bold text-content-strong flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-brand-primary" />
                  Multitasking Execution
                </span>
                <button
                  type="button"
                  onClick={() => setShowSimultaneousInfo(false)}
                  className="p-1 rounded-md text-content-muted hover:text-content-strong"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-[11px] leading-relaxed">
                <div>
                  <strong className="text-brand-primary block font-semibold">
                    ✓ Yes (Simultaneous Multitasking)
                  </strong>
                  <p className="text-content-body mt-0.5">
                    Evaluates system behavior when <strong>all chosen apps are open and active together</strong> (e.g., editing in Photoshop while compiling code and keeping 20+ browser tabs open). RAM working sets and CPU threads are added together.
                  </p>
                </div>

                <div className="pt-1.5 border-t border-border-subtle">
                  <strong className="text-content-strong block font-semibold">
                    ◻ No (One App at a Time)
                  </strong>
                  <p className="text-content-muted mt-0.5">
                    Evaluates if your computer can run each application <strong>individually</strong>, assuming other heavy programs are closed before launching.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1-Click Popular Workflow Bundles with Scroll Buttons */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
        <span className="text-[10px] font-mono uppercase font-bold text-content-muted flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
          <span>Quick 1-Click Workflow Bundles:</span>
        </span>
        <HorizontalScrollContainer scrollStep={220}>
          {POPULAR_WORKLOAD_BUNDLES.map((bundle) => (
            <button
              key={bundle.id}
              type="button"
              onClick={() => handleApplyBundle(bundle)}
              className="touch-target px-2.5 py-1 text-xs rounded-xl bg-surface-card hover:bg-surface-elevated text-content-body hover:text-content-strong border border-border-subtle hover:border-brand-primary/50 font-mono flex items-center gap-1.5 transition-all shadow-xs shrink-0 whitespace-nowrap"
            >
              <span>{bundle.emoji}</span>
              <span className="font-semibold">{bundle.name}</span>
            </button>
          ))}
        </HorizontalScrollContainer>
      </div>

      {/* Visual Workload Stack Cards */}
      <div className="space-y-2.5">
        {selectedWorkloads.map((w, idx) => {
          const isExpanded = expandedId === `${w.softwareId}-${idx}`;
          const isMultiInstance = (w.quantity || 1) > 1;

          return (
            <div
              key={`${w.softwareId}-${idx}`}
              className="p-3.5 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-strong transition-all shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center border border-brand-primary/20 shrink-0">
                    {w.softwareName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-content-strong text-xs flex items-center gap-1.5 flex-wrap">
                      <span>{w.softwareName}</span>
                      {w.versionString && (
                        <span className="px-1.5 py-0.2 rounded bg-surface-elevated text-brand-primary text-[10px] font-mono font-bold border border-brand-primary/20">
                          v{w.versionString}
                        </span>
                      )}
                      {isMultiInstance && (
                        <span className="px-1.5 py-0.5 rounded bg-brand-primary/15 text-brand-primary text-[10px] font-mono font-bold">
                          × {w.quantity}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-content-muted truncate max-w-[240px] sm:max-w-xs">
                      {w.workloadName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-surface-elevated text-content-body border border-border-subtle">
                    {w.intensity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : `${w.softwareId}-${idx}`)}
                    className="p-1.5 text-content-muted hover:text-content-strong rounded-lg hover:bg-surface-elevated transition-colors touch-target"
                    aria-label={isExpanded ? "Collapse workload options" : "Expand workload options"}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 text-content-muted hover:text-status-danger rounded-lg hover:bg-status-danger/10 transition-colors touch-target"
                    aria-label={`Remove ${w.softwareName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Controls (Progressive Disclosure) */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-content-muted mb-1">
                      Project Intensity & Scale
                    </label>
                    <div className="flex gap-1">
                      {(["light", "medium", "heavy"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleUpdateIntensity(idx, lvl)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors flex-1 touch-target ${
                            w.intensity === lvl
                              ? "bg-brand-primary text-white"
                              : "bg-surface-elevated text-content-body hover:text-content-strong border border-border-subtle"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-content-muted mt-1 leading-tight">
                      {w.intensity === "light" && "• Light: Basic 1080p, simple assets, standard files"}
                      {w.intensity === "medium" && "• Medium: 20+ layers, RAW photos, active compile builds"}
                      {w.intensity === "heavy" && "• Heavy: 4K timeline, 3D viewport, multi-container Docker"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-content-muted mb-1">
                      Instance Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, -1)}
                        className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-secondary text-content-strong border border-border-subtle font-bold text-xs touch-target"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold text-content-strong w-6 text-center">
                        {w.quantity || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, 1)}
                        className="w-8 h-8 rounded-lg bg-surface-elevated hover:bg-surface-secondary text-content-strong border border-border-subtle font-bold text-xs touch-target"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Software Version Selector (Latest + 3 Versions Down) */}
                  <div className="sm:col-span-2 pt-2 border-t border-border-subtle">
                    <label className="block text-[10px] uppercase font-bold text-content-muted mb-1 flex items-center justify-between">
                      <span>Software Release Version (3+ Generations Supported)</span>
                      <span className="text-brand-primary font-mono lowercase">Select legacy or latest release</span>
                    </label>
                    <select
                      value={w.versionString || getVersionsForApp(w.softwareId)[0]?.version}
                      onChange={(e) => {
                        const newVersion = e.target.value;
                        const updated = [...selectedWorkloads];
                        updated[idx] = {
                          ...updated[idx],
                          versionString: newVersion,
                          softwareVersionId: `ver_${w.softwareId}_${newVersion.replace(/[^a-zA-Z0-9]/g, "")}`,
                        };
                        onChange(updated);
                      }}
                      className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2 text-xs text-content-strong font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                    >
                      {getVersionsForApp(w.softwareId, w.versionString).map((v) => (
                        <option key={v.version} value={v.version}>
                          {v.label} {v.minRamBadge ? `(Rec RAM: ~${v.minRamBadge})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Software Menu / Rich Searchable Application Picker */}
      <div className="relative" ref={pickerRef}>
        {!showAddMenu ? (
          <button
            type="button"
            onClick={() => setShowAddMenu(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-border-strong hover:border-brand-primary hover:bg-surface-elevated text-content-body hover:text-content-strong text-xs font-bold flex items-center justify-center gap-2 transition-all touch-target shadow-xs"
          >
            <Plus className="h-4 w-4 text-brand-primary" />
            <span>+ Add Software, Game, or Dev Tool ({EXTENDED_APP_CATALOG.length} Apps)</span>
          </button>
        ) : (
          <div className="relative mt-2">
            <SearchableApplicationPicker
              onSelectApp={handleAddApp}
              onClose={() => setShowAddMenu(false)}
              selectedAppIds={selectedWorkloads.map(w => w.softwareId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

