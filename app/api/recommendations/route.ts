import { NextRequest, NextResponse } from "next/server";
import { RecommendationRequestSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import { recommendHardware } from "@/services/recommendations/recommendation-engine";
import { SoftwareVersion } from "@/lib/domain/software";
import { dbVersionToDomain } from "@/lib/data/catalog-helper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RecommendationRequestSchema.parse(body);

    const softwareIds = validated.workloads.map(w => w.softwareId);
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
          console.error("Error parsing version", e);
        }
      }
    }

    const recommendation = recommendHardware(
      validated.workloads as any,
      parsedVersions,
      validated.preferences as any,
      validated.simultaneousUse
    );

    return NextResponse.json({
      recommendation,
    });
  } catch (error) {
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Validation failed for recommendation payload",
            details: (error as any).errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "RECOMMENDATION_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate recommendation",
        },
      },
      { status: 500 }
    );
  }
}
