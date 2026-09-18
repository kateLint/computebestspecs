import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logging/logger";

// Evaluation snapshots are unauthenticated and unbounded (one row per
// /api/compatibility/evaluate call), so this prunes old ones on a schedule.
// Snapshots with attached user feedback are kept indefinitely since they're
// used for engine calibration.
const RETENTION_DAYS = 90;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.evaluationSnapshot.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      feedback: { is: null },
    },
  });

  logger.info("evaluation_snapshot_cleanup_completed", {
    deletedCount: result.count,
    cutoff: cutoff.toISOString(),
  });

  return NextResponse.json({ deleted: result.count, cutoff: cutoff.toISOString() });
}
