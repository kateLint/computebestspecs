/**
 * Vendor-independent Error Reporter Interface
 */

export type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

export interface ErrorContext {
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
  user?: { id: string };
  fingerprint?: string[];
  level?: ErrorSeverity;
  route?: string;
  requestId?: string;
}

export interface ErrorReporter {
  name: string;
  init(): void;
  captureException(error: unknown, context?: ErrorContext): string | undefined;
  captureMessage(message: string, level?: ErrorSeverity, context?: ErrorContext): string | undefined;
  setContext(name: string, context: Record<string, unknown>): void;
  setUser(user: { id: string } | null): void;
  clearUser(): void;
}
