import { PrismaClient } from "@prisma/client";

export interface RawBlenderBenchmarkRecord {
  device_name: string;
  device_type: "CPU" | "CUDA" | "OPTIX" | "HIP" | "ONEAPI" | "METAL";
  scene: "monster" | "junkshop" | "classroom";
  blender_version: string;
  samples_per_minute: number;
  os: "Windows" | "Linux" | "macOS";
}

export interface BlenderImportSummary {
  datasetVersion: string;
  totalRecordsProcessed: number;
  matchedComponents: number;
  unmatchedRawNames: string[];
  aggregatesUpdated: number;
}

export async function importBlenderOpenDataSnapshot(
  prisma: PrismaClient,
  records: RawBlenderBenchmarkRecord[],
  datasetVersion: string,
  snapshotDate: Date = new Date()
): Promise<BlenderImportSummary> {
  // 1. Ensure or find the Blender Source
  let source = await prisma.source.findFirst({
    where: { provider: "Blender Foundation" },
  });

  if (!source) {
    source = await prisma.source.create({
      data: {
        provider: "Blender Foundation",
        sourceType: "benchmark_dump",
        url: "https://opendata.blender.org",
        official: true,
        license: "CC0",
        commercialUseAllowed: true,
        confidence: "HIGH",
        verifiedAt: new Date(),
      },
    });
  }

  // 2. Register or update the BenchmarkDataset record
  const dataset = await prisma.benchmarkDataset.upsert({
    where: { version: datasetVersion },
    update: {
      snapshotDate,
      recordCount: records.length,
    },
    create: {
      name: "Blender Open Data Cycles Benchmark",
      version: datasetVersion,
      sourceId: source.id,
      snapshotDate,
      recordCount: records.length,
    },
  });

  // 3. Cache Hardware Components and Aliases for fast normalization
  const hardwareComponents = await prisma.hardwareComponent.findMany({
    include: { aliases: true },
  });

  const unmatchedNames = new Set<string>();
  let matchedCount = 0;

  // Group raw observations by hardware component and scene
  const componentScoresMap = new Map<string, number[]>();

  for (const record of records) {
    // Attempt alias match or canonical model match
    const rawLower = record.device_name.toLowerCase().trim();
    const matched = hardwareComponents.find(c => {
      if (c.canonicalModel.toLowerCase() === rawLower) return true;
      return c.aliases.some(a => a.aliasName.toLowerCase() === rawLower || rawLower.includes(a.aliasName.toLowerCase()));
    });

    if (matched) {
      matchedCount++;
      const current = componentScoresMap.get(matched.id) || [];
      current.push(record.samples_per_minute);
      componentScoresMap.set(matched.id, current);

      // Record observation
      await prisma.benchmarkObservation.create({
        data: {
          benchmarkDatasetId: dataset.id,
          hardwareComponentId: matched.id,
          hardwareRawName: record.device_name,
          benchmarkType: record.device_type === "CPU" ? "BLENDER_CYCLES_CPU" : "BLENDER_CYCLES_GPU",
          benchmarkScene: record.scene,
          scoreValue: record.samples_per_minute,
          normalizedScore: Math.min(100, Math.round((record.samples_per_minute / 12000) * 100)),
          sampleCount: 1,
          osFamily: record.os.toLowerCase(),
        },
      });
    } else {
      unmatchedNames.add(record.device_name);
    }
  }

  // 4. Update Aggregates
  let aggregatesUpdated = 0;
  for (const [componentId, scores] of Array.from(componentScoresMap.entries())) {
    if (scores.length === 0) continue;
    
    const sum = scores.reduce((a: number, b: number) => a + b, 0);
    const avg = sum / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    await prisma.hardwareBenchmarkAggregate.upsert({
      where: {
        hardwareComponentId_benchmarkType: {
          hardwareComponentId: componentId,
          benchmarkType: "BLENDER_CYCLES_GPU",
        },
      },
      update: {
        aggregateScore: avg,
        minScore: min,
        maxScore: max,
        sampleCount: scores.length,
        confidenceLevel: scores.length >= 20 ? "HIGH" : scores.length >= 5 ? "MEDIUM" : "LOW",
      },
      create: {
        hardwareComponentId: componentId,
        benchmarkType: "BLENDER_CYCLES_GPU",
        aggregateScore: avg,
        minScore: min,
        maxScore: max,
        sampleCount: scores.length,
        confidenceLevel: scores.length >= 20 ? "HIGH" : scores.length >= 5 ? "MEDIUM" : "LOW",
      },
    });
    aggregatesUpdated++;
  }

  return {
    datasetVersion,
    totalRecordsProcessed: records.length,
    matchedComponents: matchedCount,
    unmatchedRawNames: Array.from(unmatchedNames),
    aggregatesUpdated,
  };
}
