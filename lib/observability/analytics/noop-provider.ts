/**
 * Safe No-Op Analytics Provider
 * Used when analytics is disabled, consent is withheld, or credentials are absent.
 */

import { AnalyticsProvider } from "./provider";
import { AnalyticsEventMap, AnalyticsEventName } from "./events";

export class NoopAnalyticsProvider implements AnalyticsProvider {
  public readonly name = "noop";

  public init(): void {}

  public track<E extends AnalyticsEventName>(event: E, properties: AnalyticsEventMap[E]): void {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true") {
      console.debug(`[Analytics:Noop] track "${event}"`, properties);
    }
  }

  public identify(userId: string, traits?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true") {
      console.debug(`[Analytics:Noop] identify "${userId}"`, traits);
    }
  }

  public reset(): void {}

  public shutdown(): void {}
}
