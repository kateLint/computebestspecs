/**
 * Canonical Domain Errors for ComputeBestSpecs
 * Explicit error types for engine, validation, and resolution boundaries.
 */

export class DomainValidationError extends Error {
  public readonly issues: unknown[];

  constructor(message: string, issues: unknown[] = []) {
    super(message);
    this.name = "DomainValidationError";
    this.issues = issues;
    Object.setPrototypeOf(this, DomainValidationError.prototype);
  }
}

export class InsufficientDataError extends Error {
  public readonly missingFields: string[];

  constructor(message: string, missingFields: string[] = []) {
    super(message);
    this.name = "InsufficientDataError";
    this.missingFields = missingFields;
    Object.setPrototypeOf(this, InsufficientDataError.prototype);
  }
}

export class AmbiguousHardwareError extends Error {
  public readonly rawQuery: string;
  public readonly candidates: string[];

  constructor(message: string, rawQuery: string, candidates: string[] = []) {
    super(message);
    this.name = "AmbiguousHardwareError";
    this.rawQuery = rawQuery;
    this.candidates = candidates;
    Object.setPrototypeOf(this, AmbiguousHardwareError.prototype);
  }
}

export class UnsupportedEvaluationError extends Error {
  public readonly reasonCode: string;

  constructor(message: string, reasonCode: string) {
    super(message);
    this.name = "UnsupportedEvaluationError";
    this.reasonCode = reasonCode;
    Object.setPrototypeOf(this, UnsupportedEvaluationError.prototype);
  }
}
