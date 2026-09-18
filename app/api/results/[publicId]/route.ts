import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getClientIp, rateLimit, rateLimitResponseHeaders } from "@/lib/security/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const rl = rateLimit(`results:${getClientIp(req)}`, { windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: rateLimitResponseHeaders(rl) }
    );
  }

  try {
    const { publicId } = params;

    const snapshot = await prisma.evaluationSnapshot.findUnique({
      where: { publicId },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Evaluation result snapshot not found." } },
        { status: 404 }
      );
    }

    const input = JSON.parse(snapshot.inputSnapshot || "{}");
    const result = JSON.parse(snapshot.resultSnapshot || "{}");

    return NextResponse.json({
      publicId: snapshot.publicId,
      hardwareProfile: input.hardware,
      selectedWorkloads: input.workloads,
      result,
      engineVersion: snapshot.engineVersion,
      evaluationFingerprint: snapshot.evaluationFingerprint,
      createdAt: snapshot.createdAt.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to retrieve saved result snapshot." } },
      { status: 500 }
    );
  }
}
