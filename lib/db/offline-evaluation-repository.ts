import { PrismaClient } from "@prisma/client";
import { HardwareProfile } from "../domain/hardware";
import { SelectedWorkload, SoftwareVersion } from "../domain/software";
import { evaluateCompatibility } from "../engine/evaluate";
import { CompatibilityResult, ScenarioMode } from "../domain/compatibility";
import { nanoid } from "nanoid";

export interface DatabaseEvaluationRequest {
  hardware: HardwareProfile;
  workloadRequests: {
    softwareSlug: string;
    version?: string;
    workloadName?: string;
    intensity?: "light" | "medium" | "heavy" | "professional";
    concurrency?: "foreground" | "background" | "occasional";
  }[];
  scenarioMode?: ScenarioMode;
}

export interface StoredEvaluationResult {
  publicId: string;
  fingerprint: string;
  result: CompatibilityResult;
  evaluatedAt: string;
}

export class OfflineEvaluationRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Evaluate compatibility completely offline using local canonical PostgreSQL / SQLite dataset
   */
  public async evaluateOffline(request: DatabaseEvaluationRequest): Promise<StoredEvaluationResult> {
    const selectedWorkloads: SelectedWorkload[] = [];
    const softwareVersions: SoftwareVersion[] = [];

    // 1. Fetch requirements and workloads strictly from the local database
    for (const req of request.workloadRequests) {
      const software = await this.prisma.software.findUnique({
        where: { slug: req.softwareSlug },
        include: {
          versions: {
            include: {
              requirementProfiles: { include: { rules: true } },
              workloads: true,
              revisions: true,
            },
          },
        },
      });

      if (!software || software.versions.length === 0) continue;

      const versionRecord = req.version
        ? software.versions.find(v => v.version === req.version) || software.versions[0]
        : software.versions.find(v => v.isLatest) || software.versions[0];

      if (!versionRecord) continue;

      const minProfile = versionRecord.requirementProfiles.find(p => p.tier === "MINIMUM") || versionRecord.requirementProfiles[0];
      const recProfile = versionRecord.requirementProfiles.find(p => p.tier === "RECOMMENDED");

      // Assemble domain SoftwareVersion
      const domainVersion: SoftwareVersion = {
        id: versionRecord.id,
        softwareId: software.slug,
        version: versionRecord.version,
        isLatest: versionRecord.isLatest,
        releaseYear: versionRecord.releaseYear ?? undefined,
        dataQuality: versionRecord.dataQuality as any,
        supportedOperatingSystems: JSON.parse(versionRecord.supportedOperatingSystems || "[]"),
        minimumRequirements: {
          minimumRamGb: minProfile?.minRamGb ?? 8,
          recommendedRamGb: recProfile?.recommendedRamGb ?? (minProfile?.minRamGb ? minProfile.minRamGb * 2 : 16),
          storage: {
            installGb: minProfile?.installStorageGb ?? 10,
            scratchDiskGb: minProfile?.scratchStorageGb ?? 0,
            preferredType: (minProfile?.preferredStorageType as any) || "NVME_SSD",
          },
          cpu: {
            minimumPerformanceScore: minProfile?.minCpuScore ?? 40,
            minimumPhysicalCores: minProfile?.minCpuCores ?? 4,
          },
          gpu: {
            requiresDedicated: minProfile?.requiresDedicatedGpu ?? false,
            minimumVramGb: minProfile?.minVramGb ?? 0,
            supportsCuda: minProfile?.rules.some(r => r.capability === "CUDA") ?? false,
            supportsMetal: minProfile?.rules.some(r => r.capability === "METAL") ?? false,
            supportsDirectX12: minProfile?.rules.some(r => r.capability === "DIRECTX_12") ?? false,
            supportsVulkan: minProfile?.rules.some(r => r.capability === "VULKAN") ?? false,
          },
          requiresVirtualization: minProfile?.requiresVirtualization ?? false,
          operatingSystems: JSON.parse(versionRecord.supportedOperatingSystems || "[]"),
        },
        workloads: versionRecord.workloads.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description ?? undefined,
          intensity: (w.intensity as any) || "medium",
          typical: { ramGb: w.typicalRamGb, cpu: w.typicalCpuPercent, gpu: w.typicalGpuPercent, vramGb: w.typicalVramGb ?? 1.0 },
          peak: { ramGb: w.peakRamGb, cpu: w.peakCpuPercent, gpu: w.peakGpuPercent, vramGb: w.peakVramGb ?? 2.0 },
          diskScratchGb: w.diskScratchGb ?? 10,
          usesVirtualization: w.usesVirtualization,
        })),
        sourceRecords: [],
      };

      softwareVersions.push(domainVersion);

      const targetWorkload = req.workloadName
        ? versionRecord.workloads.find(w => w.name.toLowerCase().includes(req.workloadName!.toLowerCase())) || versionRecord.workloads[0]
        : versionRecord.workloads[0];

      selectedWorkloads.push({
        softwareId: software.slug,
        softwareName: software.name,
        softwareVersionId: versionRecord.id,
        versionString: versionRecord.version,
        workloadId: targetWorkload?.id || "default_wl",
        workloadName: targetWorkload?.name || "Default Workload",
        intensity: req.intensity || (targetWorkload?.intensity as any) || "medium",
        concurrency: req.concurrency || "foreground",
      });
    }

    // 2. Run pure deterministic compatibility evaluation with zero external dependencies
    const result = evaluateCompatibility({
      hardware: request.hardware,
      workloads: selectedWorkloads,
      softwareVersions,
      scenarioMode: request.scenarioMode || "TYPICAL",
    });

    const publicId = `cbs_${nanoid(10)}`;

    // 3. Persist evaluation snapshot for auditability and permalinks
    await this.prisma.evaluationSnapshot.create({
      data: {
        publicId,
        evaluationFingerprint: result.meta.evaluationFingerprint,
        inputSnapshot: JSON.stringify({ hardware: request.hardware, workloads: selectedWorkloads, scenarioMode: request.scenarioMode }),
        requirementsSnapshot: JSON.stringify(softwareVersions),
        resultSnapshot: JSON.stringify(result),
        engineVersion: result.meta.engineVersion,
        policyVersion: result.meta.policyVersion,
        benchmarkDatasetVersion: result.meta.benchmarkDatasetVersion,
      },
    });

    return {
      publicId,
      fingerprint: result.meta.evaluationFingerprint,
      result,
      evaluatedAt: result.meta.evaluatedAt,
    };
  }
}
