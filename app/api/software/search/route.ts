import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { matchAlias } from "@/lib/normalization/normalizers";
import { profileToHardwareRequirements } from "@/lib/data/catalog-helper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const limit = Math.min(30, parseInt(searchParams.get("limit") || "20", 10));

    const allSoftware = await prisma.software.findMany({
      where: category ? { category } : undefined,
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

    const filtered = allSoftware
      .filter(sw => {
        if (!query) return true;
        let aliases: string[] = [];
        try {
          aliases = JSON.parse(sw.aliases);
        } catch {
          aliases = [];
        }
        return matchAlias(query, sw.name, aliases) || sw.vendor.toLowerCase().includes(query.toLowerCase());
      })
      .slice(0, limit)
      .map(sw => {
        return {
          id: sw.id,
          slug: sw.slug,
          name: sw.name,
          vendor: sw.vendor,
          category: sw.category,
          description: sw.description,
          versions: sw.versions.map(v => {
            let supportedOperatingSystems = [];
            try {
              supportedOperatingSystems = JSON.parse(v.supportedOperatingSystems);
            } catch {}

            const minProfile = v.requirementProfiles.find(p => p.tier === "MINIMUM") || v.requirementProfiles[0];
            const recProfile = v.requirementProfiles.find(p => p.tier === "RECOMMENDED");

            const minimumRequirements = minProfile ? profileToHardwareRequirements(minProfile, v.supportedOperatingSystems) : undefined;
            const recommendedRequirements = recProfile ? profileToHardwareRequirements(recProfile, v.supportedOperatingSystems) : undefined;

            return {
              id: v.id,
              softwareId: sw.slug,
              version: v.version,
              isLatest: v.isLatest,
              supportedOperatingSystems,
              minimumRequirements,
              recommendedRequirements,
              workloads: v.workloads.map(w => ({
                id: w.id,
                name: w.name,
                intensity: w.intensity,
                estimatedRamGb: {
                  min: w.typicalRamGb * 0.75,
                  typical: w.typicalRamGb,
                  high: w.peakRamGb,
                },
                cpuLoad: w.typicalCpuPercent,
                gpuLoad: w.typicalGpuPercent,
                vramGb: {
                  min: (w.typicalVramGb || 1) * 0.75,
                  typical: w.typicalVramGb || 1,
                  high: w.peakVramGb || 2,
                },
                diskWorkingSpaceGb: {
                  min: 5,
                  typical: w.diskScratchGb || 10,
                  high: (w.diskScratchGb || 10) * 2,
                },
                usesVirtualization: w.usesVirtualization,
                requiresDedicatedGpu: (w.typicalVramGb || 0) > 2,
              })),
              sourceRecords: v.revisions.map(r => ({
                sourceId: r.sourceId,
                revisionNumber: r.revisionNumber,
                publishedAt: r.publishedAt,
              })),
            };
          }),
        };
      });

    return NextResponse.json({
      query,
      results: filtered,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to query software catalog", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
