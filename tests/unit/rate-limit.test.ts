import { describe, it, expect } from "vitest";
import { rateLimit, rateLimitResponseHeaders, getClientIp } from "@/lib/security/rate-limit";
import { NextRequest } from "next/server";

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-under-${Math.random()}`;
    const r1 = rateLimit(key, { windowMs: 60_000, max: 3 });
    const r2 = rateLimit(key, { windowMs: 60_000, max: 3 });
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it("blocks requests once the limit is exceeded", () => {
    const key = `test-over-${Math.random()}`;
    rateLimit(key, { windowMs: 60_000, max: 2 });
    rateLimit(key, { windowMs: 60_000, max: 2 });
    const blocked = rateLimit(key, { windowMs: 60_000, max: 2 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    rateLimit(keyA, { windowMs: 60_000, max: 1 });
    const blockedA = rateLimit(keyA, { windowMs: 60_000, max: 1 });
    const allowedB = rateLimit(keyB, { windowMs: 60_000, max: 1 });
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it("resets the window after it elapses", async () => {
    const key = `test-reset-${Math.random()}`;
    rateLimit(key, { windowMs: 10, max: 1 });
    const blocked = rateLimit(key, { windowMs: 10, max: 1 });
    expect(blocked.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 20));

    const afterReset = rateLimit(key, { windowMs: 10, max: 1 });
    expect(afterReset.allowed).toBe(true);
  });
});

describe("rateLimitResponseHeaders", () => {
  it("exposes limit, remaining, and retry-after headers", () => {
    const result = rateLimit(`test-headers-${Math.random()}`, { windowMs: 60_000, max: 5 });
    const headers = rateLimitResponseHeaders(result);
    expect(headers["X-RateLimit-Limit"]).toBe("5");
    expect(Number(headers["Retry-After"])).toBeGreaterThanOrEqual(0);
  });
});

describe("getClientIp", () => {
  it("prefers the first entry of x-forwarded-for", () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.9" },
    });
    expect(getClientIp(req)).toBe("198.51.100.9");
  });

  it("returns unknown when no IP headers are present", () => {
    const req = new NextRequest("http://localhost/api/test");
    expect(getClientIp(req)).toBe("unknown");
  });
});
