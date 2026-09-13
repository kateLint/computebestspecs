import { describe, it, expect } from "vitest";
import {
  sanitizeOrGenerateRequestId,
  runWithRequestContext,
  getRequestContext,
} from "@/lib/observability/logging/request-context";
import { logger } from "@/lib/observability/logging/logger";

describe("Observability: Structured Logging & Request Context", () => {
  it("should validate and sanitize incoming request IDs", () => {
    expect(sanitizeOrGenerateRequestId("cbs_custom_req_12345")).toBe("cbs_custom_req_12345");
    // Invalid characters stripped
    expect(sanitizeOrGenerateRequestId("req<script>alert(1)</script>_12345678")).toBe("reqscriptalert1script_12345678");
    // Too short -> generates valid fallback
    const fallback = sanitizeOrGenerateRequestId("short");
    expect(fallback.startsWith("cbs_")).toBe(true);
    expect(fallback.length).toBeGreaterThan(10);
  });

  it("should propagate request context in async execution scopes", async () => {
    await runWithRequestContext(
      {
        requestId: "cbs_test_req_88888888",
        route: "/api/compatibility/evaluate",
        method: "POST",
      },
      async () => {
        const ctx = getRequestContext();
        expect(ctx?.requestId).toBe("cbs_test_req_88888888");
        expect(ctx?.route).toBe("/api/compatibility/evaluate");
        expect(ctx?.method).toBe("POST");
      }
    );
  });

  it("should format logs safely without throwing", () => {
    expect(() => {
      logger.info("test_info_event", { component: "test", count: 5 });
      logger.warn("test_warn_event", { reason: "high_latency" });
      logger.error("test_error_event", new Error("Simulated failure"), { errorCode: "ERR_TEST" });
    }).not.toThrow();
  });
});
