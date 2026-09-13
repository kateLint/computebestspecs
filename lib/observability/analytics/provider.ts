/**
 * Vendor-independent Analytics Provider Interface
 */

import { AnalyticsEventMap, AnalyticsEventName } from "./events";

export interface AnalyticsProvider {
  name: string;
  init(): Promise<void> | void;
  track<E extends AnalyticsEventName>(event: E, properties: AnalyticsEventMap[E]): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
  shutdown(): void;
}
