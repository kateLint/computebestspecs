import { HardwareRequirements, SoftwareVersion, CpuRequirement, GpuRequirement, StorageRequirement, OsRequirement } from "../domain/software";
import { CpuArchitecture, OperatingSystemFamily, StorageType } from "../domain/hardware";

export function profileToHardwareRequirements(profile: any, allOsJson?: string): HardwareRequirements {
  let architectures: CpuArchitecture[] = ["x86_64", "arm64"];
  if (profile?.architectures) {
    try {
      architectures = JSON.parse(profile.architectures) as CpuArchitecture[];
    } catch {}
  }

  let operatingSystems: OsRequirement[] = [
    { family: "windows" as OperatingSystemFamily },
    { family: "macos" as OperatingSystemFamily },
  ];
  if (allOsJson) {
    try {
      operatingSystems = JSON.parse(allOsJson);
    } catch {}
  }

  if (!profile) {
    return {
      minimumRamGb: 8,
      recommendedRamGb: 16,
      storage: {
        installGb: 10,
        preferredType: "NVME_SSD" as StorageType,
      },
      operatingSystems,
    };
  }

  const rules: any[] = profile.rules || [];
  const hasCuda = rules.some((r: any) => r.capability === "CUDA");
  const hasMetal = rules.some((r: any) => r.capability === "METAL");
  const hasDx12 = rules.some((r: any) => r.capability === "DIRECTX_12");
  const hasVulkan = rules.some((r: any) => r.capability === "VULKAN");

  const cpu: CpuRequirement = {
    minimumPerformanceScore: profile.minCpuScore ?? 40,
    minimumPhysicalCores: profile.minCpuCores ?? 4,
    architectures,
  };

  const gpu: GpuRequirement = {
    requiresDedicated: profile.requiresDedicatedGpu ?? false,
    minimumPerformanceScore: profile.minGpuScore ?? 30,
    minimumVramGb: profile.minVramGb ?? 0,
    supportsCuda: hasCuda,
    supportsMetal: hasMetal,
    supportsDirectX12: hasDx12,
    supportsVulkan: hasVulkan,
  };

  const storage: StorageRequirement = {
    installGb: profile.installStorageGb ?? 10,
    scratchDiskGb: profile.scratchStorageGb ?? 0,
    preferredType: (profile.preferredStorageType as StorageType) || "NVME_SSD",
  };

  return {
    minimumRamGb: profile.minRamGb ?? 8,
    recommendedRamGb: profile.recommendedRamGb ?? (profile.minRamGb ? profile.minRamGb * 2 : 16),
    cpu,
    gpu,
    storage,
    requiresVirtualization: profile.requiresVirtualization ?? false,
    operatingSystems,
    architectures,
  };
}

export function dbVersionToDomain(sw: any, v: any): SoftwareVersion {
  const minProfile = v.requirementProfiles?.find((p: any) => p.tier === "MINIMUM") || v.requirementProfiles?.[0];
  const recProfile = v.requirementProfiles?.find((p: any) => p.tier === "RECOMMENDED");

  return {
    id: v.id,
    softwareId: sw.slug || sw.id,
    version: v.version,
    isLatest: v.isLatest,
    releaseYear: v.releaseYear ?? undefined,
    dataQuality: v.dataQuality as any,
    supportedOperatingSystems: JSON.parse(v.supportedOperatingSystems || "[]"),
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
        supportsCuda: minProfile?.rules?.some((r: any) => r.capability === "CUDA") ?? false,
        supportsMetal: minProfile?.rules?.some((r: any) => r.capability === "METAL") ?? false,
        supportsDirectX12: minProfile?.rules?.some((r: any) => r.capability === "DIRECTX_12") ?? false,
        supportsVulkan: minProfile?.rules?.some((r: any) => r.capability === "VULKAN") ?? false,
      },
      requiresVirtualization: minProfile?.requiresVirtualization ?? false,
      operatingSystems: JSON.parse(v.supportedOperatingSystems || "[]"),
    },
    workloads: (v.workloads || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      description: w.description ?? undefined,
      intensity: (w.intensity as any) || "medium",
      typical: {
        ramGb: w.typicalRamGb ?? 8,
        cpu: w.typicalCpuPercent ?? 30,
        gpu: w.typicalGpuPercent ?? 20,
        vramGb: w.typicalVramGb ?? 1.0,
      },
      peak: {
        ramGb: w.peakRamGb ?? 16,
        cpu: w.peakCpuPercent ?? 60,
        gpu: w.peakGpuPercent ?? 40,
        vramGb: w.peakVramGb ?? 2.0,
      },
      diskScratchGb: w.diskScratchGb ?? 10,
      usesVirtualization: w.usesVirtualization ?? false,
    })),
    sourceRecords: [],
  };
}
