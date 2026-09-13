"use client";

import Link from "next/link";
import { Cpu, ShieldCheck, Sliders, Lock } from "lucide-react";
import { useConsent } from "./consent/ConsentProvider";

export function Footer() {
  const { openPrivacySettings } = useConsent();

  return (
    <footer className="w-full border-t border-border-subtle bg-surface-secondary text-content-body py-10 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-content-strong">ComputeBestSpecs</p>
              <p className="text-xs text-content-muted">
                Deterministic Hardware & Workload Sizing Engine
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-semibold">
            <Link href="/check" className="hover:text-brand-primary transition-colors">
              Check My Computer
            </Link>
            <Link href="/recommend" className="hover:text-brand-primary transition-colors">
              Find a Computer
            </Link>
            <Link href="/ai" className="hover:text-brand-primary transition-colors">
              Local AI
            </Link>
            <Link href="/software" className="hover:text-brand-primary transition-colors">
              Software Catalog
            </Link>
            <Link href="/fit" className="hover:text-brand-primary transition-colors">
              Advanced Fit
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-content-muted">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Deterministic Logic • Zero Hallucinations</span>
          </div>
        </div>

        <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-content-muted">
          <p>© {new Date().getFullYear()} ComputeBestSpecs. All specifications are public benchmark & vendor standards.</p>
          
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-content-strong hover:underline flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Privacy Policy</span>
            </Link>
            <span>•</span>
            <button
              type="button"
              onClick={openPrivacySettings}
              className="hover:text-content-strong hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="h-3 w-3" />
              <span>Cookie & Privacy Settings</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
