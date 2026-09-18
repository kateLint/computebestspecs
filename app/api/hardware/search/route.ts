import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { matchAlias } from "@/lib/normalization/normalizers";
import { getClientIp, rateLimit, rateLimitResponseHeaders } from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  const rl = rateLimit(`hardware-search:${getClientIp(req)}`, { windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many search requests. Please slow down." },
      { status: 429, headers: rateLimitResponseHeaders(rl) }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // "cpu", "gpu", "all"
    const query = searchParams.get("q") || "";
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));

    let cpus: Array<{ id: string; manufacturer: string; model: string; architecture: string; physicalCores: number | null; performanceScore: number; laptopVariant: boolean; isVerified: boolean }> = [];
    let gpus: Array<{ id: string; manufacturer: string; model: string; type: string; performanceScore: number; vramGb: number; laptopVariant: boolean; isVerified: boolean; capabilities: string[] }> = [];

    if (type === "cpu" || type === "all") {
      const allCpus = await prisma.hardwareComponent.findMany({
        where: { type: "CPU" },
        include: {
          aliases: true,
          capabilities: true,
        },
      });

      cpus = allCpus
        .filter(c => {
          if (!query) return true;
          const aliasList = c.aliases.map(a => a.aliasName);
          return matchAlias(query, c.canonicalModel, aliasList) || c.manufacturer.toLowerCase().includes(query.toLowerCase());
        })
        .slice(0, limit)
        .map(c => ({
          id: c.id,
          manufacturer: c.manufacturer,
          model: c.canonicalModel,
          architecture: c.architecture,
          physicalCores: c.physicalCores,
          performanceScore: c.performanceScore,
          laptopVariant: c.laptopVariant,
          isVerified: c.isVerified,
        }));
    }

    if (type === "gpu" || type === "all") {
      const allGpus = await prisma.hardwareComponent.findMany({
        where: { type: "GPU" },
        include: {
          aliases: true,
          capabilities: true,
        },
      });

      gpus = allGpus
        .filter(g => {
          if (!query) return true;
          const aliasList = g.aliases.map(a => a.aliasName);
          return matchAlias(query, g.canonicalModel, aliasList) || g.manufacturer.toLowerCase().includes(query.toLowerCase());
        })
        .slice(0, limit)
        .map(g => ({
          id: g.id,
          manufacturer: g.manufacturer,
          model: g.canonicalModel,
          type: g.powerClass === "integrated" ? "integrated" : "dedicated",
          performanceScore: g.performanceScore,
          vramGb: g.vramGb || 0,
          laptopVariant: g.laptopVariant,
          isVerified: g.isVerified,
          capabilities: g.capabilities.map(cap => cap.capabilityName),
        }));
    }

    return NextResponse.json({
      query,
      results: {
        cpus,
        gpus,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to query hardware catalog", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
