import { prisma } from "@/lib/db/prisma";
import { SoftwareCatalogView, CatalogSoftwareItem } from "@/components/SoftwareCatalogView";
import { HardwareRequirements } from "@/lib/domain/software";
import { profileToHardwareRequirements } from "@/lib/data/catalog-helper";
import { CANONICAL_SOFTWARE_CATALOG } from "@/lib/data/software-catalog";

export const metadata = {
  title: "Verified Software Requirements & Compatibility Catalog — ComputeBestSpecs",
  description:
    "Explore official vendor requirements, platform support matrices, real-world workload profiles, and verified evidence behind our deterministic hardware sizing engine.",
};

export default async function SoftwareCatalogPage() {
  let rawSoftwareList: any[] = [];
  try {
    rawSoftwareList = await prisma.software.findMany({
      where: { isPublished: true },
      include: {
        versions: {
          orderBy: [
            { isLatest: "desc" },
            { releaseDate: "desc" },
            { createdAt: "desc" },
          ],
          take: 1,
          include: {
            requirementProfiles: {
              include: {
                rules: true,
              },
            },
            workloads: {
              orderBy: { createdAt: "asc" },
            },
            revisions: {
              orderBy: { publishedAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("Prisma software fetch fallback", err);
  }

  const dbCatalogItems: CatalogSoftwareItem[] = rawSoftwareList.map((sw) => {
    const latestVer = sw.versions[0];
    let minReqs: HardwareRequirements | null = null;
    let recReqs: HardwareRequirements | null = null;

    if (latestVer) {
      const minProfile = latestVer.requirementProfiles.find((p: any) => p.tier === "MINIMUM") || latestVer.requirementProfiles[0];
      const recProfile = latestVer.requirementProfiles.find((p: any) => p.tier === "RECOMMENDED");

      if (minProfile) {
        minReqs = profileToHardwareRequirements(minProfile, latestVer.supportedOperatingSystems);
      }
      if (recProfile) {
        recReqs = profileToHardwareRequirements(recProfile, latestVer.supportedOperatingSystems);
      }
    }

    // Parse OS support
    let supportedPlatforms = {
      windows: true,
      macos: false,
      linux: false,
    };

    if (latestVer?.supportedOperatingSystems) {
      try {
        const osList = JSON.parse(latestVer.supportedOperatingSystems);
        if (Array.isArray(osList)) {
          supportedPlatforms = {
            windows: osList.some((os: any) => os.family === "windows"),
            macos: osList.some((os: any) => os.family === "macos"),
            linux: osList.some((os: any) => os.family === "linux"),
          };
        }
      } catch {}
    }

    const primarySource = {
      type: "official_docs",
      publisher: sw.vendor,
      title: `${sw.name} Official Hardware Requirements`,
      url: null,
      lastVerifiedAt: latestVer?.updatedAt ? latestVer.updatedAt.toISOString() : null,
      retrievedAt: latestVer?.createdAt ? latestVer.createdAt.toISOString() : null,
    };

    return {
      id: sw.id,
      slug: sw.slug,
      name: sw.name,
      vendor: sw.vendor,
      category: sw.category,
      description: sw.description,
      latestVersion: latestVer?.version || "Latest",
      dataQuality: latestVer?.dataQuality || "VERIFIED",
      minimumRequirements: minReqs,
      recommendedRequirements: recReqs,
      workloads: (latestVer?.workloads || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        intensity: w.intensity,
        estimatedRamTypical: w.typicalRamGb,
      })),
      primarySource,
      supportedPlatforms,
    };
  });

  const canonicalItems: CatalogSoftwareItem[] = CANONICAL_SOFTWARE_CATALOG.map((entry) => {
    const sw = entry.software;
    const latestVer = entry.versions.find((v) => v.isLatest) || entry.versions[0];
    const supportedOs = latestVer?.supportedOperatingSystems || [];

    return {
      id: sw.id,
      slug: sw.slug || sw.id,
      name: sw.name,
      vendor: sw.developer || "Vendor",
      category: sw.category,
      description: sw.description,
      latestVersion: latestVer?.version || "Latest",
      dataQuality: latestVer?.dataQuality || "VERIFIED",
      minimumRequirements: latestVer?.minimumRequirements || null,
      recommendedRequirements: latestVer?.minimumRequirements
        ? {
            ...latestVer.minimumRequirements,
            minimumRamGb: latestVer.minimumRequirements.recommendedRamGb || (latestVer.minimumRequirements.minimumRamGb ? latestVer.minimumRequirements.minimumRamGb * 2 : 16),
          }
        : null,
      workloads: (latestVer?.workloads || []).map((w) => ({
        id: w.id,
        name: w.name,
        intensity: "medium",
        estimatedRamTypical: w.typical?.ramGb || 8,
      })),
      primarySource: latestVer?.sourceRecords?.[0]
        ? {
            type: "official",
            publisher: latestVer.sourceRecords[0].publisher,
            title: `${sw.name} Official Hardware Requirements`,
            url: latestVer.sourceRecords[0].url,
            lastVerifiedAt: latestVer.sourceRecords[0].retrievedAt,
            retrievedAt: latestVer.sourceRecords[0].retrievedAt,
          }
        : null,
      supportedPlatforms: {
        windows: supportedOs.some((os) => os.family === "windows"),
        macos: supportedOs.some((os) => os.family === "macos"),
        linux: supportedOs.some((os) => os.family === "linux"),
      },
    };
  });

  // Merge items without duplicates
  const seenSlugs = new Set<string>();
  const combinedSoftware: CatalogSoftwareItem[] = [];

  for (const item of [...dbCatalogItems, ...canonicalItems]) {
    if (!seenSlugs.has(item.slug)) {
      seenSlugs.add(item.slug);
      combinedSoftware.push(item);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <SoftwareCatalogView initialSoftware={combinedSoftware} />
    </div>
  );
}
