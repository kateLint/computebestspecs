"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, ShieldCheck, Cookie, Sliders, CheckCircle2, AlertTriangle } from "lucide-react";
import { ConsentState } from "@/lib/observability/consent/storage";
import { consentManager } from "@/lib/observability/consent/consent";
import { analytics } from "@/lib/observability/analytics/client";

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacySettingsModal({ isOpen, onClose }: PrivacySettingsModalProps) {
  const [allowAnalytics, setAllowAnalytics] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const current = consentManager.getConsentState();
      setAllowAnalytics(current === "analytics_allowed");
      setSavedMessage(null);
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
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

  const handleSave = () => {
    const previousState = consentManager.getConsentState();
    const newState: ConsentState = allowAnalytics ? "analytics_allowed" : "essential_only";
    
    consentManager.setConsentState(newState);

    if (newState === "analytics_allowed") {
      analytics.track("consent_updated", {
        previousState,
        newState,
      });
    }

    setSavedMessage(
      newState === "analytics_allowed"
        ? "Preferences saved: Product analytics enabled."
        : "Preferences saved: Essential cookies only (Analytics disabled)."
    );

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleWithdrawAll = () => {
    const previousState = consentManager.getConsentState();
    consentManager.setConsentState("essential_only");
    setAllowAnalytics(false);
    setSavedMessage("All optional analytics withdrawn. Tracking data cleared.");
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-surface-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 id="privacy-settings-title" className="text-base sm:text-lg font-bold text-content-strong">
                Privacy & Cookie Preferences
              </h2>
              <p className="text-xs text-content-muted">Control what data and storage this application uses.</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close privacy settings"
            className="touch-target p-2 rounded-xl text-content-muted hover:text-content-strong hover:bg-surface-subtle transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-content-body">
          {savedMessage && (
            <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{savedMessage}</span>
            </div>
          )}

          {/* Section 1: Strictly Essential Storage */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-bold text-content-strong">1. Strictly Essential Storage</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                Always Active
              </span>
            </div>
            <p className="text-content-muted leading-relaxed">
              Required for basic website functionality, including remembering your dark/light theme preference, maintaining secure local calculations, and storing your consent decision. Contains zero tracking identifiers or personal details.
            </p>
          </div>

          {/* Section 2: Product Analytics */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cookie className="h-4 w-4 text-brand-primary" />
                <span className="font-bold text-content-strong">2. Product Analytics & Diagnostics</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAnalytics}
                  onChange={(e) => setAllowAnalytics(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border-strong peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>
            <p className="text-content-muted leading-relaxed">
              Helps us understand feature adoption and aggregate compatibility outcomes via privacy-focused PostHog. We strictly mask form text, reject raw hardware specifications, and do not track personal identities.
            </p>
          </div>

          {/* Section 3: Saved Comparisons & Drafts */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <span className="font-bold text-content-strong">3. Local Browser Storage & Saved Comparisons</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear all locally saved computers and comparison slots?")) {
                    localStorage.removeItem("cbs_comparison_set_v1");
                    localStorage.removeItem("cbs_current_draft_v1");
                    setSavedMessage("Cleared all local comparison data successfully.");
                  }
                }}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:underline"
              >
                Clear Saved Computers
              </button>
            </div>
            <p className="text-content-muted leading-relaxed">
              Comparison slots and draft forms are kept strictly inside your local browser (<code className="font-mono text-[10px]">localStorage</code>) without using cookies or server uploads.
            </p>
          </div>

          {/* Notice about Global Privacy Control & Link */}
          <div className="text-[11px] text-content-muted space-y-1">
            <p>
              We honor the browser <strong>Global Privacy Control (GPC)</strong> signal by defaulting to essential-only storage.
            </p>
            <p>
              Read our full{" "}
              <Link href="/privacy" onClick={onClose} className="text-brand-primary hover:underline font-semibold">
                Privacy & Data Policy
              </Link>{" "}
              for detailed documentation on data practices and third-party subprocessors.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border-subtle bg-surface-elevated flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleWithdrawAll}
            className="touch-target w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border-subtle text-content-muted hover:text-content-strong text-xs font-semibold transition-all hover:bg-surface-subtle"
          >
            Withdraw All Optional
          </button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="touch-target flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-border-subtle text-content-strong text-xs font-semibold hover:bg-surface-subtle transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="touch-target flex-1 sm:flex-initial px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
