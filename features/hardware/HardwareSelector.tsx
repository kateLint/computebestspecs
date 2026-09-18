"use client";

import { useState, useEffect, useRef } from "react";
import { HardwareProfile, CpuArchitecture, StorageType, DeviceType, OperatingSystemFamily } from "@/lib/domain/hardware";
import { Search, Cpu, HardDrive, Monitor, Laptop, Server, AlertCircle, X, Sparkles } from "lucide-react";

interface HardwareSelectorProps {
  value: HardwareProfile;
  onChange: (profile: HardwareProfile) => void;
}

const POPULAR_CPU_PRESETS = [
  "Apple M4 Max",
  "Apple M3 Pro",
  "Intel Core i9-14900K",
  "Intel Core i7-13700K",
  "AMD Ryzen 7 7800X3D",
  "AMD Ryzen 5 7600X",
  "Intel Core Ultra 7 155H",
];

const POPULAR_GPU_PRESETS = [
  "RTX 4090",
  "RTX 4080 Super",
  "RTX 4070",
  "RTX 4060",
  "Apple M3 Max GPU",
  "Radeon RX 7900 XTX",
  "Intel Arc A770",
];

export function HardwareSelector({ value, onChange }: HardwareSelectorProps) {
  const [cpuQuery, setCpuQuery] = useState(value.cpu.model);
  const [gpuQuery, setGpuQuery] = useState(value.gpu?.model || "");
  const [cpuResults, setCpuResults] = useState<any[]>([]);
  const [gpuResults, setGpuResults] = useState<any[]>([]);
  const [showCpuDropdown, setShowCpuDropdown] = useState(false);
  const [showGpuDropdown, setShowGpuDropdown] = useState(false);
  const [isManualCpu, setIsManualCpu] = useState(!value.cpu.isVerified);
  const [isManualGpu, setIsManualGpu] = useState(value.gpu ? !value.gpu.isVerified : false);

  useEffect(() => {
    if (isManualCpu) {
      setCpuResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const url = cpuQuery.trim()
          ? `/api/hardware/search?type=cpu&q=${encodeURIComponent(cpuQuery.trim())}&limit=30`
          : `/api/hardware/search?type=cpu&limit=30`;
        const res = await fetch(url);
        const data = await res.json();
        setCpuResults(data.results?.cpus || []);
      } catch (err) {
        console.error(err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [cpuQuery, isManualCpu]);

  useEffect(() => {
    if (isManualGpu) {
      setGpuResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const url = gpuQuery.trim()
          ? `/api/hardware/search?type=gpu&q=${encodeURIComponent(gpuQuery.trim())}&limit=30`
          : `/api/hardware/search?type=gpu&limit=30`;
        const res = await fetch(url);
        const data = await res.json();
        setGpuResults(data.results?.gpus || []);
      } catch (err) {
        console.error(err);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [gpuQuery, isManualGpu]);

  const selectCpu = (cpu: any) => {
    setCpuQuery(cpu.model);
    setShowCpuDropdown(false);
    setIsManualCpu(false);
    onChange({
      ...value,
      cpu: {
        catalogCpuId: cpu.id,
        model: cpu.model,
        manufacturer: cpu.manufacturer,
        architecture: cpu.architecture,
        physicalCores: cpu.physicalCores || undefined,
        performanceScore: cpu.performanceScore,
        laptopVariant: cpu.laptopVariant,
        isVerified: true,
      },
      architecture: cpu.architecture,
    });
  };

  const selectGpu = (gpu: any) => {
    setGpuQuery(gpu.model);
    setShowGpuDropdown(false);
    setIsManualGpu(false);
    onChange({
      ...value,
      gpu: {
        catalogGpuId: gpu.id,
        model: gpu.model,
        manufacturer: gpu.manufacturer,
        type: gpu.type,
        performanceScore: gpu.performanceScore,
        vramGb: gpu.vramGb,
        supportsCuda: gpu.supportsCuda,
        supportsMetal: gpu.supportsMetal,
        supportsVulkan: gpu.supportsVulkan,
        supportsDirectX12: gpu.supportsDirectX12,
        laptopVariant: gpu.laptopVariant,
        isVerified: true,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Device Type & OS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-bold text-content-muted uppercase tracking-wider mb-2">
            Device Form Factor
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["desktop", "laptop", "workstation"] as DeviceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ ...value, deviceType: type })}
                className={`touch-target flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-mono font-bold capitalize transition-all ${
                  value.deviceType === type
                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                    : "bg-surface-subtle border-border-subtle text-content-body hover:bg-surface-elevated hover:text-content-strong hover:border-border-strong"
                }`}
              >
                {type === "laptop" && <Laptop className="h-4 w-4" />}
                {type === "desktop" && <Monitor className="h-4 w-4" />}
                {type === "workstation" && <Server className="h-4 w-4" />}
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-content-muted uppercase tracking-wider mb-2">
            Operating System
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["windows", "macos", "linux"] as OperatingSystemFamily[]).map((osFamily) => (
              <button
                key={osFamily}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    os: {
                      ...value.os,
                      family: osFamily,
                      architecture: value.architecture,
                    },
                  })
                }
                className={`touch-target flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-mono font-bold capitalize transition-all ${
                  value.os.family === osFamily
                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                    : "bg-surface-subtle border-border-subtle text-content-body hover:bg-surface-elevated hover:text-content-strong hover:border-border-strong"
                }`}
              >
                {osFamily}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Processor Autocomplete & Manual Fallback */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono font-bold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-brand-primary" />
            <span>Processor (CPU)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsManualCpu(!isManualCpu);
              onChange({
                ...value,
                cpu: {
                  ...value.cpu,
                  isVerified: isManualCpu,
                },
              });
            }}
            className="text-[11px] font-mono text-brand-primary hover:underline transition-colors"
          >
            {isManualCpu ? "Use Catalog Search" : "Manual Specification"}
          </button>
        </div>

        {!isManualCpu ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-content-muted" />
              <input
                type="text"
                value={cpuQuery}
                onChange={(e) => {
                  setCpuQuery(e.target.value);
                  setShowCpuDropdown(true);
                }}
                onFocus={() => setShowCpuDropdown(true)}
                placeholder="Search CPU (e.g. Ryzen 7 7800X3D, i9-14900K, Apple M4 Max)..."
                className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-content-strong placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all font-sans"
              />
              {cpuQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCpuQuery("");
                    setShowCpuDropdown(true);
                  }}
                  className="absolute right-3 top-2.5 p-1 rounded-full text-content-muted hover:text-content-strong hover:bg-surface-elevated transition-colors"
                  title="Clear search to browse all 80+ CPUs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Popular CPU Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-content-muted shrink-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Quick:
              </span>
              <button
                type="button"
                onClick={() => {
                  setCpuQuery("");
                  setShowCpuDropdown(true);
                }}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0 transition-colors ${
                  !cpuQuery.trim()
                    ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                    : "bg-surface-subtle border-border-subtle text-content-muted hover:text-content-strong hover:border-border-strong"
                }`}
              >
                Browse All (80+)
              </button>
              {POPULAR_CPU_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setCpuQuery(preset);
                    setShowCpuDropdown(true);
                  }}
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0 transition-colors ${
                    cpuQuery.toLowerCase() === preset.toLowerCase()
                      ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                      : "bg-surface-subtle border-border-subtle text-content-muted hover:text-content-strong hover:border-border-strong"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {showCpuDropdown && (
              <div className="relative z-30">
                <div className="absolute top-0 left-0 w-full bg-surface-card rounded-xl shadow-xl border border-border-subtle overflow-hidden max-h-64 overflow-y-auto font-mono">
                  <div className="px-3 py-1.5 bg-surface-subtle border-b border-border-subtle text-[10px] font-mono text-content-muted flex items-center justify-between">
                    <span>
                      {cpuResults.length > 0
                        ? `Showing ${cpuResults.length} matching verified CPUs`
                        : "No CPUs found matching search"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCpuDropdown(false)}
                      className="text-content-muted hover:text-content-strong font-bold"
                    >
                      ✕ Close
                    </button>
                  </div>
                  {cpuResults.length > 0 ? (
                    cpuResults.map((cpu) => (
                      <button
                        key={cpu.id}
                        type="button"
                        onClick={() => selectCpu(cpu)}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-elevated text-xs text-content-body hover:text-content-strong flex items-center justify-between border-b border-border-subtle last:border-0"
                      >
                        <div>
                          <span className="font-bold text-content-strong">{cpu.model}</span>
                          <span className="ml-2 text-[10px] text-content-muted">
                            {cpu.physicalCores ? `${cpu.physicalCores} Cores • ` : ""}
                            {cpu.architecture}
                            {cpu.laptopVariant ? " • Laptop" : ""}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-bold border border-brand-primary/20">
                          Score: {cpu.performanceScore}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-content-muted">
                      No matching models found. Clear the search field or switch to{" "}
                      <span
                        className="text-brand-primary cursor-pointer underline"
                        onClick={() => setIsManualCpu(true)}
                      >
                        Manual Specification
                      </span>
                      .
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-surface-subtle border border-amber-500/30 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Manual Entry Mode (Unverified catalog entry)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-content-muted uppercase font-bold block mb-1">CPU Model Name</label>
                <input
                  type="text"
                  value={value.cpu.model}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      cpu: { ...value.cpu, model: e.target.value, isVerified: false },
                    })
                  }
                  className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-content-muted uppercase font-bold block mb-1">Physical Cores</label>
                <input
                  type="number"
                  value={value.cpu.physicalCores || 6}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      cpu: { ...value.cpu, physicalCores: parseInt(e.target.value) || 6, isVerified: false },
                    })
                  }
                  className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-content-muted uppercase font-bold block mb-1">Architecture</label>
                <select
                  value={value.cpu.architecture}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      cpu: { ...value.cpu, architecture: e.target.value as CpuArchitecture, isVerified: false },
                      architecture: e.target.value as CpuArchitecture,
                    })
                  }
                  className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="x86_64">x86_64 (Intel / AMD)</option>
                  <option value="arm64">arm64 (Apple Silicon / Qualcomm)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Graphics (GPU) Autocomplete & Manual Fallback */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono font-bold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
            <Monitor className="h-4 w-4 text-indigo-500" />
            <span>Graphics Card (GPU)</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setIsManualGpu(!isManualGpu);
              if (value.gpu) {
                onChange({
                  ...value,
                  gpu: { ...value.gpu, isVerified: isManualGpu },
                });
              }
            }}
            className="text-[11px] font-mono text-brand-primary hover:underline transition-colors"
          >
            {isManualGpu ? "Use Catalog Search" : "Manual Specification"}
          </button>
        </div>

        {!isManualGpu ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-content-muted" />
              <input
                type="text"
                value={gpuQuery}
                onChange={(e) => {
                  setGpuQuery(e.target.value);
                  setShowGpuDropdown(true);
                }}
                onFocus={() => setShowGpuDropdown(true)}
                placeholder="Search GPU (e.g. RTX 4080 Super, RTX 4070, Apple M3 Max GPU)..."
                className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-content-strong placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all font-sans"
              />
              {gpuQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setGpuQuery("");
                    setShowGpuDropdown(true);
                  }}
                  className="absolute right-3 top-2.5 p-1 rounded-full text-content-muted hover:text-content-strong hover:bg-surface-elevated transition-colors"
                  title="Clear search to browse all 60+ GPUs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Popular GPU Quick Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-content-muted shrink-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                Quick:
              </span>
              <button
                type="button"
                onClick={() => {
                  setGpuQuery("");
                  setShowGpuDropdown(true);
                }}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0 transition-colors ${
                  !gpuQuery.trim()
                    ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                    : "bg-surface-subtle border-border-subtle text-content-muted hover:text-content-strong hover:border-border-strong"
                }`}
              >
                Browse All (60+)
              </button>
              {POPULAR_GPU_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setGpuQuery(preset);
                    setShowGpuDropdown(true);
                  }}
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0 transition-colors ${
                    gpuQuery.toLowerCase() === preset.toLowerCase()
                      ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                      : "bg-surface-subtle border-border-subtle text-content-muted hover:text-content-strong hover:border-border-strong"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {showGpuDropdown && (
              <div className="relative z-30">
                <div className="absolute top-0 left-0 w-full bg-surface-card rounded-xl shadow-xl border border-border-subtle overflow-hidden max-h-64 overflow-y-auto font-mono">
                  <div className="px-3 py-1.5 bg-surface-subtle border-b border-border-subtle text-[10px] font-mono text-content-muted flex items-center justify-between">
                    <span>
                      {gpuResults.length > 0
                        ? `Showing ${gpuResults.length} matching verified GPUs`
                        : "No GPUs found matching search"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGpuDropdown(false)}
                      className="text-content-muted hover:text-content-strong font-bold"
                    >
                      ✕ Close
                    </button>
                  </div>
                  {gpuResults.length > 0 ? (
                    gpuResults.map((gpu) => (
                      <button
                        key={gpu.id}
                        type="button"
                        onClick={() => selectGpu(gpu)}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-elevated text-xs text-content-body hover:text-content-strong flex items-center justify-between border-b border-border-subtle last:border-0"
                      >
                        <div>
                          <span className="font-bold text-content-strong">{gpu.model}</span>
                          <span className="ml-2 text-[10px] text-content-muted">
                            {gpu.vramGb}GB VRAM • {gpu.type}
                            {gpu.laptopVariant ? " • Laptop" : ""}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-bold border border-brand-primary/20">
                          Score: {gpu.performanceScore}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-content-muted">
                      No matching models found. Clear the search field or switch to{" "}
                      <span
                        className="text-brand-primary cursor-pointer underline"
                        onClick={() => setIsManualGpu(true)}
                      >
                        Manual Specification
                      </span>
                      .
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-surface-subtle border border-amber-500/30 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-content-muted uppercase font-bold block mb-1">GPU Model Name</label>
                <input
                  type="text"
                  value={value.gpu?.model || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      gpu: {
                        model: e.target.value,
                        type: "dedicated",
                        vramGb: value.gpu?.vramGb || 4,
                        performanceScore: 50,
                        isVerified: false,
                      },
                    })
                  }
                  className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-content-muted uppercase font-bold block mb-1">Dedicated VRAM (GB)</label>
                <input
                  type="number"
                  value={value.gpu?.vramGb || 4}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      gpu: {
                        model: value.gpu?.model || "Custom GPU",
                        type: "dedicated",
                        vramGb: parseFloat(e.target.value) || 4,
                        performanceScore: 50,
                        isVerified: false,
                      },
                    })
                  }
                  className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="text-[10px] text-content-muted uppercase font-bold block mb-1">GPU Type</label>
                <select
                  value={value.gpu?.type || "dedicated"}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      gpu: {
                        model: value.gpu?.model || "Custom GPU",
                        type: e.target.value as any,
                        vramGb: value.gpu?.vramGb || 4,
                        performanceScore: 50,
                        isVerified: false,
                      },
                    })
                  }
                  className="w-full bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-xs text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="dedicated">Dedicated Graphics (NVIDIA / AMD)</option>
                  <option value="integrated">Integrated Graphics (Intel UHD / Iris / Radeon)</option>
                  <option value="unified">Apple Unified Graphics</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Memory (RAM) Selector */}
      <div>
        <label className="block text-xs font-mono font-bold text-content-muted uppercase tracking-wider mb-2">
          System Memory (RAM)
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono">
          {[8, 16, 24, 32, 64, 128].map((gb) => (
            <button
              key={gb}
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  ram: { ...value.ram, totalGb: gb },
                })
              }
              className={`touch-target py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                value.ram.totalGb === gb
                  ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                  : "bg-surface-subtle border-border-subtle text-content-body hover:bg-surface-elevated hover:text-content-strong hover:border-border-strong"
              }`}
            >
              {gb} GB
            </button>
          ))}
        </div>
      </div>

      {/* Storage Drive Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
        <div>
          <label className="block text-xs font-bold text-content-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HardDrive className="h-4 w-4 text-emerald-500" />
            <span>Storage Drive Type</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: "NVME_SSD" as StorageType, label: "NVMe SSD" },
              { type: "SATA_SSD" as StorageType, label: "SATA SSD" },
              { type: "HDD" as StorageType, label: "HDD" },
            ].map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    storage: [{ ...value.storage[0], type }],
                  })
                }
                className={`touch-target py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                  value.storage[0]?.type === type
                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                    : "bg-surface-subtle border-border-subtle text-content-body hover:bg-surface-elevated hover:text-content-strong hover:border-border-strong"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-content-muted uppercase tracking-wider mb-2">
            Drive Total Capacity
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[256, 512, 1000, 2000].map((gb) => (
              <button
                key={gb}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    storage: [{ ...value.storage[0], totalGb: gb }],
                  })
                }
                className={`touch-target py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  value.storage[0]?.totalGb === gb
                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                    : "bg-surface-subtle border-border-subtle text-content-body hover:bg-surface-elevated hover:text-content-strong hover:border-border-strong"
                }`}
              >
                {gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
