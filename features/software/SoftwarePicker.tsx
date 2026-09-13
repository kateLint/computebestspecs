"use client";

import { useState, useEffect } from "react";
import { SelectedWorkload, WorkloadIntensity, ConcurrencyLevel } from "@/lib/domain/software";
import { Search, Plus, Trash2, Check, Sliders, Info, X } from "lucide-react";

interface SoftwarePickerProps {
  selectedWorkloads: SelectedWorkload[];
  onChange: (workloads: SelectedWorkload[]) => void;
  isSimultaneous: boolean;
  onSimultaneousChange: (simultaneous: boolean) => void;
}

export function SoftwarePicker({
  selectedWorkloads,
  onChange,
  isSimultaneous,
  onSimultaneousChange,
}: SoftwarePickerProps) {
  const [query, setQuery] = useState("");
  const [showSimultaneousInfo, setShowSimultaneousInfo] = useState(false);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [filteredCatalog, setFilteredCatalog] = useState<any[]>([]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/software/search?limit=30");
        const data = await res.json();
        setCatalog(data.results || []);
        setFilteredCatalog(data.results || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    if (!query) {
      setFilteredCatalog(catalog);
    } else {
      setFilteredCatalog(
        catalog.filter(
          (sw) =>
            sw.name.toLowerCase().includes(query.toLowerCase()) ||
            sw.category.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  }, [query, catalog]);

  const addSoftware = (sw: any) => {
    const version = sw.versions[0];
    const workload = version?.workloads[0];

    // Check if already added
    if (selectedWorkloads.some((w) => w.softwareId === sw.id)) return;

    const newWorkload: SelectedWorkload = {
      softwareId: sw.id,
      softwareName: sw.name,
      softwareVersionId: version?.id || sw.id,
      versionString: version?.version || "Latest",
      workloadId: workload?.id || "default",
      workloadName: workload?.name || "Normal use",
      intensity: (workload?.intensity as WorkloadIntensity) || "medium",
      concurrency: "foreground",
      quantity: 1,
    };

    onChange([...selectedWorkloads, newWorkload]);
  };

  const removeWorkload = (softwareId: string) => {
    onChange(selectedWorkloads.filter((w) => w.softwareId !== softwareId));
  };

  const updateWorkload = (softwareId: string, updates: Partial<SelectedWorkload>) => {
    onChange(
      selectedWorkloads.map((w) => (w.softwareId === softwareId ? { ...w, ...updates } : w))
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Available Software Badges */}
      <div>
        <label className="block text-xs font-mono font-bold text-content-muted uppercase tracking-wider mb-2">
          Select Applications
        </label>
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-content-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search software catalog (e.g. Photoshop, Android Studio, Docker, Chrome)..."
            className="w-full bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-content-strong placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all font-sans"
          />
        </div>

        {/* Quick Add Chips */}
        <div className="flex flex-wrap gap-2">
          {filteredCatalog.map((sw) => {
            const isSelected = selectedWorkloads.some((w) => w.softwareId === sw.id);
            return (
              <button
                key={sw.id}
                type="button"
                onClick={() => (isSelected ? removeWorkload(sw.id) : addSoftware(sw))}
                className={`touch-target flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                  isSelected
                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                    : "bg-surface-subtle border-border-subtle text-content-body hover:bg-surface-elevated hover:text-content-strong hover:border-border-strong"
                }`}
              >
                {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{sw.name}</span>
                <span className="text-[10px] opacity-75 font-normal">({sw.category})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Workload Customizer Cards */}
      {selectedWorkloads.length > 0 && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-brand-primary" />
              <span>Configure Selected Workloads ({selectedWorkloads.length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {selectedWorkloads.map((sw) => {
              const catalogItem = catalog.find((c) => c.id === sw.softwareId);
              const availableWorkloads = catalogItem?.versions[0]?.workloads || [];

              return (
                <div
                  key={sw.softwareId}
                  className="surface-card p-4 rounded-2xl border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-content-strong">{sw.softwareName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 font-bold">
                        {sw.versionString}
                      </span>
                    </div>
                    <p className="text-xs text-content-body mt-0.5">
                      Workload: <span className="text-content-strong font-semibold">{sw.workloadName}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Intensity / Workload Preset Dropdown */}
                    {availableWorkloads.length > 1 && (
                      <select
                        value={sw.workloadId}
                        onChange={(e) => {
                          const target = availableWorkloads.find((w: any) => w.id === e.target.value);
                          if (target) {
                            updateWorkload(sw.softwareId, {
                              workloadId: target.id,
                              workloadName: target.name,
                              intensity: target.intensity as WorkloadIntensity,
                            });
                          }
                        }}
                        className="bg-surface-subtle border border-border-subtle hover:border-border-strong rounded-xl px-2.5 py-1.5 text-xs text-content-strong font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                      >
                        {availableWorkloads.map((w: any) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.intensity})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Concurrency Weight */}
                    <select
                      value={sw.concurrency}
                      onChange={(e) =>
                        updateWorkload(sw.softwareId, {
                          concurrency: e.target.value as ConcurrencyLevel,
                        })
                      }
                      className="bg-surface-subtle border border-border-subtle hover:border-border-strong rounded-xl px-2.5 py-1.5 text-xs text-content-strong font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                    >
                      <option value="foreground">Foreground (100% Load)</option>
                      <option value="background">Background (65% Load)</option>
                      <option value="occasional">Occasional (35% Load)</option>
                    </select>

                    {/* Quantity for emulators / containers */}
                    {(sw.softwareName.toLowerCase().includes("emulator") ||
                      sw.softwareName.toLowerCase().includes("docker")) && (
                      <div className="flex items-center gap-1 bg-surface-subtle border border-border-subtle rounded-xl px-2 py-1 text-xs">
                        <span className="text-content-muted text-[10px]">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={sw.quantity || 1}
                          onChange={(e) =>
                            updateWorkload(sw.softwareId, {
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-8 bg-transparent text-center font-bold text-content-strong focus:outline-none"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeWorkload(sw.softwareId)}
                      className="touch-target p-2 text-content-muted hover:text-semantic-danger rounded-xl hover:bg-red-500/10 transition-colors ml-auto"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Simultaneous Usage Toggle */}
      <div className="surface-card p-4 sm:p-5 rounded-2xl border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm font-mono relative">
        <div className="flex items-start gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-content-strong">
                Run Applications Simultaneously?
              </span>
              <button
                type="button"
                onClick={() => setShowSimultaneousInfo(!showSimultaneousInfo)}
                className="p-1 rounded-lg text-content-muted hover:text-brand-primary hover:bg-surface-elevated transition-colors"
                title="What is Simultaneous execution?"
                aria-label="Explain Simultaneous execution"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-content-muted mt-0.5">
              {isSimultaneous
                ? "Calculates active concurrent memory, CPU load, and background reserves."
                : "Evaluates each application independently, taking peak single-app resource demands."}
            </p>
          </div>
        </div>

        {/* Explanatory Popover */}
        {showSimultaneousInfo && (
          <div className="absolute right-4 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-2xl bg-surface-card border border-border-strong shadow-xl z-30 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
              <span className="font-bold text-content-strong flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-brand-primary" />
                Execution Mode
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
                  ✓ Combined (Simultaneous Multitasking)
                </strong>
                <p className="text-content-body mt-0.5">
                  Evaluates system behavior when <strong>all chosen apps run at the same time</strong>. Stacks memory working sets, background reserves, and concurrent CPU threads.
                </p>
              </div>

              <div className="pt-1.5 border-t border-border-subtle">
                <strong className="text-content-strong block font-semibold">
                  ◻ Isolated (Single-App Standalone)
                </strong>
                <p className="text-content-muted mt-0.5">
                  Evaluates if your PC can handle each application <strong>individually</strong>, assuming other heavy programs are closed before launching.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-subtle shrink-0">
          <button
            type="button"
            onClick={() => onSimultaneousChange(true)}
            className={`touch-target px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isSimultaneous ? "bg-brand-primary text-white shadow-sm" : "text-content-muted hover:text-content-strong"
            }`}
          >
            Yes (Combined)
          </button>
          <button
            type="button"
            onClick={() => onSimultaneousChange(false)}
            className={`touch-target px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isSimultaneous ? "bg-brand-primary text-white shadow-sm" : "text-content-muted hover:text-content-strong"
            }`}
          >
            No (Isolated)
          </button>
        </div>
      </div>
    </div>
  );
}
