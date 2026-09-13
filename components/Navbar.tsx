"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Sparkles, Database, Info, Zap, SlidersHorizontal, UserCheck, Scale } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./theme/ThemeToggle";
import { PreferencesModal } from "./PreferencesModal";

export function Navbar() {
  const pathname = usePathname();
  const [showLegal, setShowLegal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-surface-main/90 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo with 6-Resource Node Compute Core */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-surface-card border border-border-subtle group-hover:border-brand-primary/50 transition-all shadow-sm">
              <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true">
                {/* 6 Surrounding Resource Nodes */}
                <circle cx="16" cy="4" r="1.75" fill="var(--res-cpu)" />
                <circle cx="26" cy="9" r="1.75" fill="var(--res-gpu)" />
                <circle cx="26" cy="23" r="1.75" fill="var(--res-ram)" />
                <circle cx="16" cy="28" r="1.75" fill="var(--res-vram)" />
                <circle cx="6" cy="23" r="1.75" fill="var(--res-storage)" />
                <circle cx="6" cy="9" r="1.75" fill="var(--res-platform)" />

                {/* Radial Bus Lines */}
                <line x1="16" y1="6" x2="16" y2="12" stroke="var(--border-strong)" strokeWidth="1.2" />
                <line x1="24" y1="10.5" x2="19.5" y2="13.5" stroke="var(--border-strong)" strokeWidth="1.2" />
                <line x1="24" y1="21.5" x2="19.5" y2="18.5" stroke="var(--border-strong)" strokeWidth="1.2" />
                <line x1="16" y1="26" x2="16" y2="20" stroke="var(--border-strong)" strokeWidth="1.2" />
                <line x1="8" y1="21.5" x2="12.5" y2="18.5" stroke="var(--border-strong)" strokeWidth="1.2" />
                <line x1="8" y1="10.5" x2="12.5" y2="13.5" stroke="var(--border-strong)" strokeWidth="1.2" />

                {/* Central Compute Core Diamond */}
                <rect
                  x="16"
                  y="11.5"
                  width="6.5"
                  height="6.5"
                  rx="1.5"
                  transform="rotate(45 16 11.5)"
                  fill="url(#coreGradient)"
                  className="group-hover:scale-110 transition-transform origin-center"
                />

                <defs>
                  <linearGradient id="coreGradient" x1="12" y1="12" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--brand-cyan)" />
                    <stop offset="1" stopColor="var(--brand-violet)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-content-strong flex items-center gap-1.5">
                ComputeBestSpecs
                <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  PRECISION
                </span>
              </span>
              <p className="text-[10px] sm:text-[11px] text-content-muted hidden sm:block font-mono">Workload Concurrency & Diagnostic Engine</p>
            </div>
          </Link>

          {/* Desktop & Tablet Navigation */}
          <nav className="flex items-center gap-1 sm:gap-1.5 font-sans text-xs sm:text-sm" aria-label="Main Navigation">
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/check"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  pathname.startsWith("/check")
                    ? "bg-brand-primary text-white shadow-xs font-semibold"
                    : "text-content-body hover:text-content-strong hover:bg-surface-elevated"
                }`}
              >
                <Cpu className="h-4 w-4" />
                <span>Check My Computer</span>
              </Link>

              <Link
                href="/recommend"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  pathname.startsWith("/recommend")
                    ? "bg-brand-primary text-white shadow-xs font-semibold"
                    : "text-content-body hover:text-content-strong hover:bg-surface-elevated"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Find a Computer</span>
              </Link>

              <Link
                href="/ai"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  pathname.startsWith("/ai")
                    ? "bg-surface-elevated text-brand-primary border border-brand-primary/30 shadow-xs font-semibold"
                    : "text-content-body hover:text-content-strong hover:bg-surface-elevated"
                }`}
              >
                <Zap className="h-4 w-4 text-brand-primary" />
                <span>Local AI</span>
              </Link>

              <Link
                href="/compare"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  pathname.startsWith("/compare")
                    ? "bg-brand-primary text-white shadow-xs font-semibold"
                    : "text-content-body hover:text-content-strong hover:bg-surface-elevated"
                }`}
              >
                <Scale className="h-4 w-4 text-cyan-400" />
                <span>Compare</span>
              </Link>

              <Link
                href="/software"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors ${
                  pathname.startsWith("/software")
                    ? "bg-surface-elevated text-content-strong border border-border-strong shadow-xs font-semibold"
                    : "text-content-body hover:text-content-strong hover:bg-surface-elevated"
                }`}
              >
                <Database className="h-4 w-4 text-content-muted" />
                <span>Software Catalog</span>
              </Link>

              <Link
                href="/fit"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors text-content-muted hover:text-content-strong hover:bg-surface-elevated ${
                  pathname.startsWith("/fit")
                    ? "bg-surface-elevated text-brand-primary font-semibold"
                    : ""
                }`}
                title="Advanced Longevity & Multitasking Fit Analysis"
              >
                <UserCheck className="h-4 w-4" />
                <span>Advanced Fit</span>
              </Link>
            </div>

            {/* Display & Experience Preferences Button */}
            <button
              onClick={() => setShowPreferences(true)}
              className="touch-target p-2 text-content-muted hover:text-content-strong transition-colors rounded-xl hover:bg-surface-elevated border border-transparent hover:border-border-subtle"
              title="Display & Experience Preferences"
              aria-label="Open display preferences (theme, motion, density, detail level)"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {/* Info / Methodology Modal Button */}
            <button
              onClick={() => setShowLegal(true)}
              className="touch-target p-2 text-content-muted hover:text-content-strong transition-colors rounded-xl hover:bg-surface-elevated border border-transparent hover:border-border-subtle"
              title="Methodology & Provenance Policy"
              aria-label="Methodology and legal disclaimer"
            >
              <Info className="h-4 w-4" />
            </button>

            {/* Day / Night Theme Switcher */}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {/* Legal & Methodology Modal */}
      {showLegal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-mono" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
          <div className="surface-card w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-border-subtle text-content-body">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 id="legal-modal-title" className="text-sm font-bold text-content-strong flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-primary" />
                Data Provenance & Disclaimer
              </h3>
              <button
                onClick={() => setShowLegal(false)}
                className="touch-target text-content-muted hover:text-content-strong text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed text-content-body font-sans">
              <p>
                <strong className="text-content-strong">Independent Diagnostic Engine:</strong> ComputeBestSpecs is an independent workload analytics engine and is not affiliated with, endorsed by, or sponsored by Adobe Inc., Google LLC, Epic Games, Blender Foundation, or any other trademark holder.
              </p>
              <p>
                <strong className="text-content-strong">Deterministic Calculations:</strong> Compatibility scoring and hardware recommendations are derived from structured vendor documentation, official release notes, and mathematical workload concurrency models.
              </p>
              <p>
                <strong className="text-content-strong">Thermal & Real-world Variances:</strong> Actual computer performance can vary based on laptop cooling chassis, sustained TGP, driver updates, and specific project layer sizes.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLegal(false)}
                className="touch-target px-5 py-2 bg-brand-primary text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all font-mono"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
