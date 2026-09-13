/**
 * Unified Error Reporter Facade
 */

import { ErrorReporter, ErrorContext, ErrorSeverity } from "./reporter";
import { NoopErrorReporter } from "./noop-reporter";
import { SentryErrorReporter } from "./sentry-provider";

export * from "./reporter";
export * from "./noop-reporter";
export * from "./sentry-provider";

class ErrorReporterClient {
  private activeReporter: ErrorReporter;

  constructor() {
    const dsn = typeof window !== "undefined" ? process.env.NEXT_PUBLIC_SENTRY_DSN : process.env.SENTRY_DSN;
    if (dsn) {
      this.activeReporter = new SentryErrorReporter();
    } else {
      this.activeReporter = new NoopErrorReporter();
    }
  }

  public captureException(error: unknown, context?: ErrorContext): string | undefined {
    return this.activeReporter.captureException(error, context);
  }

  public captureMessage(message: string, level?: ErrorSeverity, context?: ErrorContext): string | undefined {
    return this.activeReporter.captureMessage(message, level, context);
  }

  public setContext(name: string, context: Record<string, unknown>): void {
    this.activeReporter.setContext(name, context);
  }

  public setUser(user: { id: string } | null): void {
    this.activeReporter.setUser(user);
  }

  public clearUser(): void {
    this.activeReporter.clearUser();
  }

  public getReporterName(): string {
    return this.activeReporter.name;
  }
}

export const errors = new ErrorReporterClient();
