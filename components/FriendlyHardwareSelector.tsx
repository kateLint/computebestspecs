"use client";

import React, { useState } from "react";
import { HardwareProfile, DeviceType, OperatingSystemFamily } from "@/lib/domain/hardware";
import { CANONICAL_CPUS, CANONICAL_GPUS } from "@/lib/data/hardware-catalog";
import {
  Cpu as CpuIcon,
  MonitorPlay,
  Layers,
  HardDrive,
  Laptop,
  Monitor,
  Sparkles,
  Sliders,
  FileText,
  Check,
  ChevronDown,
  Edit3,
  Zap,
} from "lucide-react";
import { NaturalLanguageSpecInput } from "./NaturalLanguageSpecInput";
import { SearchableHardwarePicker, EXTENDED_HARDWARE_CATALOG } from "./SearchableHardwarePicker";

interface FriendlyHardwareSelectorProps {
  value: HardwareProfile;
  onChange: (profile: HardwareProfile) => void;
}

// Preset computer configurations for one-click dropdown selection
export const POPULAR_PRESETS = [
  {
    id: "macbook_pro_m3_max",
    name: "MacBook Pro 16\" (Apple M3 Max, 36GB RAM, 1TB SSD)",
    badge: "Creative Pro / Local AI",
    profile: {
      cpu: {
        model: "Apple M3 Max (16-core)",
        manufacturer: "Apple",
        architecture: "arm64",
        physicalCores: 16,
        performanceScore: 97,
        laptopVariant: true,
        isVerified: true,
      },
      gpu: {
        model: "Apple M3 Max GPU (40-core)",
        manufacturer: "Apple",
        type: "unified",
        performanceScore: 94,
        vramGb: 36,
        supportsMetal: true,
        laptopVariant: true,
        isVerified: true,
      },
      ram: { totalGb: 36, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 600, isSystemDrive: true }],
      os: { family: "macos", version: "15", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    } as HardwareProfile,
  },
  {
    id: "dell_xps_15_i7_4060",
    name: "Dell XPS 15 (Core i7-13700H, RTX 4060, 32GB RAM, 1TB SSD)",
    badge: "Dev & Video Editing",
    profile: {
      cpu: {
        model: "Intel Core i7-13700H",
        manufacturer: "Intel",
        architecture: "x86_64",
        physicalCores: 14,
        performanceScore: 84,
        laptopVariant: true,
        isVerified: true,
      },
      gpu: {
        model: "NVIDIA GeForce RTX 4060 Laptop GPU",
        manufacturer: "NVIDIA",
        type: "dedicated",
        performanceScore: 78,
        vramGb: 8.0,
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
        laptopVariant: true,
        isVerified: true,
      },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 450, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    } as HardwareProfile,
  },
  {
    id: "budget_gaming_ryzen_3050",
    name: "Budget Creator Laptop (Ryzen 5 5600H, RTX 3050, 16GB RAM)",
    badge: "Entry Gaming / Design",
    profile: {
      cpu: {
        model: "AMD Ryzen 5 5600H",
        manufacturer: "AMD",
        architecture: "x86_64",
        physicalCores: 6,
        performanceScore: 68,
        laptopVariant: true,
        isVerified: true,
      },
      gpu: {
        model: "NVIDIA GeForce RTX 3050 Laptop GPU",
        manufacturer: "NVIDIA",
        type: "dedicated",
        performanceScore: 55,
        vramGb: 4.0,
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
        laptopVariant: true,
        isVerified: true,
      },
      ram: { totalGb: 16, type: "DDR4" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 180, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    } as HardwareProfile,
  },
  {
    id: "desktop_workstation_14900k_4090",
    name: "High-End Desktop (Core i9-14900K, RTX 4090, 64GB RAM)",
    badge: "Ultimate Powerhouse",
    profile: {
      cpu: {
        model: "Intel Core i9-14900K",
        manufacturer: "Intel",
        architecture: "x86_64",
        physicalCores: 24,
        performanceScore: 99,
        laptopVariant: false,
        isVerified: true,
      },
      gpu: {
        model: "NVIDIA GeForce RTX 4090",
        manufacturer: "NVIDIA",
        type: "dedicated",
        performanceScore: 99,
        vramGb: 24.0,
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
        laptopVariant: false,
        isVerified: true,
      },
      ram: { totalGb: 64, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1200, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    } as HardwareProfile,
  },
  {
    id: "macbook_air_m2_16gb",
    name: "MacBook Air 13\" (Apple M2, 16GB RAM, 512GB SSD)",
    badge: "Portable Dev / Daily Work",
    profile: {
      cpu: {
        model: "Apple M2 (8-core)",
        manufacturer: "Apple",
        architecture: "arm64",
        physicalCores: 8,
        performanceScore: 79,
        laptopVariant: true,
        isVerified: true,
      },
      gpu: {
        model: "Apple M2 GPU (10-core)",
        manufacturer: "Apple",
        type: "unified",
        performanceScore: 68,
        vramGb: 16,
        supportsMetal: true,
        laptopVariant: true,
        isVerified: true,
      },
      ram: { totalGb: 16, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 280, isSystemDrive: true }],
      os: { family: "macos", version: "15", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    } as HardwareProfile,
  },
  {
    id: "gaming_desktop_7600x_4070",
    name: "Gaming & 3D Desktop (Ryzen 5 7600X, RTX 4070, 32GB RAM)",
    badge: "Modern 1440p / Unreal Engine",
    profile: {
      cpu: {
        model: "AMD Ryzen 5 7600X",
        manufacturer: "AMD",
        architecture: "x86_64",
        physicalCores: 6,
        performanceScore: 78,
        laptopVariant: false,
        isVerified: true,
      },
      gpu: {
        model: "NVIDIA GeForce RTX 4070",
        manufacturer: "NVIDIA",
        type: "dedicated",
        performanceScore: 88,
        vramGb: 12.0,
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
        laptopVariant: false,
        isVerified: true,
      },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 550, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    } as HardwareProfile,
  },
  {
    id: "office_dev_i5_13400_igpu",
    name: "Office / Coding PC (Core i5-13400, UHD 770 Graphics, 16GB RAM)",
    badge: "Coding / General Office",
    profile: {
      cpu: {
        model: "Intel Core i5-13400",
        manufacturer: "Intel",
        architecture: "x86_64",
        physicalCores: 10,
        performanceScore: 72,
        laptopVariant: false,
        isVerified: true,
      },
      gpu: {
        model: "Intel UHD Graphics 770",
        manufacturer: "Intel",
        type: "integrated",
        performanceScore: 35,
        vramGb: 0,
        supportsDirectX12: true,
        laptopVariant: false,
        isVerified: true,
      },
      ram: { totalGb: 16, type: "DDR4" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 300, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    } as HardwareProfile,
  },
];

function cleanDetectedGpu(raw: string): string {
  if (!raw) return "";
  // Match "Apple M4 Max", "Apple M4 Pro", "Apple M3 Max", etc.
  const appleMatch = raw.match(/Apple\s+M\d+(\s+(?:Max|Pro|Ultra))?/i);
  if (appleMatch) return appleMatch[0];

  // Match NVIDIA GeForce RTX / GTX
  const nvidiaMatch = raw.match(/(?:NVIDIA\s+)?(?:GeForce\s+)?(RTX|GTX)\s+\d{3,4}(?:\s*(?:Ti|Super|Mobile))?/i);
  if (nvidiaMatch) return nvidiaMatch[0];

  // Match AMD Radeon RX / Radeon
  const amdMatch = raw.match(/(?:AMD\s+)?(?:Radeon\s+)?(?:RX\s+)?\d{3,4}(?:\s*XTX|\s*XT)?/i);
  if (amdMatch) return amdMatch[0];

  // Match Intel Arc / Iris Xe / UHD
  const intelMatch = raw.match(/(?:Intel\s+)?(?:Arc\s+[A-Z]\d{3}|Iris\s+Xe|UHD\s+\d{3})/i);
  if (intelMatch) return intelMatch[0];

  // Strip generic ANGLE prefixes and suffixes
  return raw
    .replace(/^ANGLE\s*\([^,]+,\s*/i, "")
    .replace(/ANGLE\s+Metal\s+Renderer:\s*/i, "")
    .replace(/,\s*Unspecified\s*Version\s*\)$/i, "")
    .replace(/\)$/, "")
    .trim();
}

export function FriendlyHardwareSelector({ value, onChange }: FriendlyHardwareSelectorProps) {
  const [activeTab, setActiveTab] = useState<"dropdown" | "manual" | "autopaste">("dropdown");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [detecting, setDetecting] = useState<boolean>(false);
  const [detectedSummary, setDetectedSummary] = useState<string | null>(null);

  const handleAutoDetect = () => {
    setDetecting(true);
    setTimeout(() => {
      try {
        let rawRenderer = "";
        let isAppleSilicon = false;
        let isNvidia = false;
        let isAmd = false;
        let isIntel = false;

        if (typeof window !== "undefined") {
          try {
            const canvas = document.createElement("canvas");
            const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (gl) {
              const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
              if (debugInfo) {
                rawRenderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
              }
              if (!rawRenderer) {
                rawRenderer = (gl as any).getParameter((gl as any).RENDERER) || "";
              }
            }
          } catch (e) {}

          const ua = navigator.userAgent || "";
          const platform = (navigator as any).platform || "";
          const cores = navigator.hardwareConcurrency || 8;
          const memory = (navigator as any).deviceMemory || 16;

          const cleanedGpu = cleanDetectedGpu(rawRenderer);
          const rLower = rawRenderer.toLowerCase();

          if (rLower.includes("apple") || platform.toLowerCase().includes("mac") || ua.includes("Macintosh")) {
            isAppleSilicon = true;
          } else if (rLower.includes("nvidia") || rLower.includes("geforce")) {
            isNvidia = true;
          } else if (rLower.includes("amd") || rLower.includes("radeon")) {
            isAmd = true;
          } else if (rLower.includes("intel") || rLower.includes("iris") || rLower.includes("arc")) {
            isIntel = true;
          }

          if (isAppleSilicon) {
            // Find specific matching Apple Silicon preset
            let appleOption = null;
            if (rLower.includes("m4 max")) {
              appleOption = EXTENDED_HARDWARE_CATALOG.find((p) => p.id === "macbook-pro-m4-max-64g") ||
                            EXTENDED_HARDWARE_CATALOG.find((p) => p.profile.cpu.model.includes("M4 Max"));
            } else if (rLower.includes("m4 pro")) {
              appleOption = EXTENDED_HARDWARE_CATALOG.find((p) => p.id === "macbook-pro-m4-pro-24g") ||
                            EXTENDED_HARDWARE_CATALOG.find((p) => p.profile.cpu.model.includes("M4 Pro"));
            } else if (rLower.includes("m4")) {
              appleOption = EXTENDED_HARDWARE_CATALOG.find((p) => p.id === "macbook-air-m4-16g") ||
                            EXTENDED_HARDWARE_CATALOG.find((p) => p.profile.cpu.model.includes("M4"));
            } else if (rLower.includes("m3 max")) {
              appleOption = EXTENDED_HARDWARE_CATALOG.find((p) => p.id === "macbook-pro-m3-max-64g") ||
                            EXTENDED_HARDWARE_CATALOG.find((p) => p.profile.cpu.model.includes("M3 Max"));
            } else if (rLower.includes("m3 pro")) {
              appleOption = EXTENDED_HARDWARE_CATALOG.find((p) => p.id === "macbook-pro-m3-pro-18g") ||
                            EXTENDED_HARDWARE_CATALOG.find((p) => p.profile.cpu.model.includes("M3 Pro"));
            } else if (rLower.includes("m3")) {
              appleOption = EXTENDED_HARDWARE_CATALOG.find((p) => p.id === "macbook-air-m3-16g") ||
                            EXTENDED_HARDWARE_CATALOG.find((p) => p.profile.cpu.model.includes("M3"));
            } else if (rLower.includes("m2")) {
              appleOption = EXTENDED_HARDWARE_CATALOG.find((p) => p.profile.cpu.model.includes("M2"));
            } else if (rLower.includes("m1")) {
              appleOption = EXTENDED_HARDWARE_CATALOG.find((p) => p.profile.cpu.model.includes("M1"));
            }

            if (!appleOption) {
              appleOption =
                EXTENDED_HARDWARE_CATALOG.find((p) => p.category.includes("Apple") && p.profile.cpu.physicalCores === cores) ||
                EXTENDED_HARDWARE_CATALOG.find((p) => p.id === "macbook-air-m4-16g") ||
                EXTENDED_HARDWARE_CATALOG[0];
            }

            onChange({ ...appleOption.profile });
            const displayName = appleOption.displayName || `Apple ${cleanedGpu || "Silicon"}`;
            setDetectedSummary(`Detected: ${displayName} (${cores} CPU Cores • ${cleanedGpu || "Apple GPU"} • macOS)`);
          } else if (isNvidia) {
            const nvidiaOption =
              EXTENDED_HARDWARE_CATALOG.find((p) => p.category.includes("NVIDIA") && (rLower.includes("4090") ? p.displayName.includes("4090") : true)) ||
              EXTENDED_HARDWARE_CATALOG[10];
            onChange({ ...nvidiaOption.profile });
            setDetectedSummary(`Detected: NVIDIA System (${cores} CPU Cores • ${cleanedGpu || "GeForce RTX"})`);
          } else if (isAmd) {
            const amdOption =
              EXTENDED_HARDWARE_CATALOG.find((p) => p.category.includes("AMD")) || EXTENDED_HARDWARE_CATALOG[15];
            onChange({ ...amdOption.profile });
            setDetectedSummary(`Detected: AMD System (${cores} CPU Cores • ${cleanedGpu || "Radeon Graphics"})`);
          } else {
            const intelOption =
              EXTENDED_HARDWARE_CATALOG.find((p) => p.category.includes("Intel")) || EXTENDED_HARDWARE_CATALOG[20];
            onChange({ ...intelOption.profile });
            setDetectedSummary(`Detected: Intel System (${cores} CPU Cores • ${cleanedGpu || "Intel Graphics"})`);
          }
        }
      } catch (err) {
        console.error("Auto detect failed:", err);
      } finally {
        setDetecting(false);
      }
    }, 400);
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = POPULAR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onChange({ ...preset.profile });
    }
  };

  const handleCpuDropdownChange = (model: string) => {
    const found = CANONICAL_CPUS.find((c) => c.model === model);
    if (found) {
      onChange({
        ...value,
        cpu: {
          catalogCpuId: found.id,
          model: found.model,
          manufacturer: found.manufacturer,
          architecture: found.architecture,
          physicalCores: found.physicalCores,
          performanceScore: found.performanceScore,
          laptopVariant: found.laptopVariant,
          isVerified: true,
        },
        architecture: found.architecture,
      });
    } else {
      onChange({
        ...value,
        cpu: {
          ...value.cpu,
          model,
        },
      });
    }
  };

  const handleGpuDropdownChange = (model: string) => {
    if (model === "none_integrated") {
      onChange({
        ...value,
        gpu: {
          model: "Integrated Graphics",
          type: "integrated",
          performanceScore: 30,
          vramGb: 0,
          isVerified: true,
        },
      });
      return;
    }

    const found = CANONICAL_GPUS.find((g) => g.model === model);
    if (found) {
      onChange({
        ...value,
        gpu: {
          catalogGpuId: found.id,
          model: found.model,
          manufacturer: found.manufacturer,
          type: found.type,
          performanceScore: found.performanceScore,
          vramGb: found.vramGb,
          supportsCuda: found.supportsCuda,
          supportsMetal: found.supportsMetal,
          supportsVulkan: found.supportsVulkan,
          supportsDirectX12: found.supportsDirectX12,
          laptopVariant: found.laptopVariant,
          isVerified: true,
        },
      });
    } else {
      onChange({
        ...value,
        gpu: value.gpu
          ? { ...value.gpu, model }
          : { model, type: "dedicated", vramGb: 8, isVerified: false },
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-Detect Hardware Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-content-strong block">
              Auto-Detect My Computer
            </span>
            <span className="text-[11px] text-content-body">
              Probes your browser for GPU, CPU threads, and OS.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={detecting}
          className="touch-target px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-mono font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{detecting ? "Scanning Hardware..." : "Inspect My PC Now"}</span>
        </button>
      </div>

      {detectedSummary && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="flex-1 font-semibold">{detectedSummary}</span>
        </div>
      )}

      {/* Quick 1-Click Popular Hardware Presets */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-surface-subtle border border-border-subtle">
        <span className="text-[10px] font-mono uppercase font-bold text-content-muted flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
          <span>Quick 1-Click Popular Systems:</span>
        </span>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { id: "macbook-pro-m4-max-64g", label: "MacBook Pro M4 Max (64GB)", emoji: "🍏" },
            { id: "macbook-air-m4-16g", label: "MacBook Air M4 (16GB)", emoji: "💻" },
            { id: "rtx-4090-desktop-24g", label: "RTX 4090 Desktop (64GB)", emoji: "🖥️" },
            { id: "rtx-4060-laptop-8g", label: "RTX 4060 Laptop (16GB)", emoji: "🎮" },
            { id: "snapdragon-x-elite-16g", label: "Snapdragon X Elite", emoji: "⚡" },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                const found = EXTENDED_HARDWARE_CATALOG.find((p) => p.id === preset.id);
                if (found) {
                  onChange({ ...found.profile });
                  setSelectedPresetId(preset.id);
                }
              }}
              className="touch-target px-2.5 py-1 text-xs rounded-xl bg-surface-card hover:bg-surface-elevated text-content-body hover:text-content-strong border border-border-subtle hover:border-brand-primary/50 font-mono flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>{preset.emoji}</span>
              <span className="font-semibold">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2 Main Options Selector: Dropdown Selection vs. Custom / Edit by Yourself */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-surface-subtle border border-border-subtle">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("dropdown")}
            className={`touch-target px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "dropdown"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-content-muted hover:text-content-strong"
            }`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            <span>Dropdown Selection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`touch-target px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "manual"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-content-muted hover:text-content-strong"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit by Yourself</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("autopaste")}
          className={`touch-target px-3 py-1.5 text-[11px] font-mono rounded-xl transition-all flex items-center gap-1 ${
            activeTab === "autopaste"
              ? "bg-surface-elevated text-brand-primary font-bold border border-brand-primary/30"
              : "text-content-muted hover:text-content-strong"
          }`}
          title="Auto-detect hardware from text paste"
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Auto-Paste</span>
        </button>
      </div>

      {/* OPTION 1: DROPDOWN SELECTION */}
      {activeTab === "dropdown" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Searchable Hardware Preset Picker */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2.5">
            <label className="block text-xs font-bold text-content-strong font-mono uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                <span>Search & Choose Hardware Preset (Apple, NVIDIA, AMD, Intel)</span>
              </span>
              <span className="text-[10px] text-content-muted font-normal">Search or browse 40+ curated systems</span>
            </label>

            <SearchableHardwarePicker
              value={value}
              onChange={(newProfile) => {
                onChange(newProfile);
              }}
              onSwitchToManual={() => {
                setActiveTab("manual");
              }}
            />
          </div>

          {/* Component Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            {/* CPU Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-content-muted uppercase flex items-center gap-1">
                <CpuIcon className="h-3.5 w-3.5 text-brand-primary" />
                <span>Processor (CPU)</span>
              </label>
              <select
                value={value.cpu.model}
                onChange={(e) => handleCpuDropdownChange(e.target.value)}
                className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2.5 text-xs text-content-strong font-sans font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <optgroup label="Apple Silicon">
                  {CANONICAL_CPUS.filter((c) => c.manufacturer === "Apple").map((c) => (
                    <option key={c.id} value={c.model}>
                      {c.model}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Intel Processors">
                  {CANONICAL_CPUS.filter((c) => c.manufacturer === "Intel").map((c) => (
                    <option key={c.id} value={c.model}>
                      {c.model} {c.laptopVariant ? "(Laptop)" : "(Desktop)"}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="AMD Ryzen Processors">
                  {CANONICAL_CPUS.filter((c) => c.manufacturer === "AMD").map((c) => (
                    <option key={c.id} value={c.model}>
                      {c.model} {c.laptopVariant ? "(Laptop)" : "(Desktop)"}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Qualcomm Snapdragon (ARM)">
                  {CANONICAL_CPUS.filter((c) => c.manufacturer === "Qualcomm").map((c) => (
                    <option key={c.id} value={c.model}>
                      {c.model}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other / Custom">
                  {!CANONICAL_CPUS.some((c) => c.model === value.cpu.model) && (
                    <option value={value.cpu.model}>{value.cpu.model} (Custom)</option>
                  )}
                </optgroup>
              </select>
            </div>

            {/* GPU Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-content-muted uppercase flex items-center gap-1">
                <MonitorPlay className="h-3.5 w-3.5 text-indigo-500" />
                <span>Graphics Card (GPU)</span>
              </label>
              <select
                value={value.gpu?.model || "none_integrated"}
                onChange={(e) => handleGpuDropdownChange(e.target.value)}
                className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2.5 text-xs text-content-strong font-sans font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <optgroup label="NVIDIA GeForce RTX / GTX">
                  {CANONICAL_GPUS.filter((g) => g.manufacturer === "NVIDIA").map((g) => (
                    <option key={g.id} value={g.model}>
                      {g.model} ({g.vramGb}GB VRAM)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Apple Silicon Integrated GPU">
                  {CANONICAL_GPUS.filter((g) => g.manufacturer === "Apple").map((g) => (
                    <option key={g.id} value={g.model}>
                      {g.model}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="AMD Radeon Graphics">
                  {CANONICAL_GPUS.filter((g) => g.manufacturer === "AMD").map((g) => (
                    <option key={g.id} value={g.model}>
                      {g.model} {(g.vramGb ?? 0) > 0 ? `(${g.vramGb}GB VRAM)` : "(Shared RAM)"}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Intel Arc & Iris Graphics">
                  {CANONICAL_GPUS.filter((g) => g.manufacturer === "Intel").map((g) => (
                    <option key={g.id} value={g.model}>
                      {g.model} {(g.vramGb ?? 0) > 0 ? `(${g.vramGb}GB VRAM)` : "(Shared RAM)"}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Integrated / Basic">
                  <option value="none_integrated">Integrated Graphics (Shared RAM)</option>
                </optgroup>
                <optgroup label="Other / Custom">
                  {value.gpu && !CANONICAL_GPUS.some((g) => g.model === value.gpu?.model) && (
                    <option value={value.gpu.model}>{value.gpu.model} (Custom)</option>
                  )}
                </optgroup>
              </select>
            </div>

            {/* System RAM Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-content-muted uppercase flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-amber-500" />
                <span>System Memory (RAM)</span>
              </label>
              <select
                value={value.ram.totalGb}
                onChange={(e) =>
                  onChange({
                    ...value,
                    ram: {
                      ...value.ram,
                      totalGb: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2.5 text-xs text-content-strong font-sans font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <optgroup label="Mainstream Memory">
                  <option value={8}>8 GB RAM (Basic Office & Web)</option>
                  <option value={16}>16 GB RAM (Standard Creative & Multitasking)</option>
                  <option value={32}>32 GB RAM (Creative Pro & Dev Recommended)</option>
                  <option value={64}>64 GB RAM (Heavy 3D, VFX & Local AI)</option>
                </optgroup>
                <optgroup label="Apple Silicon Unified Tiers">
                  <option value={18}>18 GB RAM (Apple M3 Pro Unified)</option>
                  <option value={24}>24 GB RAM (Apple M2/M4 Unified)</option>
                  <option value={36}>36 GB RAM (Apple M3/M4 Max Unified)</option>
                  <option value={48}>48 GB RAM (Apple M3/M4 Pro Unified)</option>
                  <option value={96}>96 GB RAM (Apple M3/M4 Max Unified)</option>
                  <option value={128}>128 GB RAM (Apple M4 Max Beast)</option>
                  <option value={192}>192 GB RAM (Mac Studio Ultra / Flagship)</option>
                </optgroup>
                <optgroup label="Workstation Powerhouse">
                  <option value={128}>128 GB RAM (Threadripper / Xeon Workstation)</option>
                  <option value={256}>256 GB RAM (High-Density Multi-GPU Node)</option>
                </optgroup>
              </select>
            </div>

            {/* Storage Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-content-muted uppercase flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                <span>SSD Storage Capacity</span>
              </label>
              <select
                value={value.storage[0]?.totalGb || 512}
                onChange={(e) => {
                  const totalGb = Number(e.target.value);
                  onChange({
                    ...value,
                    storage: [
                      {
                        type: "NVME_SSD",
                        totalGb,
                        freeGb: Math.round(totalGb * 0.6),
                        isSystemDrive: true,
                      },
                    ],
                  });
                }}
                className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2.5 text-xs text-content-strong font-sans font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <option value={256}>256 GB NVMe SSD (Basic System Drive)</option>
                <option value={512}>512 GB NVMe SSD (Mainstream Fast SSD)</option>
                <option value={1000}>1 TB (1,000 GB) NVMe SSD (Creator Sweet Spot)</option>
                <option value={2000}>2 TB (2,000 GB) NVMe SSD (Heavy Games & Projects)</option>
                <option value={4000}>4 TB (4,000 GB) NVMe SSD (Pro Production Workstation)</option>
                <option value={8000}>8 TB (8,000 GB) NVMe SSD (High-Density Storage)</option>
              </select>
            </div>

            {/* Operating System */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-content-muted uppercase">
                Operating System
              </label>
              <select
                value={`${value.os.family}:${value.os.version || ""}`}
                onChange={(e) => {
                  const [family, version, arch] = e.target.value.split(":");
                  onChange({
                    ...value,
                    os: {
                      ...value.os,
                      family: family as OperatingSystemFamily,
                      version: version || (family === "windows" ? "11" : family === "macos" ? "15" : "Ubuntu 24.04"),
                      architecture: (arch as any) || value.architecture || "x86_64",
                    },
                    architecture: (arch as any) || value.architecture || "x86_64",
                  });
                }}
                className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2.5 text-xs text-content-strong font-sans font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <optgroup label="Microsoft Windows">
                  <option value="windows:11:x86_64">Windows 11 (64-bit x86_64)</option>
                  <option value="windows:11 ARM64:arm64">Windows 11 on ARM (Snapdragon X / ARM64)</option>
                  <option value="windows:10 22H2:x86_64">Windows 10 Pro / Home (64-bit v22H2)</option>
                  <option value="windows:Server 2025:x86_64">Windows Server 2022 / 2025</option>
                  <option value="windows:7/8.1:x86_64">Windows 7 / 8.1 (Legacy 64-bit)</option>
                </optgroup>
                <optgroup label="Apple macOS">
                  <option value="macos:26 Tahoe:arm64">macOS 26 Tahoe (Apple Silicon M1–M4)</option>
                  <option value="macos:15 Sequoia:arm64">macOS 15 Sequoia (Apple Silicon M1–M4)</option>
                  <option value="macos:14 Sonoma:arm64">macOS 14 Sonoma (Apple Silicon M1–M3)</option>
                  <option value="macos:13 Ventura:arm64">macOS 13 Ventura (Apple Silicon & Intel)</option>
                  <option value="macos:12 Monterey:x86_64">macOS 12 Monterey (Intel x86_64)</option>
                  <option value="macos:11 Big Sur:x86_64">macOS 11 Big Sur (Legacy Intel / M1)</option>
                </optgroup>
                <optgroup label="Linux & Developer Distributions">
                  <option value="linux:Ubuntu 24.04 LTS:x86_64">Ubuntu 24.04 LTS (Noble Numbat x86_64)</option>
                  <option value="linux:Ubuntu 24.04 ARM:arm64">Ubuntu 24.04 LTS (ARM64 Server/Desktop)</option>
                  <option value="linux:Fedora 40:x86_64">Fedora Workstation 40 / 41 (x86_64)</option>
                  <option value="linux:Pop!_OS / Mint:x86_64">Pop!_OS / Linux Mint (Debian/Ubuntu-based)</option>
                  <option value="linux:Arch Linux:x86_64">Arch Linux / EndeavourOS / Manjaro</option>
                  <option value="linux:Debian 12:x86_64">Debian 12 Bookworm (Stable)</option>
                  <option value="linux:NixOS / openSUSE:x86_64">NixOS / openSUSE Tumbleweed</option>
                  <option value="linux:SteamOS 3.5:x86_64">SteamOS 3.5 (Steam Deck / Handheld APU)</option>
                  <option value="linux:RHEL 9:x86_64">Red Hat Enterprise Linux (RHEL 9) / Rocky Linux</option>
                  <option value="linux:Alpine / Void:x86_64">Alpine Linux / Void (Lightweight musl/glibc)</option>
                  <option value="linux:ChromeOS Flex:x86_64">ChromeOS / ChromeOS Flex</option>
                </optgroup>
                <optgroup label="BSD & UNIX Ecosystem">
                  <option value="linux:FreeBSD:x86_64">FreeBSD / OpenBSD (x86_64)</option>
                </optgroup>
              </select>
            </div>

            {/* Form Factor */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-content-muted uppercase">
                Form Factor
              </label>
              <select
                value={value.deviceType || "laptop"}
                onChange={(e) =>
                  onChange({
                    ...value,
                    deviceType: e.target.value as DeviceType,
                  })
                }
                className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl px-3 py-2.5 text-xs text-content-strong font-sans font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                <option value="laptop">Laptop / Notebook</option>
                <option value="desktop">Desktop PC / Tower</option>
                <option value="mini-pc">Mini-PC / SFF (Mac Mini / NUC)</option>
                <option value="workstation">Dedicated Workstation / Server</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* OPTION 2: EDIT BY YOURSELF (MANUAL CUSTOM VALUES) */}
      {activeTab === "manual" && (
        <div className="space-y-4 p-4 rounded-2xl bg-surface-subtle border border-border-subtle animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <span className="text-xs font-mono font-bold text-content-strong uppercase">
              Custom Hardware Attributes
            </span>
            <span className="text-[10px] font-mono text-content-muted">
              Edit exact model names and parameters directly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Custom CPU Model */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-content-muted">
                CPU Model Name
              </label>
              <input
                type="text"
                value={value.cpu.model}
                onChange={(e) =>
                  onChange({
                    ...value,
                    cpu: { ...value.cpu, model: e.target.value },
                  })
                }
                placeholder="e.g. Ryzen 7 7840HS, Core i7-14700K"
                className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Custom CPU Physical Cores */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-content-muted">
                CPU Physical Cores
              </label>
              <input
                type="number"
                min={2}
                max={64}
                value={value.cpu.physicalCores || 8}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                }}
                onChange={(e) =>
                  onChange({
                    ...value,
                    cpu: { ...value.cpu, physicalCores: Math.max(1, Number(e.target.value) || 1) },
                  })
                }
                className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Custom GPU Model */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-content-muted">
                GPU Model Name
              </label>
              <input
                type="text"
                value={value.gpu?.model || ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    gpu: value.gpu
                      ? { ...value.gpu, model: e.target.value }
                      : { model: e.target.value, type: "dedicated", vramGb: 8, isVerified: false },
                  })
                }
                placeholder="e.g. NVIDIA RTX 4070 Laptop, AMD RX 7800 XT"
                className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Custom Dedicated VRAM */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-content-muted">
                VRAM (GB)
              </label>
              <input
                type="number"
                min={0}
                max={96}
                step={0.5}
                value={value.gpu?.vramGb ?? 4}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                }}
                onChange={(e) =>
                  onChange({
                    ...value,
                    gpu: value.gpu
                      ? { ...value.gpu, vramGb: Math.max(0, Number(e.target.value) || 0) }
                      : { model: "Custom GPU", type: "dedicated", vramGb: Math.max(0, Number(e.target.value) || 0) },
                  })
                }
                className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Custom Total RAM */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-content-muted">
                Exact RAM (GB)
              </label>
              <input
                type="number"
                min={4}
                max={512}
                value={value.ram.totalGb}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                }}
                onChange={(e) =>
                  onChange({
                    ...value,
                    ram: { ...value.ram, totalGb: Math.max(1, Number(e.target.value) || 1) },
                  })
                }
                className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Custom Free Storage */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-content-muted">
                Free Storage (GB)
              </label>
              <input
                type="number"
                min={10}
                max={10000}
                value={value.storage[0]?.freeGb || 200}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
                }}
                onChange={(e) => {
                  const freeGb = Math.max(0, Number(e.target.value) || 0);
                  onChange({
                    ...value,
                    storage: [
                      {
                        ...value.storage[0],
                        freeGb,
                        totalGb: Math.max(freeGb, value.storage[0]?.totalGb || 512),
                        type: "NVME_SSD",
                        isSystemDrive: true,
                      },
                    ],
                  });
                }}
                className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Virtualization & Laptop Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface-card border border-border-subtle">
              <input
                type="checkbox"
                checked={value.isVirtualizationEnabled ?? true}
                onChange={(e) =>
                  onChange({
                    ...value,
                    supportsVirtualization: e.target.checked,
                    isVirtualizationEnabled: e.target.checked,
                  })
                }
                className="accent-brand-primary h-4 w-4 rounded"
              />
              <span>Virtualization Enabled (VT-x / AMD-V)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-surface-card border border-border-subtle">
              <input
                type="checkbox"
                checked={value.deviceType === "laptop" || value.cpu.laptopVariant}
                onChange={(e) =>
                  onChange({
                    ...value,
                    deviceType: e.target.checked ? "laptop" : "desktop",
                    cpu: { ...value.cpu, laptopVariant: e.target.checked },
                    gpu: value.gpu ? { ...value.gpu, laptopVariant: e.target.checked } : undefined,
                  })
                }
                className="accent-brand-primary h-4 w-4 rounded"
              />
              <span>Laptop / Mobile Power Variant</span>
            </label>
          </div>
        </div>
      )}

      {/* OPTION 3: AUTO-PASTE FROM NATURAL LANGUAGE */}
      {activeTab === "autopaste" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <NaturalLanguageSpecInput
            onApplyParsedHardware={(parsed) => {
              onChange(parsed);
              setActiveTab("dropdown");
            }}
          />
        </div>
      )}

      {/* Current Hardware Summary Chips */}
      <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-content-muted flex items-center justify-between font-mono">
          <span>Active Hardware Summary</span>
          <span className="text-brand-primary font-bold">
            {value.deviceType === "laptop" ? "Laptop" : "Desktop"} • {value.os.family === "macos" ? "macOS" : value.os.family === "windows" ? "Windows 11" : "Linux"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-surface-main border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase font-bold block">CPU</span>
            <span className="font-bold text-content-strong truncate block mt-0.5" title={value.cpu.model}>
              {value.cpu.model}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-main border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase font-bold block">GPU</span>
            <span className="font-bold text-content-strong truncate block mt-0.5" title={value.gpu?.model || "Integrated"}>
              {value.gpu?.model || "Integrated"} {value.gpu?.vramGb ? `(${value.gpu.vramGb}GB)` : ""}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-main border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase font-bold block">RAM</span>
            <span className="font-bold text-content-strong block mt-0.5">
              {value.ram.totalGb} GB {value.ram.type || "RAM"}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-main border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase font-bold block">Storage</span>
            <span className="font-bold text-content-strong block mt-0.5">
              {value.storage[0]?.totalGb || 512} GB SSD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
