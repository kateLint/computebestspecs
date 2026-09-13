/**
 * Sentry Error Monitoring Integration with Privacy and Redaction Filtering
 */

import * as Sentry from "@sentry/nextjs";
import { ErrorReporter, ErrorContext, ErrorSeverity } from "./reporter";
import { redactSensitiveData, redactQueryParameters } from "../privacy/redact";
import { consentManager } from "../consent/consent";

export interface SentryReporterConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
}

export class SentryErrorReporter implements ErrorReporter {
  public readonly name = "sentry";
  private isClient: boolean;
  private initialized = false;

  constructor(config?: SentryReporterConfig) {
    this.isClient = typeof window !== "undefined";
    const dsn = config?.dsn || (this.isClient ? process.env.NEXT_PUBLIC_SENTRY_DSN : process.env.SENTRY_DSN);

    if (dsn) {
      this.initSentry(dsn, config);
    }
  }

  private initSentry(dsn: string, config?: SentryReporterConfig): void {
    if (this.initialized) return;

    try {
      Sentry.init({
        dsn,
        environment: config?.environment || process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
        release: config?.release || process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_ENGINE_VERSION || "1.0.0",
        tracesSampleRate: config?.tracesSampleRate ?? (process.env.NODE_ENV === "production" ? 0.05 : 1.0),
        sendDefaultPii: false, // Strict: do not auto-harvest IP/cookies
        beforeSend: (event) => {
          // Strip request cookies and auth headers
          if (event.request?.headers) {
            delete event.request.headers.cookie;
            delete event.request.headers.authorization;
          }

          // Redact query parameters in request URL
          if (event.request?.url) {
            event.request.url = redactQueryParameters(event.request.url);
          }

          // Redact extra context
          if (event.extra) {
            event.extra = redactSensitiveData(event.extra);
          }

          return event;
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Strip sensitive breadcrumb data (e.g. form inputs or auth URLs)
          if (breadcrumb.category === "ui.click" || breadcrumb.category === "ui.input") {
            return null; // Skip noisy keystroke/input breadcrumbs
          }
          if (breadcrumb.data?.url) {
            breadcrumb.data.url = redactQueryParameters(breadcrumb.data.url);
          }
          return breadcrumb;
        },
      });

      this.initialized = true;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Errors:Sentry] Initialization error:", err);
      }
    }
  }

  public init(): void {}

  public captureException(error: unknown, context?: ErrorContext): string | undefined {
    if (!this.initialized) return undefined;

    try {
      return Sentry.captureException(error, {
        level: (context?.level as any) || "error",
        tags: context?.tags ? (redactSensitiveData(context.tags) as any) : undefined,
        extra: context?.extra ? redactSensitiveData(context.extra) : undefined,
        user: context?.user ? { id: context.user.id } : undefined,
        fingerprint: context?.fingerprint,
      });
    } catch {
      return undefined;
    }
  }

  public captureMessage(message: string, level: ErrorSeverity = "info", context?: ErrorContext): string | undefined {
    if (!this.initialized) return undefined;

    try {
      return Sentry.captureMessage(message, {
        level: level as any,
        tags: context?.tags ? (redactSensitiveData(context.tags) as any) : undefined,
        extra: context?.extra ? redactSensitiveData(context.extra) : undefined,
        user: context?.user ? { id: context.user.id } : undefined,
        fingerprint: context?.fingerprint,
      });
    } catch {
      return undefined;
    }
  }

  public setContext(name: string, context: Record<string, unknown>): void {
    if (!this.initialized) return;
    try {
      Sentry.setContext(name, redactSensitiveData(context));
    } catch {}
  }

  public setUser(user: { id: string } | null): void {
    if (!this.initialized) return;
    try {
      Sentry.setUser(user ? { id: user.id } : null);
    } catch {}
  }

  public clearUser(): void {
    if (!this.initialized) return;
    try {
      Sentry.setUser(null);
    } catch {}
  }
}
