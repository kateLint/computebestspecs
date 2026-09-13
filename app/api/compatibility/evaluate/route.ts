import { NextRequest, NextResponse } from "next/server";
import { CompatibilityEvaluationRequestSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import { evaluateCompatibility } from "@/lib/engine/evaluate";
import { nanoid } from "nanoid";
import { SoftwareVersion } from "@/lib/domain/software";
import { dbVersionToDomain } from "@/lib/data/catalog-helper";
import { logger } from "@/lib/observability/logging/logger";
import { errors } from "@/lib/observability/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CompatibilityEvaluationRequestSchema.parse(body);

    logger.info("compatibility_evaluation_received", {
      workloadCount: validated.workloads.length,
      isSimultaneous: validated.isSimultaneous,
      osFamily: validated.hardware.os?.family,
    });

    // 1. Fetch relevant software version records from DB
    const softwareIds = validated.workloads.map((w: any) => w.softwareId);
    const softwareRecords = await prisma.software.findMany({
      where: {
        OR: [
          { id: { in: softwareIds } },
          { slug: { in: softwareIds } },
        ],
      },
      include: {
        versions: {
          include: {
            requirementProfiles: {
              include: {
                rules: true,
              },
            },
            workloads: true,
            revisions: true,
          },
        },
      },
    });

    const parsedVersions: SoftwareVersion[] = [];
    for (const sw of softwareRecords) {
      for (const v of sw.versions) {
        try {
          parsedVersions.push(dbVersionToDomain(sw, v));
        } catch (e) {
          logger.warn("software_version_parse_warning", { softwareId: sw.id, versionId: v.id });
        }
      }
    }

    // 2. Run Pure Domain Compatibility Engine
    const result = evaluateCompatibility({
      hardware: validated.hardware as any,
      workloads: validated.workloads as any,
      softwareVersions: parsedVersions,
      scenarioMode: validated.isSimultaneous ? "PEAK" : "TYPICAL",
    });

    // 3. Save Immutable Evaluation Snapshot for Permalinks & Auditability
    const publicId = `cbs_${nanoid(10)}`;
    await prisma.evaluationSnapshot.create({
      data: {
        publicId,
        evaluationFingerprint: result.meta.evaluationFingerprint,
        inputSnapshot: JSON.stringify({
          hardware: validated.hardware,
          workloads: validated.workloads,
          isSimultaneous: validated.isSimultaneous,
        }),
        requirementsSnapshot: JSON.stringify(parsedVersions),
        resultSnapshot: JSON.stringify(result),
        engineVersion: result.meta.engineVersion,
        policyVersion: result.meta.policyVersion,
        benchmarkDatasetVersion: result.meta.benchmarkDatasetVersion,
      },
    });

    logger.info("compatibility_evaluation_completed", {
      publicId,
      score: result.score,
      compatibilityStatus: result.compatibilityStatus,
      primaryBottleneck: result.primaryBottleneck?.component ?? result.bottlenecks[0]?.component,
    });

    return NextResponse.json({
      publicId,
      result,
    });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      logger.warn("compatibility_evaluation_validation_error", { errors: (error as any).errors });
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Validation failed for compatibility evaluation payload",
          },
        },
        { status: 400 }
      );
    }

    logger.error("compatibility_evaluation_failed", error);
    errors.captureException(error, {
      tags: { route: "/api/compatibility/evaluate" },
    });

    return NextResponse.json(
      {
        error: {
          code: "EVALUATION_ERROR",
          message: "Internal diagnostic calculation error occurred",
        },
      },
      { status: 500 }
    );
  }
}
