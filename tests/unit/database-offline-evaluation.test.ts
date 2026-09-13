import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { OfflineEvaluationRepository } from "../../lib/db/offline-evaluation-repository";
import { importBlenderOpenDataSnapshot, RawBlenderBenchmarkRecord } from "../../lib/ingestion/blender-open-data-importer";
import { DEV_LAPTOP_16GB_FIXTURE, RTX_4090_WORKSTATION_FIXTURE } from "../fixtures";

const prisma = new PrismaClient();

describe("Database-Backed Offline Evaluation & Benchmark Ingestion", () => {
  const repo = new OfflineEvaluationRepository(prisma);

  beforeAll(async () => {
    // Ensure connection is ready
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("1. Pure Offline DB-Driven Evaluation", () => {
    it("fetches requirements from DB and evaluates 16GB laptop running Photoshop + Android Studio", async () => {
      const stored = await repo.evaluateOffline({
        hardware: DEV_LAPTOP_16GB_FIXTURE,
        workloadRequests: [
          { softwareSlug: "photoshop", intensity: "medium", concurrency: "foreground" },
          { softwareSlug: "android-studio", intensity: "medium", concurrency: "foreground" },
        ],
      });

      expect(stored.publicId).toBeDefined();
      expect(stored.fingerprint.startsWith("ev_")).toBe(true);
      expect(stored.result.compatibilityStatus).toBe("compatible");
      expect(stored.result.primaryBottleneck?.component).toBe("memory");
      expect(stored.result.upgradeRecommendations[0]?.to).toBe("32 GB");

      // Verify snapshot was saved in database
      const dbSnapshot = await prisma.evaluationSnapshot.findUnique({
        where: { publicId: stored.publicId },
      });

      expect(dbSnapshot).toBeDefined();
      expect(dbSnapshot?.evaluationFingerprint).toBe(stored.fingerprint);
    });

    it("evaluates RTX 4090 Workstation running DaVinci Resolve strictly from database records", async () => {
      const stored = await repo.evaluateOffline({
        hardware: RTX_4090_WORKSTATION_FIXTURE,
        workloadRequests: [
          { softwareSlug: "davinci-resolve", intensity: "heavy", concurrency: "foreground" },
        ],
      });

      expect(stored.result.compatibilityStatus).toBe("compatible");
      expect(stored.result.performanceTier).toBe("excellent");
      expect(stored.result.score).toBeGreaterThanOrEqual(90);
    });
  });

  describe("2. Blender Open Data Ingestion Pipeline", () => {
    it("imports raw daily snapshot, normalizes hardware, and computes aggregates", async () => {
      const mockBlenderRecords: RawBlenderBenchmarkRecord[] = [
        {
          device_name: "NVIDIA GeForce RTX 4090",
          device_type: "OPTIX",
          scene: "monster",
          blender_version: "4.2.0",
          samples_per_minute: 12850.5,
          os: "Windows",
        },
        {
          device_name: "GeForce RTX 4090",
          device_type: "OPTIX",
          scene: "junkshop",
          blender_version: "4.2.0",
          samples_per_minute: 12400.0,
          os: "Windows",
        },
        {
          device_name: "Apple M3 Pro",
          device_type: "METAL",
          scene: "classroom",
          blender_version: "4.2.0",
          samples_per_minute: 4200.0,
          os: "macOS",
        },
      ];

      const summary = await importBlenderOpenDataSnapshot(
        prisma,
        mockBlenderRecords,
        "blender-test-snapshot-2026",
        new Date("2026-09-10")
      );

      expect(summary.totalRecordsProcessed).toBe(3);
      expect(summary.matchedComponents).toBe(3);
      expect(summary.aggregatesUpdated).toBeGreaterThanOrEqual(2);

      // Verify aggregate persisted
      const rtx4090 = await prisma.hardwareComponent.findUnique({
        where: { canonicalModel: "NVIDIA GeForce RTX 4090" },
      });

      const aggregate = await prisma.hardwareBenchmarkAggregate.findUnique({
        where: {
          hardwareComponentId_benchmarkType: {
            hardwareComponentId: rtx4090!.id,
            benchmarkType: "BLENDER_CYCLES_GPU",
          },
        },
      });

      expect(aggregate).toBeDefined();
      expect(aggregate?.aggregateScore).toBeGreaterThan(12000);
    });
  });
});
