"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cpu, ShieldCheck, Sliders, Lock, Sparkles, FileText } from "lucide-react";
import { useConsent } from "./consent/ConsentProvider";
import { SuggestCatalogModal } from "./catalog/SuggestCatalogModal";

export function Footer() {
  const { openPrivacySettings } = useConsent();
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);

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
            <Link href="/compare" className="hover:text-brand-primary transition-colors">
              Comparison Matrix
            </Link>
            <button
              type="button"
              onClick={() => setIsSuggestOpen(true)}
              className="hover:text-brand-primary transition-colors inline-flex items-center gap-1 text-brand-primary font-bold cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>Suggest Specs</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-content-muted">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Deterministic Logic • Zero Hallucinations</span>
          </div>
        </div>

        <div className="pt-6 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] text-content-muted">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© {new Date().getFullYear()} ComputeBestSpecs.</p>
            <span className="hidden sm:inline">•</span>
            <p className="text-content-secondary">
              Architected by{" "}
              <a
                href="https://www.linkedin.com/in/keren-katya-lint-4a0a3645/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-content-strong hover:text-brand-primary transition-colors hover:underline"
              >
                Keren (Katya) Lint
              </a>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.linkedin.com/in/keren-katya-lint-4a0a3645/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-content-strong hover:underline flex items-center gap-1.5 transition-colors text-content-body font-medium"
            >
              <svg className="h-3.5 w-3.5 fill-current text-[#0A66C2]" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 0 0-1.66 1.63 1.64 1.64 0 1 0 3.3 0 1.64 1.64 0 0 0-1.64-1.63Z" />
              </svg>
              <span>LinkedIn</span>
            </a>
            <span>•</span>
            <a
              href="https://x.com/ktlint"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-content-strong hover:underline flex items-center gap-1.5 transition-colors text-content-body font-medium"
            >
              <svg className="h-3 w-3 fill-current text-content-strong" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@ktlint</span>
            </a>
            <span>•</span>
            <a
              href="mailto:ktlint3@gmail.com"
              className="hover:text-content-strong hover:underline flex items-center gap-1.5 transition-colors text-content-body font-medium"
            >
              <svg className="h-3.5 w-3.5 fill-none stroke-current text-amber-500" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <span>ktlint3@gmail.com</span>
            </a>
            <span>•</span>
            <Link href="/llms.txt" target="_blank" className="hover:text-content-strong hover:underline flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>llms.txt</span>
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-content-strong hover:underline flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>Privacy</span>
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-content-strong hover:underline flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>Terms</span>
            </Link>
            <span>•</span>
            <button
              type="button"
              onClick={openPrivacySettings}
              className="hover:text-content-strong hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="h-3 w-3" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      <SuggestCatalogModal
        isOpen={isSuggestOpen}
        onClose={() => setIsSuggestOpen(false)}
      />
    </footer>
  );
}
