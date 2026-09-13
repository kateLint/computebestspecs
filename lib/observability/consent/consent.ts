/**
 * Consent Management Service
 * Controls tracking permissions, Global Privacy Control (GPC), and listener dispatch.
 */

import {
  ConsentState,
  getClientConsentCookie,
  setClientConsentCookie,
} from "./storage";

export type ConsentChangeListener = (state: ConsentState) => void;

class ConsentManager {
  private currentState: ConsentState = "unknown";
  private listeners: Set<ConsentChangeListener> = new Set();
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initClient();
    }
  }

  private initClient(): void {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Read existing cookie
    const stored = getClientConsentCookie();
    if (stored !== "unknown") {
      this.currentState = stored;
      return;
    }

    // 2. Check Global Privacy Control (GPC) signal
    if (this.isGlobalPrivacyControlActive()) {
      this.currentState = "essential_only";
      setClientConsentCookie("essential_only");
    }
  }

  /**
   * Checks if browser has Global Privacy Control enabled.
   */
  public isGlobalPrivacyControlActive(): boolean {
    if (typeof window === "undefined") return false;
    const nav = window.navigator as unknown as { globalPrivacyControl?: boolean };
    return nav.globalPrivacyControl === true;
  }

  /**
   * Retrieves current consent state.
   */
  public getConsentState(): ConsentState {
    if (typeof window !== "undefined" && !this.initialized) {
      this.initClient();
    }
    return this.currentState;
  }

  /**
   * Returns true if user has explicitly permitted product analytics.
   */
  public isAnalyticsAllowed(): boolean {
    return this.getConsentState() === "analytics_allowed";
  }

  /**
   * Updates consent decision and notifies active listeners.
   */
  public setConsentState(state: ConsentState): void {
    this.currentState = state;
    setClientConsentCookie(state);

    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Consent listener error:", err);
        }
      }
    });
  }

  /**
   * Registers a listener callback for consent state changes.
   */
  public onConsentChange(listener: ConsentChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Reset internal state (primarily for unit testing).
   */
  public reset(): void {
    this.currentState = "unknown";
    this.listeners.clear();
    this.initialized = false;
  }
}

export const consentManager = new ConsentManager();
