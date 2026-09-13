"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Sliders } from "lucide-react";
import { consentManager } from "@/lib/observability/consent/consent";
import { analytics } from "@/lib/observability/analytics/client";
import { PrivacySettingsModal } from "./PrivacySettingsModal";

export function ConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = consentManager.getConsentState();
    if (current === "unknown") {
      setShowBanner(true);
    }

    const unsubscribe = consentManager.onConsentChange((state) => {
      setShowBanner(state === "unknown");
    });

    return () => unsubscribe();
  }, []);

  if (!mounted || !showBanner) {
    return isSettingsOpen ? (
      <PrivacySettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    ) : null;
  }

  const handleAllowAnalytics = () => {
    consentManager.setConsentState("analytics_allowed");
    setShowBanner(false);
    analytics.track("consent_updated", {
      previousState: "unknown",
      newState: "analytics_allowed",
    });
  };

  const handleEssentialOnly = () => {
    consentManager.setConsentState("essential_only");
    setShowBanner(false);
  };

  return (
    <>
      <div
        role="region"
        aria-label="Privacy and cookie consent"
        className="fixed bottom-0 inset-x-0 z-40 p-4 sm:p-6 bg-surface-card/95 backdrop-blur-md border-t border-border-strong shadow-2xl animate-fade-in mobile-safe-bottom"
      >
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Information & Privacy Notice */}
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-primary" />
              <h2 className="text-xs sm:text-sm font-bold text-content-strong">
                Privacy-First Analytics & Storage Choices
              </h2>
            </div>
            <p className="text-xs text-content-body leading-relaxed">
              We use strictly essential storage for your preferences and calculations. Optional privacy-safe product analytics help us improve compatibility diagnostics without ever harvesting personal identities, emails, or raw hardware specifications.
            </p>
            <div className="flex items-center gap-3 pt-0.5 text-[11px] text-content-muted">
              <Link href="/privacy" className="text-brand-primary hover:underline font-semibold">
                Privacy Policy
              </Link>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="hover:text-content-strong flex items-center gap-1 transition-colors"
              >
                <Sliders className="h-3 w-3" />
                <span>Customize Settings</span>
              </button>
            </div>
          </div>

          {/* Action Buttons (Equally Weighted, No Dark Pattern) */}
          <div className="flex flex-row items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="touch-target flex-1 md:flex-initial px-5 py-2.5 rounded-xl border border-border-strong bg-surface-elevated text-content-strong hover:bg-surface-secondary text-xs font-bold transition-all shadow-sm"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleAllowAnalytics}
              className="touch-target flex-1 md:flex-initial px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all shadow-md"
            >
              Allow Analytics
            </button>
          </div>
        </div>
      </div>

      <PrivacySettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
