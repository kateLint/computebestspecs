import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Cookie, EyeOff, Server, Sliders, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy & Data Policy — ComputeBestSpecs",
  description: "Learn how ComputeBestSpecs protects your privacy, uses essential storage, and enforces strict data minimization.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-fade-in font-sans">
      {/* Header */}
      <div className="space-y-3 border-b border-border-subtle pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-primary hover:underline mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 uppercase">
            Data Minimization Standard
          </span>
          <span className="text-xs font-mono text-content-muted">v1.0 • Effective September 2026</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-content-strong tracking-tight">
          Privacy & Data Protection Policy
        </h1>
        <p className="text-xs sm:text-sm text-content-body max-w-3xl leading-relaxed">
          ComputeBestSpecs is built on strict data minimization principles. We perform deterministic compatibility sizing without harvesting user identities, selling data, or capturing raw personal specifications.
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-content-body leading-relaxed">
        {/* Section 1: Core Principles */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <h2>1. Our Privacy Commitments</h2>
          </div>
          <ul className="space-y-2 list-disc pl-5 text-content-body text-xs leading-relaxed">
            <li>
              <strong>No Account Required for Diagnostics:</strong> You can check your computer compatibility and find hardware specifications without creating an account or providing an email address.
            </li>
            <li>
              <strong>Zero Raw Specification Harvesting:</strong> Unstructured pasted text, custom model prompts, and free-form notes are never recorded into our analytics systems.
            </li>
            <li>
              <strong>No Behavioral Profiling or Cross-Site Tracking:</strong> We do not track you across third-party websites, nor do we sell data to data brokers or advertising networks.
            </li>
            <li>
              <strong>Deterministic Client & Server Parity:</strong> Hardware calculations are reproducible mathematical evaluations bounded by public hardware specifications.
            </li>
          </ul>
        </section>

        {/* Section 2: Storage & Cookies */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <Cookie className="h-5 w-5 text-brand-primary" />
            <h2>2. Cookies & Local Storage Breakdown</h2>
          </div>
          <p className="text-xs text-content-body">
            We categorize storage into two distinct categories:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-content-strong">Strictly Essential Storage</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                  Always Active
                </span>
              </div>
              <p className="text-xs text-content-muted">
                Stores your dark/light theme choice (<code>cbs_display_preferences_v1</code>) and your consent choice (<code>cbs_consent_v1</code>). These first-party cookies and localStorage keys are necessary to deliver the site layout.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-content-strong">Optional Product Analytics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-bold">
                  Consent Required
                </span>
              </div>
              <p className="text-xs text-content-muted">
                Measures aggregate feature usage and failure rates via PostHog. Disabled by default until you grant consent. We mask all inputs and never capture typed text.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Error Telemetry */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <Server className="h-5 w-5 text-brand-violet" />
            <h2>3. Application Reliability & Error Monitoring</h2>
          </div>
          <p className="text-xs text-content-body leading-relaxed">
            To diagnose software crashes and calculation exceptions, we use Sentry for error logging. All error payloads automatically strip cookies, authorization headers, request bodies, and personal query parameters before transmission.
          </p>
        </section>

        {/* Section 4: Global Privacy Control (GPC) & Rights */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <Sliders className="h-5 w-5 text-amber-500" />
            <h2>4. Your Controls & Global Privacy Control (GPC)</h2>
          </div>
          <p className="text-xs text-content-body leading-relaxed">
            We honor the browser <strong>Global Privacy Control (GPC)</strong> signal. When detected, the application automatically defaults to essential-only mode. You can modify or withdraw your consent at any time using the privacy settings control in the footer or by clearing your browser cookies.
          </p>
        </section>

        {/* Section 5: Commercial Disclosures */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <Lock className="h-5 w-5 text-brand-cyan" />
            <h2>5. Commercial Relationships & Affiliate Transparency</h2>
          </div>
          <p className="text-xs text-content-body leading-relaxed">
            ComputeBestSpecs may include links to authorized hardware retailers. Compatibility rankings and sizing calculations are strictly independent and mathematically derived from workload requirements; commercial affiliate partnerships never alter diagnostic scores or recommendation order.
          </p>
        </section>
      </div>
    </div>
  );
}
