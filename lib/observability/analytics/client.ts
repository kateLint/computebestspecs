/**
 * Unified Analytics Client Facade
 * Enforces consent guards, event schema versioning, and provider switching.
 */

import { AnalyticsProvider } from "./provider";
import { NoopAnalyticsProvider } from "./noop-provider";
import { PostHogAnalyticsProvider } from "./posthog-provider";
import { AnalyticsEventMap, AnalyticsEventName, ANALYTICS_SCHEMA_VERSION } from "./events";
import { consentManager } from "../consent/consent";

class AnalyticsClient {
  private activeProvider: AnalyticsProvider;
  private noopProvider: NoopAnalyticsProvider;
  private posthogProvider: PostHogAnalyticsProvider | null = null;
  private isInitialized = false;

  constructor() {
    this.noopProvider = new NoopAnalyticsProvider();
    this.activeProvider = this.noopProvider;

    if (typeof window !== "undefined") {
      this.init();
    }
  }

  public init(): void {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    // Listen for consent changes
    consentManager.onConsentChange((state) => {
      this.updateProvider(state === "analytics_allowed");
    });

    // Check initial consent state
    this.updateProvider(consentManager.isAnalyticsAllowed());
  }

  private updateProvider(allowed: boolean): void {
    if (allowed) {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (apiKey) {
        if (!this.posthogProvider) {
          this.posthogProvider = new PostHogAnalyticsProvider({ apiKey });
        }
        this.posthogProvider.init();
        this.activeProvider = this.posthogProvider;
        return;
      }
    }

    // Consent not granted or API key not configured -> fallback to safe No-op
    if (this.posthogProvider) {
      this.posthogProvider.shutdown();
    }
    this.activeProvider = this.noopProvider;
  }

  /**
   * Tracks a typed product analytics event.
   */
  public track<E extends AnalyticsEventName>(event: E, properties: Omit<AnalyticsEventMap[E], "schemaVersion">): void {
    if (typeof window === "undefined") return;

    try {
      const fullProps = {
        ...properties,
        schemaVersion: ANALYTICS_SCHEMA_VERSION,
      } as AnalyticsEventMap[E];

      this.activeProvider.track(event, fullProps);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[AnalyticsClient] Failed to track "${event}":`, err);
      }
    }
  }

  /**
   * Identifies an authenticated user using an opaque internal ID (never raw email).
   */
  public identify(userId: string, safeTraits?: Record<string, unknown>): void {
    if (typeof window === "undefined") return;
    this.activeProvider.identify(userId, safeTraits);
  }

  /**
   * Resets identity on logout or session end.
   */
  public reset(): void {
    if (typeof window === "undefined") return;
    this.activeProvider.reset();
  }

  /**
   * Returns current active provider name.
   */
  public getProviderName(): string {
    return this.activeProvider.name;
  }
}

export const analytics = new AnalyticsClient();
