/**
 * Privacy-Safe PostHog Analytics Provider Integration
 */

import posthog from "posthog-js";
import { AnalyticsProvider } from "./provider";
import { AnalyticsEventMap, AnalyticsEventName, ANALYTICS_SCHEMA_VERSION } from "./events";
import { redactSensitiveData } from "../privacy/redact";

export interface PostHogConfig {
  apiKey?: string;
  apiHost?: string;
  environment?: "development" | "production" | "test";
  release?: string;
}

export class PostHogAnalyticsProvider implements AnalyticsProvider {
  public readonly name = "posthog";
  private initialized = false;
  private config: PostHogConfig;

  constructor(config?: PostHogConfig) {
    this.config = {
      apiKey: config?.apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiHost: config?.apiHost || process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      environment: config?.environment || (process.env.NODE_ENV as any) || "development",
      release: config?.release || process.env.NEXT_PUBLIC_ENGINE_VERSION || "1.0.0",
    };
  }

  public init(): void {
    if (this.initialized || typeof window === "undefined" || !this.config.apiKey) {
      return;
    }

    try {
      posthog.init(this.config.apiKey, {
        api_host: this.config.apiHost,
        autocapture: false, // Strict: no implicit click/keystroke harvesting
        capture_pageview: false, // Explicit: page views tracked intentionally
        capture_pageleave: false,
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true, // Strict: never record text inputs or form fields
          maskTextSelector: "*", // Mask all free-form text on screen
          blockClass: "ph-no-capture",
          blockSelector: "[data-private], .ph-no-capture, input, textarea",
        },
        persistence: "cookie",
        cross_subdomain_cookie: false,
        secure_cookie: window.location.protocol === "https:",
        sanitize_properties: (properties) => {
          return redactSensitiveData(properties);
        },
        loaded: (ph) => {
          if (this.config.environment === "development" && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true") {
            ph.debug();
          }
        },
      });

      this.initialized = true;
    } catch (err) {
      if (this.config.environment === "development") {
        console.error("[Analytics:PostHog] Initialization failed:", err);
      }
    }
  }

  public track<E extends AnalyticsEventName>(event: E, properties: AnalyticsEventMap[E]): void {
    if (!this.initialized || typeof window === "undefined") return;

    try {
      const sanitizedProps = redactSensitiveData({
        ...properties,
        schemaVersion: properties.schemaVersion || ANALYTICS_SCHEMA_VERSION,
        environment: this.config.environment,
        release: this.config.release,
      });

      posthog.capture(event, sanitizedProps);
    } catch (err) {
      if (this.config.environment === "development") {
        console.error(`[Analytics:PostHog] Error tracking "${event}":`, err);
      }
    }
  }

  public identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.initialized || typeof window === "undefined") return;

    try {
      const sanitizedTraits = traits ? redactSensitiveData(traits) : undefined;
      posthog.identify(userId, sanitizedTraits);
    } catch (err) {
      if (this.config.environment === "development") {
        console.error("[Analytics:PostHog] Error identifying user:", err);
      }
    }
  }

  public reset(): void {
    if (!this.initialized || typeof window === "undefined") return;

    try {
      posthog.reset();
    } catch (err) {
      if (this.config.environment === "development") {
        console.error("[Analytics:PostHog] Error resetting posthog:", err);
      }
    }
  }

  public shutdown(): void {
    if (!this.initialized || typeof window === "undefined") return;

    try {
      posthog.reset();
      this.initialized = false;
    } catch {}
  }
}
