export type CpuManufacturer = "Intel" | "AMD" | "Apple" | "Qualcomm" | "Other";
export type CpuArchitecture = "x86_64" | "arm64" | "other";

export interface HardwareCapabilities {
  avx2?: boolean;
  avx512?: boolean;
  virtualization?: boolean;
  cudaComputeCapability?: string; // e.g. "8.6", "8.9"
  rayTracing?: boolean;
  tensorCores?: boolean;
  metalFeatureSet?: string; // e.g. "Metal 3"
  directXFeatureLevel?: string; // e.g. "12_2"
  hardwareVideoEncode?: string[]; // e.g. ["H.264", "HEVC", "AV1", "ProRes"]
  hardwareVideoDecode?: string[]; // e.g. ["H.264", "HEVC", "AV1", "ProRes", "VP9"]
}

export interface PowerProfile {
  minWatts?: number;
  maxWatts?: number;
  knownTgpWatts?: number; // e.g., for laptop GPUs (45W vs 140W)
}

export interface CanonicalCpuIdentity {
  vendor: CpuManufacturer;
  family: string; // e.g. "Ryzen 5", "Core i7", "M3"
  model: string; // e.g. "5600", "13700"
  suffix?: string; // e.g. "H", "K", "HX", "U", "Pro", "Max"
  powerClass?: "ultra-low" | "standard-laptop" | "high-performance-laptop" | "desktop" | "workstation";
}

export interface Cpu {
  id: string;
  manufacturer: CpuManufacturer;
  model: string;
  architecture: CpuArchitecture;
  canonicalIdentity?: CanonicalCpuIdentity;
  physicalCores?: number;
  threads?: number;
  performanceScore?: number; // Normalized score 0-100
  singleCoreScore?: number;
  multiCoreScore?: number;
  generation?: string;
  releaseYear?: number;
  integratedGraphics?: boolean;
  laptopVariant?: boolean;
  powerProfile?: PowerProfile;
  capabilities?: HardwareCapabilities;
  aliases: string[];
  isVerified?: boolean;
}

export type GpuManufacturer = "NVIDIA" | "AMD" | "Intel" | "Apple" | "Qualcomm" | "Other";
export type GpuType = "integrated" | "dedicated" | "unified";

export interface Gpu {
  id: string;
  manufacturer: GpuManufacturer;
  model: string;
  type: GpuType;
  performanceScore?: number; // Normalized score 0-100
  vramGb?: number;
  supportsCuda?: boolean;
  supportsMetal?: boolean;
  supportsVulkan?: boolean;
  supportsDirectX12?: boolean;
  laptopVariant?: boolean;
  powerProfile?: PowerProfile;
  capabilities?: HardwareCapabilities;
  aliases: string[];
  isVerified?: boolean;
}

export type MemoryType =
  | "DDR4"
  | "DDR5"
  | "LPDDR4X"
  | "LPDDR5"
  | "LPDDR5X"
  | "Unified"
  | "Other";

export type MemoryTopology =
  | "DISCRETE"
  | "SHARED_IGPU"
  | "UNIFIED_MEMORY";

export interface MemoryArchitecture {
  topology: MemoryTopology;
  systemMemoryGb: number;
  dedicatedVramGb?: number;
  sharedGpuMemoryGb?: number;
  memoryBandwidthGBps?: number;
}

export interface MemoryConfiguration {
  totalGb: number;
  type?: MemoryType;
  topology?: MemoryTopology;
  channels?: number;
  speedMts?: number;
  soldered?: boolean;
  upgradeable?: boolean;
  memoryBandwidthGBps?: number;
}

export type StorageType = "HDD" | "SATA_SSD" | "NVME_SSD" | "UNKNOWN";

export interface StorageDevice {
  type: StorageType;
  totalGb: number;
  freeGb?: number;
  isSystemDrive?: boolean;
}

export type OperatingSystemFamily = "windows" | "macos" | "linux";

export interface OperatingSystem {
  family: OperatingSystemFamily;
  version?: string;
  build?: string;
  architecture: CpuArchitecture;
}

export type DeviceType = "desktop" | "laptop" | "mini-pc" | "workstation";

export interface CpuSelection {
  catalogCpuId?: string;
  model: string;
  manufacturer?: CpuManufacturer;
  architecture: CpuArchitecture;
  physicalCores?: number;
  threads?: number;
  performanceScore?: number;
  laptopVariant?: boolean;
  powerProfile?: PowerProfile;
  capabilities?: HardwareCapabilities;
  isVerified?: boolean;
}

export interface GpuSelection {
  catalogGpuId?: string;
  model: string;
  manufacturer?: GpuManufacturer;
  type: GpuType;
  performanceScore?: number;
  vramGb?: number;
  supportsCuda?: boolean;
  supportsMetal?: boolean;
  supportsVulkan?: boolean;
  supportsDirectX12?: boolean;
  laptopVariant?: boolean;
  powerProfile?: PowerProfile;
  capabilities?: HardwareCapabilities;
  isVerified?: boolean;
}

export interface HardwareUpgradeFeasibility {
  isRamUpgradeable?: boolean;
  isGpuUpgradeable?: boolean;
  isStorageUpgradeable?: boolean;
  maxSupportedRamGb?: number;
  ramSlotsTotal?: number;
  ramSlotsFree?: number;
  notes?: string[];
}

export interface HardwareProfile {
  cpu: CpuSelection;
  gpu?: GpuSelection;
  ram: MemoryConfiguration;
  storage: StorageDevice[];
  os: OperatingSystem;
  architecture: CpuArchitecture;
  deviceType: DeviceType;
  supportsVirtualization?: boolean;
  isVirtualizationEnabled?: boolean;
  upgradeFeasibility?: HardwareUpgradeFeasibility;
}
