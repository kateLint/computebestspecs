import { CpuArchitecture, OperatingSystemFamily, StorageType, HardwareCapabilities } from "./hardware";

export type SoftwareCategory =
  | "Design"
  | "Video Editing"
  | "3D"
  | "Development"
  | "IDE"
  | "Virtualization"
  | "Office"
  | "Browser"
  | "Game Development"
  | "Gaming"
  | "Data Science"
  | "AI"
  | "Audio"
  | "CAD"
  | "Engineering"
  | "Streaming"
  | "Productivity"
  | "Other";

export type DataSourceType = "official" | "benchmark" | "vendor" | "manual" | "community" | "fixture";
export type ConfidenceLevel = "high" | "medium" | "low";

export type DataQualityStatus =
  | "VERIFIED"
  | "PARTIAL"
  | "STALE"
  | "CONFLICTING"
  | "INSUFFICIENT"
  | "TEST_DATA_ONLY"
  | "TEST_FIXTURE_ONLY";

export interface DataSource {
  id?: string;
  url?: string;
  publisher?: string;
  title?: string;
  retrievedAt?: string;
  lastVerifiedAt?: string;
  type?: DataSourceType;
  kind?: string;
  confidence?: ConfidenceLevel;
  rawSnapshotText?: string;
  sha256Hash?: string;
}

export interface VerificationRecord {
  id: string;
  verifiedBy: string; // e.g. "admin", "automated-crawler-v1"
  verifiedAt: string;
  status: "VERIFIED" | "REJECTED" | "REQUIRES_REVIEW";
  notes?: string;
  sourceUrl?: string;
}

export interface ResourceVector {
  ramGb?: number;
  cpu?: number;
  cpuLoadPercent?: number; // 0-100
  gpu?: number;
  gpuLoadPercent?: number; // 0-100
  vramGb?: number;
  diskScratchGb?: number;
}

export interface ResourceRange {
  min: number;
  typical: number;
  high: number;
}

export interface CpuRequirement {
  minimumPerformanceScore?: number;
  recommendedPerformanceScore?: number;
  professionalPerformanceScore?: number;
  minimumPhysicalCores?: number;
  minimumCores?: number;
  recommendedPhysicalCores?: number;
  minimumThreads?: number;
  architectures?: CpuArchitecture[];
  requiredCapabilities?: HardwareCapabilities;
}

export interface GpuRequirement {
  minimumPerformanceScore?: number;
  recommendedPerformanceScore?: number;
  professionalPerformanceScore?: number;
  minimumVramGb?: number;
  recommendedVramGb?: number;
  professionalVramGb?: number;
  requiresDedicated?: boolean;
  requiresDedicatedGpu?: boolean;
  requiresCuda?: boolean;
  supportsCuda?: boolean;
  minimumCudaCompute?: string;
  requiresMetal?: boolean;
  supportsMetal?: boolean;
  requiresDirectX12?: boolean;
  supportsDirectX12?: boolean;
  requiresVulkan?: boolean;
  supportsVulkan?: boolean;
  requiredCapabilities?: HardwareCapabilities;
}

export interface StorageRequirement {
  installGb: number;
  recommendedFreeGb?: number;
  preferredStorageType?: StorageType;
  preferredType?: StorageType;
  scratchSpaceGb?: number;
  scratchDiskGb?: number;
  temporaryPeakGb?: number; // Peak space during compile/render/extract
}

export interface OsRequirement {
  family: OperatingSystemFamily;
  minimumVersion?: string;
  supportedArchitectures?: CpuArchitecture[];
}

export interface DependencyRequirement {
  name: string; // e.g. "Hyper-V / Virtualization Platform", "Rosetta 2"
  type: "hypervisor" | "runtime" | "driver" | "api";
  isMandatory: boolean;
  description?: string;
}

export interface SoftwareConflict {
  conflictingSoftwareSlug: string;
  severity: "warning" | "blocking";
  reason: string;
}

export interface HardwareRequirements {
  cpu?: CpuRequirement;
  gpu?: GpuRequirement;
  minimumRamGb: number;
  recommendedRamGb?: number;
  professionalRamGb?: number;
  storage: StorageRequirement;
  operatingSystems: OsRequirement[];
  requiresVirtualization?: boolean;
  architectures?: CpuArchitecture[];
  dependencies?: DependencyRequirement[];
  conflicts?: SoftwareConflict[];
  additionalRequirements?: string[];
}

export type WorkloadIntensity = "light" | "medium" | "heavy" | "professional";

export interface WorkloadProfile {
  id: string;
  softwareVersionId?: string;
  name: string;
  description?: string;
  intensity?: WorkloadIntensity;
  
  // Steady-state vs Peak modeling
  idle?: ResourceVector;
  typical?: ResourceVector;
  peak?: ResourceVector;

  // Legacy/flat compatibility ranges
  estimatedRamGb?: ResourceRange;
  cpuLoad?: number;
  gpuLoad?: number;
  vramGb?: ResourceRange;
  diskWorkingSpaceGb?: ResourceRange;

  workloadConcurrencyFactor?: number; // e.g. 0.3 for background music/browser vs 1.0 for background render
  usesVirtualization?: boolean;
  requiresDedicatedGpu?: boolean;
}

export interface SoftwareVersion {
  id: string;
  softwareId: string;
  version: string;
  isLatest: boolean;
  releaseDate?: string;
  releaseYear?: number;
  dataQuality?: DataQualityStatus;
  supportedOperatingSystems: OsRequirement[];
  minimumRequirements: HardwareRequirements;
  recommendedRequirements?: HardwareRequirements;
  professionalRequirements?: HardwareRequirements;
  workloads: WorkloadProfile[];
  sourceRecords: DataSource[];
  verificationRecords?: VerificationRecord[];
}

export interface Software {
  id: string;
  slug: string;
  name: string;
  vendor?: string;
  developer?: string;
  category: SoftwareCategory;
  description?: string;
  iconUrl?: string;
  aliases: string[];
  versions?: SoftwareVersion[];
  isVerified?: boolean;
}

export type ConcurrencyLevel = "foreground" | "background" | "occasional";

export interface SelectedWorkload {
  softwareId: string;
  softwareName: string;
  softwareVersionId: string;
  versionString?: string;
  workloadId: string;
  workloadName: string;
  intensity: WorkloadIntensity;
  concurrency: ConcurrencyLevel;
  quantity?: number;
}
