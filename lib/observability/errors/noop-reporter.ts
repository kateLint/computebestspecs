/**
 * Safe No-Op Error Reporter
 */

import { ErrorReporter, ErrorContext, ErrorSeverity } from "./reporter";

export class NoopErrorReporter implements ErrorReporter {
  public readonly name = "noop";

  public init(): void {}

  public captureException(error: unknown, context?: ErrorContext): string | undefined {
    if (process.env.NODE_ENV === "development") {
      console.error("[Errors:Noop] captureException:", error, context);
    }
    return undefined;
  }

  public captureMessage(message: string, level: ErrorSeverity = "info", context?: ErrorContext): string | undefined {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Errors:Noop] captureMessage (${level}):`, message, context);
    }
    return undefined;
  }

  public setContext(_name: string, _context: Record<string, unknown>): void {}

  public setUser(_user: { id: string } | null): void {}

  public clearUser(): void {}
}
