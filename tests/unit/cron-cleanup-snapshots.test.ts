import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    evaluationSnapshot: {
      deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
  },
}));

describe("GET /api/cron/cleanup-snapshots", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("rejects requests without the bearer token", async () => {
    const { GET } = await import("@/app/api/cron/cleanup-snapshots/route");
    const req = new NextRequest("http://localhost/api/cron/cleanup-snapshots");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("rejects requests with the wrong bearer token", async () => {
    const { GET } = await import("@/app/api/cron/cleanup-snapshots/route");
    const req = new NextRequest("http://localhost/api/cron/cleanup-snapshots", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("fails closed when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("@/app/api/cron/cleanup-snapshots/route");
    const req = new NextRequest("http://localhost/api/cron/cleanup-snapshots", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("deletes stale, feedback-less snapshots when authorized", async () => {
    const { GET } = await import("@/app/api/cron/cleanup-snapshots/route");
    const req = new NextRequest("http://localhost/api/cron/cleanup-snapshots", {
      headers: { authorization: "Bearer test-cron-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(3);
  });
});
