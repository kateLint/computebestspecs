"use client";

import { usePreferencesStore, preferencesStore } from "@/lib/stores/preferences-store";
import { X, Sun, Moon, Laptop, Eye, Gauge, Layers, Sliders, Check } from "lucide-react";
import { useEffect } from "react";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const {
    theme,
    motion,
    density,
    detailLevel,
  } = usePreferencesStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-modal-title"
    >
      <div className="surface-card w-full max-w-md rounded-3xl border border-border-subtle shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-brand-primary" />
            <h2 id="preferences-modal-title" className="text-base font-bold text-content-strong font-mono">
              Display & Experience Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-2 rounded-xl text-content-muted hover:text-content-strong hover:bg-surface-subtle transition-colors"
            aria-label="Close settings dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 text-xs font-mono">
          {/* Theme Preference */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              Theme Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "light", label: "Light", sub: "Always Light", icon: Sun },
                { id: "system", label: "System", sub: "Auto Sync", icon: Laptop },
                { id: "dark", label: "Dark", sub: "Always Dark", icon: Moon },
              ].map(({ id, label, sub, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => preferencesStore.setTheme(id as any)}
                  className={`touch-target p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    theme === id
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm ring-1 ring-brand-primary/30"
                      : "border-border-subtle bg-surface-subtle text-content-body hover:bg-surface-elevated"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-semibold text-xs">{label}</span>
                  <span className="text-[9px] opacity-75 font-normal">{sub}</span>
                </button>
              ))}
            </div>

            {/* Contextual Explanatory Banner */}
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle text-[11px] text-content-body font-sans leading-relaxed">
              {theme === "system" && (
                <div className="flex items-start gap-2 text-brand-primary">
                  <Laptop className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>System Mode:</strong> Dynamically inherits your operating system’s dark/light schedule.
                  </span>
                </div>
              )}
              {theme === "light" && (
                <div className="flex items-start gap-2 text-content-strong">
                  <Sun className="h-3.5 w-3.5 text-day-warning mt-0.5 shrink-0" />
                  <span>
                    <strong>Light Mode:</strong> Fixed crisp daylight theme with high contrast and ivory cards.
                  </span>
                </div>
              )}
              {theme === "dark" && (
                <div className="flex items-start gap-2 text-night-primary">
                  <Moon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Dark Mode:</strong> Fixed high-efficiency OLED night theme with slate surfaces.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Data Detail Level (Simple vs Technical) */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-brand-cyan" />
              Diagnostic Information Depth
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => preferencesStore.setDetailLevel("simple")}
                className={`touch-target p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  detailLevel === "simple"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                    : "border-border-subtle bg-surface-subtle text-content-body hover:bg-surface-elevated"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Simple</span>
                  {detailLevel === "simple" && <Check className="h-3.5 w-3.5" />}
                </div>
                <span className="text-[10px] text-content-muted font-normal">
                  Plain English verdicts & primary upgrade recommendations
                </span>
              </button>

              <button
                onClick={() => preferencesStore.setDetailLevel("technical")}
                className={`touch-target p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  detailLevel === "technical"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                    : "border-border-subtle bg-surface-subtle text-content-body hover:bg-surface-elevated"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Technical</span>
                  {detailLevel === "technical" && <Check className="h-3.5 w-3.5" />}
                </div>
                <span className="text-[10px] text-content-muted font-normal">
                  Memory headroom ratios, bandwidth traces, and raw metrics
                </span>
              </button>
            </div>
          </div>

          {/* Motion Preference */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-brand-violet" />
              UI Motion & Animation
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => preferencesStore.setMotion("standard")}
                className={`touch-target p-2.5 rounded-xl border text-center transition-all ${
                  motion === "standard"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                    : "border-border-subtle bg-surface-subtle text-content-body hover:bg-surface-elevated"
                }`}
              >
                Standard (Fast 140–240ms)
              </button>

              <button
                onClick={() => preferencesStore.setMotion("reduced")}
                className={`touch-target p-2.5 rounded-xl border text-center transition-all ${
                  motion === "reduced"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                    : "border-border-subtle bg-surface-subtle text-content-body hover:bg-surface-elevated"
                }`}
              >
                Reduced Motion Safe
              </button>
            </div>
          </div>

          {/* Density Preference */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-500" />
              Information Layout Density
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => preferencesStore.setDensity("comfortable")}
                className={`touch-target p-2.5 rounded-xl border text-center transition-all ${
                  density === "comfortable"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                    : "border-border-subtle bg-surface-subtle text-content-body hover:bg-surface-elevated"
                }`}
              >
                Comfortable
              </button>

              <button
                onClick={() => preferencesStore.setDensity("compact")}
                className={`touch-target p-2.5 rounded-xl border text-center transition-all ${
                  density === "compact"
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-bold shadow-sm"
                    : "border-border-subtle bg-surface-subtle text-content-body hover:bg-surface-elevated"
                }`}
              >
                Compact Density
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="touch-target w-full py-3 rounded-2xl bg-brand-primary text-white font-mono font-bold text-xs hover:bg-brand-primary-hover transition-colors shadow-sm"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
