import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkReadiness = searchParams.get("ready") === "true";
  const release = process.env.NEXT_PUBLIC_ENGINE_VERSION || "1.0.0";
  const timestamp = new Date().toISOString();

  // 1. Shallow Liveness Check (Default - zero overhead)
  if (!checkReadiness) {
    return NextResponse.json({
      status: "healthy",
      release,
      timestamp,
    });
  }

  // 2. Readiness Check (Optional safe DB ping)
  try {
    // Quick, inexpensive raw query that checks connectivity without dumping table contents
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      release,
      timestamp,
      database: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        release,
        timestamp,
        database: "disconnected",
      },
      { status: 503 }
    );
  }
}
