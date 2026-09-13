/**
 * Structured Server JSON Logger
 * Formats logs as single-line JSON with request correlation and automatic PII redaction.
 */

import { getRequestContext } from "./request-context";
import { redactSensitiveData } from "../privacy/redact";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  environment: string;
  release: string;
  requestId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  errorCode?: string;
  engineVersion?: string;
  catalogVersion?: string;
  [key: string]: unknown;
}

class StructuredLogger {
  private environment: string;
  private release: string;
  private engineVersion: string;

  constructor() {
    this.environment = process.env.NODE_ENV || "development";
    this.release = process.env.NEXT_PUBLIC_ENGINE_VERSION || "1.0.0";
    this.engineVersion = process.env.NEXT_PUBLIC_ENGINE_VERSION || "1.0.0";
  }

  private write(level: LogLevel, event: string, fields?: Record<string, unknown>): void {
    const ctx = getRequestContext();
    const durationMs = ctx ? Date.now() - ctx.startTime : undefined;

    const rawEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      environment: this.environment,
      release: this.release,
      engineVersion: this.engineVersion,
      requestId: ctx?.requestId,
      route: ctx?.route,
      method: ctx?.method,
      durationMs,
      ...fields,
    };

    const sanitizedEntry = redactSensitiveData(rawEntry);
    const jsonString = JSON.stringify(sanitizedEntry);

    if (level === "error") {
      process.stderr.write(jsonString + "\n");
    } else {
      process.stdout.write(jsonString + "\n");
    }
  }

  public debug(event: string, fields?: Record<string, unknown>): void {
    if (this.environment === "development" || process.env.LOG_LEVEL === "debug") {
      this.write("debug", event, fields);
    }
  }

  public info(event: string, fields?: Record<string, unknown>): void {
    this.write("info", event, fields);
  }

  public warn(event: string, fields?: Record<string, unknown>): void {
    this.write("warn", event, fields);
  }

  public error(event: string, error?: unknown, fields?: Record<string, unknown>): void {
    let errorDetails: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorDetails = {
        errorMessage: error.message,
        errorName: error.name,
        errorStack: this.environment === "development" ? error.stack : undefined,
      };
    } else if (error && typeof error === "object") {
      errorDetails = { errorObject: error };
    } else if (typeof error === "string") {
      errorDetails = { errorMessage: error };
    }

    this.write("error", event, {
      ...errorDetails,
      ...fields,
    });
  }
}

export const logger = new StructuredLogger();
