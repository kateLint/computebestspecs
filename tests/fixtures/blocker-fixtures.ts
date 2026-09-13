import { HardwareProfile } from "../../lib/domain/hardware";
import { DEV_LAPTOP_16GB_FIXTURE } from "./dev-laptop-16gb";

export const UNSUPPORTED_OS_FIXTURE: HardwareProfile = {
  ...DEV_LAPTOP_16GB_FIXTURE,
  os: {
    family: "linux",
    version: "Ubuntu 24.04",
    architecture: "x86_64",
  },
};

export const MISSING_CUDA_GPU_FIXTURE: HardwareProfile = {
  ...DEV_LAPTOP_16GB_FIXTURE,
  gpu: {
    model: "Intel Iris Xe Graphics",
    manufacturer: "Intel",
    type: "integrated",
    performanceScore: 32,
    vramGb: 0,
    supportsCuda: false,
    supportsDirectX12: true,
    supportsVulkan: true,
    laptopVariant: true,
    isVerified: true,
  },
};

export const VIRTUALIZATION_DISABLED_FIXTURE: HardwareProfile = {
  ...DEV_LAPTOP_16GB_FIXTURE,
  supportsVirtualization: false,
};

export const LOW_STORAGE_FIXTURE: HardwareProfile = {
  ...DEV_LAPTOP_16GB_FIXTURE,
  storage: [
    {
      type: "NVME_SSD",
      totalGb: 256,
      freeGb: 8, // Less than required install + scratch space
      isSystemDrive: true,
    },
  ],
};
