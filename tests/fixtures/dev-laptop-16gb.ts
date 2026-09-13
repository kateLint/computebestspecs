import { HardwareProfile } from "../../lib/domain/hardware";

export const DEV_LAPTOP_16GB_FIXTURE: HardwareProfile = {
  cpu: {
    model: "AMD Ryzen 5 5600H",
    manufacturer: "AMD",
    architecture: "x86_64",
    physicalCores: 6,
    threads: 12,
    performanceScore: 68,
    laptopVariant: true,
    isVerified: true,
  },
  gpu: {
    model: "NVIDIA GeForce RTX 3050 Laptop GPU",
    manufacturer: "NVIDIA",
    type: "dedicated",
    performanceScore: 52,
    vramGb: 4,
    supportsCuda: true,
    supportsDirectX12: true,
    supportsVulkan: true,
    laptopVariant: true,
    isVerified: true,
  },
  ram: {
    totalGb: 16,
    type: "DDR4",
    upgradeable: true,
  },
  storage: [
    {
      type: "NVME_SSD",
      totalGb: 512,
      freeGb: 180,
      isSystemDrive: true,
    },
  ],
  os: {
    family: "windows",
    version: "11 23H2",
    architecture: "x86_64",
  },
  architecture: "x86_64",
  deviceType: "laptop",
  supportsVirtualization: true,
};
