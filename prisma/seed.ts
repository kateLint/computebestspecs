import { PrismaClient } from "@prisma/client";
import { CANONICAL_SOFTWARE_CATALOG } from "../lib/data/software-catalog";
import { CANONICAL_CPUS, CANONICAL_GPUS } from "../lib/data/hardware-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ComputeBestSpecs Canonical Database...");

  // 1. Seed Provenance Sources
  const adobeSource = await prisma.source.create({
    data: {
      provider: "Adobe Systems",
      sourceType: "official_docs",
      url: "https://helpx.adobe.com/photoshop/system-requirements.html",
      official: true,
      license: "Proprietary",
      commercialUseAllowed: true,
      confidence: "HIGH",
      verifiedAt: new Date("2026-01-15"),
    },
  });

  const blenderSource = await prisma.source.create({
    data: {
      provider: "Blender Foundation",
      sourceType: "benchmark_dump",
      url: "https://opendata.blender.org",
      official: true,
      license: "CC0",
      commercialUseAllowed: true,
      confidence: "HIGH",
      verifiedAt: new Date("2026-02-10"),
    },
  });

  const googleSource = await prisma.source.create({
    data: {
      provider: "Google Developers",
      sourceType: "official_docs",
      url: "https://developer.android.com/studio",
      official: true,
      license: "Apache 2.0 / Proprietary",
      commercialUseAllowed: true,
      confidence: "HIGH",
      verifiedAt: new Date("2026-01-20"),
    },
  });

  console.log("✓ Provenance sources seeded");

  // 2. Seed Hardware Components (CPUs & GPUs)
  for (const cpu of CANONICAL_CPUS) {
    const createdCpu = await prisma.hardwareComponent.create({
      data: {
        type: "CPU",
        manufacturer: cpu.manufacturer,
        canonicalModel: cpu.model,
        architecture: cpu.architecture,
        physicalCores: cpu.physicalCores,
        threads: cpu.threads,
        performanceScore: cpu.performanceScore,
        singleCoreScore: cpu.singleCoreScore,
        multiCoreScore: cpu.multiCoreScore,
        generation: cpu.generation,
        releaseYear: cpu.releaseYear,
        laptopVariant: cpu.laptopVariant ?? false,
        isVerified: cpu.isVerified ?? true,
        verifiedAt: new Date("2026-01-01"),
      },
    });

    // Seed Aliases
    for (const alias of cpu.aliases) {
      await prisma.hardwareAlias.create({
        data: {
          hardwareComponentId: createdCpu.id,
          aliasName: alias,
          source: "canonical_seed",
        },
      });
    }

    // Seed Capabilities
    if (cpu.capabilities?.avx2) {
      await prisma.hardwareCapability.create({
        data: { hardwareComponentId: createdCpu.id, capabilityName: "AVX2", capabilityValue: true },
      });
    }
    if (cpu.capabilities?.virtualization) {
      await prisma.hardwareCapability.create({
        data: { hardwareComponentId: createdCpu.id, capabilityName: "VIRTUALIZATION", capabilityValue: true },
      });
    }
  }

  for (const gpu of CANONICAL_GPUS) {
    const createdGpu = await prisma.hardwareComponent.create({
      data: {
        type: "GPU",
        manufacturer: gpu.manufacturer,
        canonicalModel: gpu.model,
        architecture: "x86_64",
        performanceScore: gpu.performanceScore,
        vramGb: gpu.vramGb ?? 0,
        laptopVariant: gpu.laptopVariant ?? false,
        isVerified: gpu.isVerified ?? true,
        verifiedAt: new Date("2026-01-01"),
      },
    });

    for (const alias of gpu.aliases) {
      await prisma.hardwareAlias.create({
        data: {
          hardwareComponentId: createdGpu.id,
          aliasName: alias,
          source: "canonical_seed",
        },
      });
    }

    if (gpu.supportsCuda) {
      await prisma.hardwareCapability.create({
        data: { hardwareComponentId: createdGpu.id, capabilityName: "CUDA", capabilityValue: true, minimumVersion: gpu.capabilities?.cudaComputeCapability || "8.6" },
      });
    }
    if (gpu.supportsMetal) {
      await prisma.hardwareCapability.create({
        data: { hardwareComponentId: createdGpu.id, capabilityName: "METAL", capabilityValue: true, minimumVersion: "Metal 3" },
      });
    }
    if (gpu.supportsDirectX12) {
      await prisma.hardwareCapability.create({
        data: { hardwareComponentId: createdGpu.id, capabilityName: "DIRECTX_12", capabilityValue: true },
      });
    }
  }

  console.log(`✓ Seeded ${CANONICAL_CPUS.length} CPUs and ${CANONICAL_GPUS.length} GPUs`);

  // 3. Seed Software & Requirement Profiles
  for (const entry of CANONICAL_SOFTWARE_CATALOG) {
    const sw = await prisma.software.create({
      data: {
        slug: entry.software.slug,
        name: entry.software.name,
        vendor: entry.software.developer || entry.software.vendor || "Vendor",
        category: entry.software.category,
        description: entry.software.description,
        iconUrl: entry.software.iconUrl,
        aliases: JSON.stringify(entry.software.aliases),
      },
    });

    for (const version of entry.versions) {
      const swVer = await prisma.softwareVersion.create({
        data: {
          softwareId: sw.id,
          version: version.version,
          isLatest: version.isLatest,
          releaseYear: version.releaseYear,
          dataQuality: version.dataQuality || "VERIFIED",
          supportedOperatingSystems: JSON.stringify(version.supportedOperatingSystems),
        },
      });

      // Seed Minimum Requirement Profile
      const minReq = version.minimumRequirements;
      await prisma.requirementProfile.create({
        data: {
          softwareVersionId: swVer.id,
          tier: "MINIMUM",
          osFamily: "all",
          minRamGb: minReq.minimumRamGb,
          recommendedRamGb: version.recommendedRequirements?.recommendedRamGb ?? (minReq.minimumRamGb * 2),
          installStorageGb: minReq.storage.installGb,
          scratchStorageGb: minReq.storage.scratchDiskGb ?? minReq.storage.scratchSpaceGb ?? 0,
          requiresDedicatedGpu: minReq.gpu?.requiresDedicatedGpu ?? minReq.gpu?.requiresDedicated ?? false,
          minVramGb: minReq.gpu?.minimumVramGb ?? 0,
          requiresVirtualization: minReq.requiresVirtualization ?? false,
          minCpuScore: minReq.cpu?.minimumPerformanceScore ?? 40,
        },
      });

      // Seed Workload Profiles
      for (const wl of version.workloads) {
        await prisma.workloadProfile.create({
          data: {
            softwareVersionId: swVer.id,
            name: wl.name,
            description: wl.description,
            intensity: wl.intensity || "medium",
            typicalRamGb: wl.typical?.ramGb ?? 4.0,
            peakRamGb: wl.peak?.ramGb ?? 8.0,
            typicalCpuPercent: wl.typical?.cpu ?? 30,
            peakCpuPercent: wl.peak?.cpu ?? 75,
            typicalGpuPercent: wl.typical?.gpu ?? 20,
            peakGpuPercent: wl.peak?.gpu ?? 50,
            typicalVramGb: wl.typical?.vramGb ?? 1.0,
            peakVramGb: wl.peak?.vramGb ?? 2.0,
            diskScratchGb: (wl as any).diskScratchGb ?? wl.typical?.diskScratchGb ?? 10.0,
            usesVirtualization: wl.usesVirtualization ?? false,
          },
        });
      }
    }
  }

  console.log(`✓ Seeded ${CANONICAL_SOFTWARE_CATALOG.length} verified software products`);

  // 4. Seed Blender Open Data Benchmark Dataset
  const blenderDataset = await prisma.benchmarkDataset.create({
    data: {
      name: "Blender Open Data Cycles Benchmark",
      version: "blender-2026-09-10",
      sourceId: blenderSource.id,
      snapshotDate: new Date("2026-09-10"),
      recordCount: 1500,
      checksum: "sha256_blender_open_data_sample_hash",
    },
  });

  const rtx4090 = await prisma.hardwareComponent.findUnique({ where: { canonicalModel: "NVIDIA GeForce RTX 4090" } });
  if (rtx4090) {
    await prisma.benchmarkObservation.create({
      data: {
        benchmarkDatasetId: blenderDataset.id,
        hardwareComponentId: rtx4090.id,
        hardwareRawName: "NVIDIA GeForce RTX 4090",
        benchmarkType: "BLENDER_CYCLES_GPU",
        benchmarkScene: "monster",
        scoreValue: 12580.4,
        normalizedScore: 99,
        sampleCount: 840,
        osFamily: "windows",
      },
    });

    await prisma.hardwareBenchmarkAggregate.create({
      data: {
        hardwareComponentId: rtx4090.id,
        benchmarkType: "BLENDER_CYCLES_GPU",
        aggregateScore: 12580.4,
        minScore: 11950.0,
        maxScore: 13100.0,
        sampleCount: 840,
        confidenceLevel: "HIGH",
      },
    });
  }

  console.log("✓ Blender Open Data benchmark dataset & observation aggregates seeded");
  console.log("✨ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
