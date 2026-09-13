/**
 * Server Request Context & Correlation Identifier Management
 */

import { AsyncLocalStorage } from "async_hooks";
import { nanoid } from "nanoid";

export interface RequestContextData {
  requestId: string;
  route?: string;
  method?: string;
  startTime: number;
  userId?: string;
  [key: string]: unknown;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContextData>();

/**
 * Validates or generates a safe request ID.
 */
export function sanitizeOrGenerateRequestId(incomingId?: string | null): string {
  if (incomingId && typeof incomingId === "string") {
    // Only allow alphanumeric and hyphen/underscore to prevent log injection
    const sanitized = incomingId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    if (sanitized.length >= 8) {
      return sanitized;
    }
  }
  return `cbs_${nanoid(16)}`;
}

/**
 * Runs a server operation with an associated request context.
 */
export function runWithRequestContext<T>(
  context: Partial<RequestContextData>,
  fn: () => Promise<T> | T
): Promise<T> | T {
  const fullContext: RequestContextData = {
    requestId: sanitizeOrGenerateRequestId(context.requestId),
    route: context.route,
    method: context.method,
    startTime: context.startTime || Date.now(),
    userId: context.userId,
    ...context,
  };

  return asyncLocalStorage.run(fullContext, fn);
}

/**
 * Retrieves the current request context if available.
 */
export function getRequestContext(): RequestContextData | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Gets current request ID or generates a fallback ID.
 */
export function getCurrentRequestId(): string {
  const ctx = getRequestContext();
  return ctx?.requestId || sanitizeOrGenerateRequestId();
}
