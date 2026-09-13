import { describe, it, expect } from "vitest";
import {
  redactSensitiveData,
  redactSensitiveString,
  redactQueryParameters,
  sanitizeHeaders,
} from "@/lib/observability/privacy/redact";

describe("Observability: Privacy Redaction Utilities", () => {
  it("should redact sensitive keys in nested objects", () => {
    const rawData = {
      user: {
        id: "u_123",
        email: "alice@example.com",
        password: "supersecretpassword",
        authToken: "bearer_xyz_789",
      },
      specs: {
        cpuCores: 8,
        ramGb: 32,
        rawSpecText: "Intel i9 14900K 64GB DDR5 RTX 4090",
        pastedContent: "My secret laptop model #12345",
      },
      safeField: "optimal",
    };

    const redacted = redactSensitiveData(rawData);

    expect(redacted.user.id).toBe("u_123");
    expect(redacted.user.password).toBe("[REDACTED]");
    expect(redacted.user.authToken).toBe("[REDACTED]");
    expect(redacted.specs.cpuCores).toBe(8);
    expect(redacted.specs.ramGb).toBe(32);
    expect(redacted.specs.rawSpecText).toBe("[REDACTED]");
    expect(redacted.specs.pastedContent).toBe("[REDACTED]");
    expect(redacted.safeField).toBe("optimal");
  });

  it("should mask email addresses within strings", () => {
    const raw = "Contact admin at support@computebestspecs.com for assistance.";
    const masked = redactSensitiveString(raw);
    expect(masked).toBe("Contact admin at s***@computebestspecs.com for assistance.");
  });

  it("should redact sensitive query parameters from URLs", () => {
    const url = "https://computebestspecs.com/check?token=secret123&apiKey=xyz&tab=gpu&ref=home";
    const clean = redactQueryParameters(url);
    expect(clean).toContain("token=%5BREDACTED%5D");
    expect(clean).toContain("tab=gpu");
    expect(clean).toContain("ref=home");
    expect(clean).not.toContain("secret123");
  });

  it("should redact sensitive HTTP headers", () => {
    const headers = {
      "content-type": "application/json",
      authorization: "Bearer secret_jwt_token_123",
      cookie: "session=xyz789; cbs_consent_v1=analytics_allowed",
      "x-request-id": "cbs_req_12345678",
    };

    const sanitized = sanitizeHeaders(headers);

    expect(sanitized["content-type"]).toBe("application/json");
    expect(sanitized["x-request-id"]).toBe("cbs_req_12345678");
    expect(sanitized.authorization).toBe("[REDACTED]");
    expect(sanitized.cookie).toBe("[REDACTED]");
  });
});
