"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ConsentState } from "@/lib/observability/consent/storage";
import { consentManager } from "@/lib/observability/consent/consent";
import { ConsentBanner } from "./ConsentBanner";
import { PrivacySettingsModal } from "./PrivacySettingsModal";

interface ConsentContextType {
  consentState: ConsentState;
  isAnalyticsAllowed: boolean;
  openPrivacySettings: () => void;
  setConsent: (state: ConsentState) => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentState, setConsentState] = useState<ConsentState>("unknown");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setConsentState(consentManager.getConsentState());

    const unsubscribe = consentManager.onConsentChange((newState) => {
      setConsentState(newState);
    });

    return () => unsubscribe();
  }, []);

  const openPrivacySettings = () => setIsSettingsOpen(true);
  const setConsent = (state: ConsentState) => consentManager.setConsentState(state);

  return (
    <ConsentContext.Provider
      value={{
        consentState,
        isAnalyticsAllowed: consentState === "analytics_allowed",
        openPrivacySettings,
        setConsent,
      }}
    >
      {children}
      <ConsentBanner />
      <PrivacySettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
}
