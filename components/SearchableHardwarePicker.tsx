"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { HardwareProfile, DeviceType, OperatingSystemFamily } from "@/lib/domain/hardware";
import { Search, ChevronDown, Check, Sparkles, X, Laptop, Monitor, Cpu, Layers } from "lucide-react";
import { HorizontalScrollContainer } from "@/components/HorizontalScrollContainer";

export interface HardwarePresetOption {
  id: string;
  category: string; // e.g. "Laptop · Apple", "Desktop · NVIDIA", "Laptop · NVIDIA", "Desktop · AMD", "Laptop · AMD", "Desktop · Intel", "Laptop · Intel", "Handheld / APU", "Workstation"
  displayName: string;
  memoryBadge: string; // e.g. "(16GB)", "(24GB)", "(32GB)", "(64GB)", "(128GB)"
  subtitle?: string;
  profile: HardwareProfile;
}

export const EXTENDED_HARDWARE_CATALOG: HardwarePresetOption[] = [
  // ===================== LAPTOP · APPLE =====================
  {
    id: "macbook-air-m4-16g",
    category: "Laptop · Apple",
    displayName: "MacBook Air M4 (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Apple M4 8-core CPU • 10-core GPU • 120 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M4 (8-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 8, performanceScore: 92, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 GPU (10-core)", manufacturer: "Apple", type: "unified", performanceScore: 88, vramGb: 16, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 16, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 350, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-air-m4-24g",
    category: "Laptop · Apple",
    displayName: "MacBook Air M4 (24GB)",
    memoryBadge: "(24GB)",
    subtitle: "Apple M4 10-core CPU • 10-core GPU • 120 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M4 (10-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 10, performanceScore: 94, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 GPU (10-core)", manufacturer: "Apple", type: "unified", performanceScore: 89, vramGb: 24, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 24, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 380, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-air-m4-32g",
    category: "Laptop · Apple",
    displayName: "MacBook Air M4 (32GB)",
    memoryBadge: "(32GB)",
    subtitle: "Apple M4 10-core CPU • 10-core GPU • 120 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M4 (10-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 10, performanceScore: 94, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 GPU (10-core)", manufacturer: "Apple", type: "unified", performanceScore: 89, vramGb: 32, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 32, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 750, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-pro-m4-16g",
    category: "Laptop · Apple",
    displayName: "MacBook Pro 14\" M4 (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Apple M4 10-core CPU • Active Cooling • 120 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M4 (10-core Pro)", manufacturer: "Apple", architecture: "arm64", physicalCores: 10, performanceScore: 95, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 GPU (10-core)", manufacturer: "Apple", type: "unified", performanceScore: 90, vramGb: 16, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 16, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 380, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-pro-m4-pro-24g",
    category: "Laptop · Apple",
    displayName: "MacBook Pro M4 Pro (24GB)",
    memoryBadge: "(24GB)",
    subtitle: "Apple M4 Pro 12-core CPU • 16-core GPU • 273 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M4 Pro (12-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 12, performanceScore: 97, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 Pro GPU (16-core)", manufacturer: "Apple", type: "unified", performanceScore: 93, vramGb: 24, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 24, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 800, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-pro-m4-pro-48g",
    category: "Laptop · Apple",
    displayName: "MacBook Pro M4 Pro (48GB)",
    memoryBadge: "(48GB)",
    subtitle: "Apple M4 Pro 14-core CPU • 20-core GPU • 273 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M4 Pro (14-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 14, performanceScore: 98, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 Pro GPU (20-core)", manufacturer: "Apple", type: "unified", performanceScore: 95, vramGb: 48, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 48, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 780, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-pro-m4-max-36g",
    category: "Laptop · Apple",
    displayName: "MacBook Pro M4 Max (36GB)",
    memoryBadge: "(36GB)",
    subtitle: "Apple M4 Max 14-core CPU • 32-core GPU • 410 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M4 Max (14-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 14, performanceScore: 98, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 Max GPU (32-core)", manufacturer: "Apple", type: "unified", performanceScore: 96, vramGb: 36, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 36, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 820, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-pro-m4-max-64g",
    category: "Laptop · Apple",
    displayName: "MacBook Pro M4 Max (64GB)",
    memoryBadge: "(64GB)",
    subtitle: "Apple M4 Max 16-core CPU • 40-core GPU • 546 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M4 Max (16-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 16, performanceScore: 99, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 Max GPU (40-core)", manufacturer: "Apple", type: "unified", performanceScore: 98, vramGb: 64, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 64, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1650, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-pro-m4-max-128g",
    category: "Laptop · Apple",
    displayName: "MacBook Pro M4 Max (128GB)",
    memoryBadge: "(128GB)",
    subtitle: "Apple M4 Max 16-core CPU • 40-core GPU • 546 GB/s • 128GB AI Beast",
    profile: {
      cpu: { model: "Apple M4 Max (16-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 16, performanceScore: 99, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M4 Max GPU (40-core)", manufacturer: "Apple", type: "unified", performanceScore: 98, vramGb: 128, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 128, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 4000, freeGb: 3500, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-pro-m3-max-36g",
    category: "Laptop · Apple",
    displayName: "MacBook Pro M3 Max (36GB)",
    memoryBadge: "(36GB)",
    subtitle: "Apple M3 Max 14-core • 30-core GPU • 300 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M3 Max (14-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 14, performanceScore: 96, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M3 Max GPU (30-core)", manufacturer: "Apple", type: "unified", performanceScore: 93, vramGb: 36, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 36, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 700, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "macbook-air-m2-16g",
    category: "Laptop · Apple",
    displayName: "MacBook Air M2 (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Apple M2 8-core CPU • 10-core GPU • 100 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M2 (8-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 8, performanceScore: 84, laptopVariant: true, isVerified: true },
      gpu: { model: "Apple M2 GPU (10-core)", manufacturer: "Apple", type: "unified", performanceScore: 82, vramGb: 16, supportsMetal: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 16, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 340, isSystemDrive: true }],
      os: { family: "macos", version: "14 Sonoma", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },

  // ===================== DESKTOP · APPLE =====================
  {
    id: "mac-studio-m2-ultra-192g",
    category: "Desktop · Apple",
    displayName: "Mac Studio M2 Ultra (192GB)",
    memoryBadge: "(192GB)",
    subtitle: "Apple M2 Ultra 24-core CPU • 76-core GPU • 800 GB/s Unified Memory",
    profile: {
      cpu: { model: "Apple M2 Ultra (24-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 24, performanceScore: 99, isVerified: true },
      gpu: { model: "Apple M2 Ultra GPU (76-core)", manufacturer: "Apple", type: "unified", performanceScore: 97, vramGb: 192, supportsMetal: true, isVerified: true },
      ram: { totalGb: 192, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 4000, freeGb: 3200, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "mac-mini-m4-pro-24g",
    category: "Desktop · Apple",
    displayName: "Mac Mini M4 Pro (24GB)",
    memoryBadge: "(24GB)",
    subtitle: "Apple M4 Pro 12-core CPU • 16-core GPU • 273 GB/s Compact Studio",
    profile: {
      cpu: { model: "Apple M4 Pro (12-core)", manufacturer: "Apple", architecture: "arm64", physicalCores: 12, performanceScore: 97, isVerified: true },
      gpu: { model: "Apple M4 Pro GPU (16-core)", manufacturer: "Apple", type: "unified", performanceScore: 93, vramGb: 24, supportsMetal: true, isVerified: true },
      ram: { totalGb: 24, type: "Unified" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 380, isSystemDrive: true }],
      os: { family: "macos", version: "15 Sequoia", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "mini-pc",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },

  // ===================== DESKTOP · NVIDIA =====================
  {
    id: "rtx-5090-desktop-32g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 5090 (32GB)",
    memoryBadge: "(32GB)",
    subtitle: "Core i9-14900K • 64GB DDR5 • Blackwell Flagship 1792 GB/s GDDR7",
    profile: {
      cpu: { model: "Intel Core i9-14900K", manufacturer: "Intel", architecture: "x86_64", physicalCores: 24, performanceScore: 99, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 5090", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 100, vramGb: 32, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 64, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1500, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-5080-desktop-16g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 5080 (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Ryzen 7 7800X3D • 32GB DDR5 • Blackwell 1000 GB/s GDDR7",
    profile: {
      cpu: { model: "AMD Ryzen 7 7800X3D", manufacturer: "AMD", architecture: "x86_64", physicalCores: 8, performanceScore: 94, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 5080", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 96, vramGb: 16, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1600, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4090-desktop-24g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 4090 (24GB)",
    memoryBadge: "(24GB)",
    subtitle: "Core i9-14900K • 64GB DDR5 • Ada Lovelace Flagship 1008 GB/s",
    profile: {
      cpu: { model: "Intel Core i9-14900K", manufacturer: "Intel", architecture: "x86_64", physicalCores: 24, performanceScore: 99, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4090", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 99, vramGb: 24, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 64, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1600, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4080-super-16g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 4080 Super (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Ryzen 9 7900X • 32GB DDR5 • 736 GB/s GDDR6X",
    profile: {
      cpu: { model: "AMD Ryzen 9 7900X", manufacturer: "AMD", architecture: "x86_64", physicalCores: 12, performanceScore: 95, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4080 Super", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 94, vramGb: 16, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 750, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4070-ti-super-16g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 4070 Ti Super (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Core i7-14700K • 32GB DDR5 • 672 GB/s 256-bit Bus",
    profile: {
      cpu: { model: "Intel Core i7-14700K", manufacturer: "Intel", architecture: "x86_64", physicalCores: 20, performanceScore: 94, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4070 Ti Super", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 91, vramGb: 16, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 680, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4070-super-12g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 4070 Super (12GB)",
    memoryBadge: "(12GB)",
    subtitle: "Ryzen 5 7600X • 32GB DDR5 • 504 GB/s 1440p Sweet Spot",
    profile: {
      cpu: { model: "AMD Ryzen 5 7600X", manufacturer: "AMD", architecture: "x86_64", physicalCores: 6, performanceScore: 82, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4070 Super", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 88, vramGb: 12, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 600, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4070-desktop-12g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 4070 (12GB)",
    memoryBadge: "(12GB)",
    subtitle: "Core i5-13600K • 32GB DDR5 • 504 GB/s GDDR6X",
    profile: {
      cpu: { model: "Intel Core i5-13600K", manufacturer: "Intel", architecture: "x86_64", physicalCores: 14, performanceScore: 85, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4070", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 85, vramGb: 12, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 580, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4060-ti-16g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 4060 Ti (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Ryzen 5 7600 • 32GB DDR5 • 16GB VRAM for Local AI on Budget",
    profile: {
      cpu: { model: "AMD Ryzen 5 7600", manufacturer: "AMD", architecture: "x86_64", physicalCores: 6, performanceScore: 80, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4060 Ti 16GB", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 82, vramGb: 16, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 620, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4060-desktop-8g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 4060 (8GB)",
    memoryBadge: "(8GB)",
    subtitle: "Core i5-13400F • 16GB DDR4 • 272 GB/s 1080p Mainstream",
    profile: {
      cpu: { model: "Intel Core i5-13400F", manufacturer: "Intel", architecture: "x86_64", physicalCores: 10, performanceScore: 75, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4060", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 78, vramGb: 8, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 16, type: "DDR4" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 480, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-3090-desktop-24g",
    category: "Desktop · NVIDIA",
    displayName: "GeForce RTX 3090 (24GB)",
    memoryBadge: "(24GB)",
    subtitle: "Ryzen 9 5950X • 64GB DDR4 • 936 GB/s Ampere Workhorse",
    profile: {
      cpu: { model: "AMD Ryzen 9 5950X", manufacturer: "AMD", architecture: "x86_64", physicalCores: 16, performanceScore: 92, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 3090", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 93, vramGb: 24, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 64, type: "DDR4" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1200, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },

  // ===================== LAPTOP · NVIDIA =====================
  {
    id: "rtx-5090-laptop-24g",
    category: "Laptop · NVIDIA",
    displayName: "GeForce RTX 5090 Laptop GPU (24GB)",
    memoryBadge: "(24GB)",
    subtitle: "Core Ultra 9 285HX • 64GB DDR5 • Flagship Mobile Blackwell",
    profile: {
      cpu: { model: "Intel Core Ultra 9 285HX", manufacturer: "Intel", architecture: "x86_64", physicalCores: 24, performanceScore: 97, laptopVariant: true, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 5090 Laptop GPU", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 95, vramGb: 24, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 64, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1600, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-5080-laptop-16g",
    category: "Laptop · NVIDIA",
    displayName: "GeForce RTX 5080 Laptop GPU (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Ryzen 9 7945HX • 32GB DDR5 • Mobile Blackwell 16GB",
    profile: {
      cpu: { model: "AMD Ryzen 9 7945HX", manufacturer: "AMD", architecture: "x86_64", physicalCores: 16, performanceScore: 95, laptopVariant: true, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 5080 Laptop GPU", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 92, vramGb: 16, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 750, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4090-laptop-16g",
    category: "Laptop · NVIDIA",
    displayName: "GeForce RTX 4090 Laptop GPU (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Core i9-13980HX • 32GB DDR5 • 576 GB/s Mobile Flagship",
    profile: {
      cpu: { model: "Intel Core i9-13980HX", manufacturer: "Intel", architecture: "x86_64", physicalCores: 24, performanceScore: 94, laptopVariant: true, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4090 Laptop GPU", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 91, vramGb: 16, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1400, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4080-laptop-12g",
    category: "Laptop · NVIDIA",
    displayName: "GeForce RTX 4080 Laptop GPU (12GB)",
    memoryBadge: "(12GB)",
    subtitle: "Core i7-13700HX • 32GB DDR5 • 432 GB/s 12GB VRAM",
    profile: {
      cpu: { model: "Intel Core i7-13700HX", manufacturer: "Intel", architecture: "x86_64", physicalCores: 16, performanceScore: 89, laptopVariant: true, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4080 Laptop GPU", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 87, vramGb: 12, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 680, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4070-laptop-8g",
    category: "Laptop · NVIDIA",
    displayName: "GeForce RTX 4070 Laptop GPU (8GB)",
    memoryBadge: "(8GB)",
    subtitle: "Core i7-13700H • 32GB DDR5 • 256 GB/s 140W Max-P",
    profile: {
      cpu: { model: "Intel Core i7-13700H", manufacturer: "Intel", architecture: "x86_64", physicalCores: 14, performanceScore: 84, laptopVariant: true, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4070 Laptop GPU", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 81, vramGb: 8, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 600, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rtx-4060-laptop-8g",
    category: "Laptop · NVIDIA",
    displayName: "GeForce RTX 4060 Laptop GPU (8GB)",
    memoryBadge: "(8GB)",
    subtitle: "Ryzen 7 7735HS • 16GB DDR5 • 256 GB/s Best Value Creator",
    profile: {
      cpu: { model: "AMD Ryzen 7 7735HS", manufacturer: "AMD", architecture: "x86_64", physicalCores: 8, performanceScore: 78, laptopVariant: true, isVerified: true },
      gpu: { model: "NVIDIA GeForce RTX 4060 Laptop GPU", manufacturer: "NVIDIA", type: "dedicated", performanceScore: 77, vramGb: 8, supportsCuda: true, supportsDirectX12: true, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 16, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 300, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },

  // ===================== DESKTOP · AMD =====================
  {
    id: "rx-7900-xtx-24g",
    category: "Desktop · AMD",
    displayName: "Radeon RX 7900 XTX (24GB)",
    memoryBadge: "(24GB)",
    subtitle: "Ryzen 9 7950X • 64GB DDR5 • 960 GB/s 24GB RDNA3 Flagship",
    profile: {
      cpu: { model: "AMD Ryzen 9 7950X", manufacturer: "AMD", architecture: "x86_64", physicalCores: 16, performanceScore: 98, isVerified: true },
      gpu: { model: "AMD Radeon RX 7900 XTX", manufacturer: "AMD", type: "dedicated", performanceScore: 95, vramGb: 24, supportsVulkan: true, supportsDirectX12: true, isVerified: true },
      ram: { totalGb: 64, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1500, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "rx-9070-xt-16g",
    category: "Desktop · AMD",
    displayName: "Radeon RX 9070 XT (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Ryzen 7 9800X3D • 32GB DDR5 • Next-Gen RDNA4 Architecture",
    profile: {
      cpu: { model: "AMD Ryzen 7 9800X3D", manufacturer: "AMD", architecture: "x86_64", physicalCores: 8, performanceScore: 97, isVerified: true },
      gpu: { model: "AMD Radeon RX 9070 XT", manufacturer: "AMD", type: "dedicated", performanceScore: 92, vramGb: 16, supportsVulkan: true, supportsDirectX12: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 750, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "radeon-ai-pro-r9700-32g",
    category: "Desktop · AMD",
    displayName: "Radeon AI PRO R9700 (32GB)",
    memoryBadge: "(32GB)",
    subtitle: "Threadripper 7960X • 128GB DDR5 • 32GB High-Density Local AI Workstation",
    profile: {
      cpu: { model: "AMD Ryzen Threadripper 7960X", manufacturer: "AMD", architecture: "x86_64", physicalCores: 24, performanceScore: 98, isVerified: true },
      gpu: { model: "AMD Radeon AI PRO R9700", manufacturer: "AMD", type: "dedicated", performanceScore: 95, vramGb: 32, supportsVulkan: true, supportsDirectX12: true, isVerified: true },
      ram: { totalGb: 128, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 4000, freeGb: 3200, isSystemDrive: true }],
      os: { family: "linux", version: "Ubuntu 24.04 LTS", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "workstation",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },

  // ===================== LAPTOP · AMD =====================
  {
    id: "ryzen-ai-max-395-32g",
    category: "Laptop · AMD",
    displayName: "Ryzen AI Max+ 395 (32GB LPDDR5X)",
    memoryBadge: "(32GB)",
    subtitle: "16-core Zen 5 • Radeon 8060S (40 CU) • Strix Halo APU",
    profile: {
      cpu: { model: "AMD Ryzen AI Max+ 395 (16-core)", manufacturer: "AMD", architecture: "x86_64", physicalCores: 16, performanceScore: 96, laptopVariant: true, isVerified: true },
      gpu: { model: "AMD Radeon 8060S Graphics (40 CU)", manufacturer: "AMD", type: "unified", performanceScore: 89, vramGb: 32, supportsVulkan: true, supportsDirectX12: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 32, type: "LPDDR5X" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 800, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "ryzen-ai-max-395-64g",
    category: "Laptop · AMD",
    displayName: "Ryzen AI Max+ 395 (64GB LPDDR5X)",
    memoryBadge: "(64GB)",
    subtitle: "16-core Zen 5 • 64GB Unified Memory • 256-bit Memory Bus",
    profile: {
      cpu: { model: "AMD Ryzen AI Max+ 395 (16-core)", manufacturer: "AMD", architecture: "x86_64", physicalCores: 16, performanceScore: 97, laptopVariant: true, isVerified: true },
      gpu: { model: "AMD Radeon 8060S Graphics (40 CU)", manufacturer: "AMD", type: "unified", performanceScore: 91, vramGb: 64, supportsVulkan: true, supportsDirectX12: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 64, type: "LPDDR5X" },
      storage: [{ type: "NVME_SSD", totalGb: 2000, freeGb: 1600, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "ryzen-ai-max-395-128g",
    category: "Laptop · AMD",
    displayName: "Ryzen AI Max+ 395 (128GB LPDDR5X)",
    memoryBadge: "(128GB)",
    subtitle: "16-core Zen 5 • Massive 128GB Unified Strix Halo Workstation",
    profile: {
      cpu: { model: "AMD Ryzen AI Max+ 395 (16-core)", manufacturer: "AMD", architecture: "x86_64", physicalCores: 16, performanceScore: 97, laptopVariant: true, isVerified: true },
      gpu: { model: "AMD Radeon 8060S Graphics (40 CU)", manufacturer: "AMD", type: "unified", performanceScore: 92, vramGb: 128, supportsVulkan: true, supportsDirectX12: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 128, type: "LPDDR5X" },
      storage: [{ type: "NVME_SSD", totalGb: 4000, freeGb: 3400, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "ryzen-7-7840hs-32g",
    category: "Laptop · AMD",
    displayName: "ThinkPad AMD Ryzen 7 7840HS (32GB)",
    memoryBadge: "(32GB)",
    subtitle: "8-core Zen 4 • Radeon 780M • 32GB LPDDR5X Dev Laptop",
    profile: {
      cpu: { model: "AMD Ryzen 7 7840HS", manufacturer: "AMD", architecture: "x86_64", physicalCores: 8, performanceScore: 82, laptopVariant: true, isVerified: true },
      gpu: { model: "AMD Radeon 780M", manufacturer: "AMD", type: "integrated", performanceScore: 55, vramGb: 4, supportsVulkan: true, supportsDirectX12: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 32, type: "LPDDR5X" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 720, isSystemDrive: true }],
      os: { family: "linux", version: "Ubuntu 24.04", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },

  // ===================== DESKTOP · INTEL =====================
  {
    id: "intel-arc-b580-12g",
    category: "Desktop · Intel",
    displayName: "Intel Arc B580 Battlemage (12GB)",
    memoryBadge: "(12GB)",
    subtitle: "Core i5-14600K • 32GB DDR5 • 456 GB/s Xe2 Architecture",
    profile: {
      cpu: { model: "Intel Core i5-14600K", manufacturer: "Intel", architecture: "x86_64", physicalCores: 14, performanceScore: 86, isVerified: true },
      gpu: { model: "Intel Arc B580 Battlemage", manufacturer: "Intel", type: "dedicated", performanceScore: 81, vramGb: 12, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 650, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "intel-arc-a770-16g",
    category: "Desktop · Intel",
    displayName: "Intel Arc A770 (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "Core i5-13600K • 32GB DDR5 • 560 GB/s Dual AV1 Hardware Encoders",
    profile: {
      cpu: { model: "Intel Core i5-13600K", manufacturer: "Intel", architecture: "x86_64", physicalCores: 14, performanceScore: 85, isVerified: true },
      gpu: { model: "Intel Arc A770 16GB", manufacturer: "Intel", type: "dedicated", performanceScore: 79, vramGb: 16, supportsDirectX12: true, supportsVulkan: true, isVerified: true },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 600, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },

  // ===================== LAPTOP · INTEL & ARM =====================
  {
    id: "intel-lunar-lake-288v-32g",
    category: "Laptop · Intel",
    displayName: "Core Ultra 9 288V Lunar Lake (32GB)",
    memoryBadge: "(32GB)",
    subtitle: "8-core Xe2 Battlemage iGPU • 32GB On-Package LPDDR5X-8533",
    profile: {
      cpu: { model: "Intel Core Ultra 9 288V", manufacturer: "Intel", architecture: "x86_64", physicalCores: 8, performanceScore: 86, laptopVariant: true, isVerified: true },
      gpu: { model: "Intel Arc 140V GPU", manufacturer: "Intel", type: "integrated", performanceScore: 68, vramGb: 8, supportsDirectX12: true, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 32, type: "LPDDR5X" },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 750, isSystemDrive: true }],
      os: { family: "windows", version: "11", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },
  {
    id: "snapdragon-x-elite-16g",
    category: "Laptop · Qualcomm",
    displayName: "Surface Laptop Snapdragon X Elite (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "12-core Oryon ARM64 • Adreno X1 GPU • 45 TOPS NPU",
    profile: {
      cpu: { model: "Qualcomm Snapdragon X Elite X1E-80-100", manufacturer: "Qualcomm", architecture: "arm64", physicalCores: 12, performanceScore: 85, laptopVariant: true, isVerified: true },
      gpu: { model: "Qualcomm Adreno X1-85 GPU", manufacturer: "Qualcomm", type: "integrated", performanceScore: 58, vramGb: 4, supportsDirectX12: true, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 16, type: "LPDDR5X" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 380, isSystemDrive: true }],
      os: { family: "windows", version: "11 ARM64", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  },

  // ===================== HANDHELD / APU =====================
  {
    id: "steam-deck-oled-16g",
    category: "Handheld / APU",
    displayName: "Valve Steam Deck OLED (16GB)",
    memoryBadge: "(16GB)",
    subtitle: "AMD Van Gogh 4-core APU • Custom RDNA 2 GPU • SteamOS",
    profile: {
      cpu: { model: "AMD Custom APU 0405", manufacturer: "AMD", architecture: "x86_64", physicalCores: 4, performanceScore: 60, laptopVariant: true, isVerified: true },
      gpu: { model: "AMD Custom RDNA 2 GPU", manufacturer: "AMD", type: "unified", performanceScore: 50, vramGb: 6, supportsVulkan: true, laptopVariant: true, isVerified: true },
      ram: { totalGb: 16, type: "LPDDR5" },
      storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 280, isSystemDrive: true }],
      os: { family: "linux", version: "SteamOS 3.5", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true
    }
  }
];

interface SearchableHardwarePickerProps {
  value: HardwareProfile;
  onChange: (profile: HardwareProfile) => void;
  onSwitchToManual?: () => void;
}

export function SearchableHardwarePicker({
  value,
  onChange,
  onSwitchToManual
}: SearchableHardwarePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    EXTENDED_HARDWARE_CATALOG.forEach(opt => set.add(opt.category));
    return ["All", ...Array.from(set)];
  }, []);

  // Filter options based on search query and category
  const filteredOptions = useMemo(() => {
    let list = EXTENDED_HARDWARE_CATALOG;
    if (selectedCategory !== "All") {
      list = list.filter(opt => opt.category === selectedCategory);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(opt => {
      const matchName = opt.displayName.toLowerCase().includes(q);
      const matchCat = opt.category.toLowerCase().includes(q);
      const matchMem = opt.memoryBadge.toLowerCase().includes(q);
      const matchSub = opt.subtitle?.toLowerCase().includes(q) || false;
      const matchGpu = opt.profile.gpu?.model.toLowerCase().includes(q) || false;
      const matchCpu = opt.profile.cpu.model.toLowerCase().includes(q) || false;
      return matchName || matchCat || matchMem || matchSub || matchGpu || matchCpu;
    });
  }, [searchQuery, selectedCategory]);

  // Group filtered options by category
  const groupedCategories = useMemo(() => {
    const map = new Map<string, HardwarePresetOption[]>();
    filteredOptions.forEach(opt => {
      const list = map.get(opt.category) || [];
      list.push(opt);
      map.set(opt.category, list);
    });
    return Array.from(map.entries());
  }, [filteredOptions]);

  // Find currently matched option
  const currentMatch = useMemo(() => {
    return EXTENDED_HARDWARE_CATALOG.find(opt => {
      const sameGpu = opt.profile.gpu?.model === value.gpu?.model;
      const sameRam = opt.profile.ram.totalGb === value.ram.totalGb;
      const sameCpu = opt.profile.cpu.model === value.cpu.model;
      return (sameGpu && sameRam) || (sameCpu && sameRam);
    });
  }, [value]);

  const handleSelect = (option: HardwarePresetOption) => {
    onChange(option.profile);
    setIsOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[activeIndex]) {
        handleSelect(filteredOptions[activeIndex]);
      }
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all text-left bg-surface-card ${
          isOpen
            ? "border-brand-primary ring-2 ring-brand-primary/20 shadow-md"
            : "border-border-subtle hover:border-border-strong shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0 border border-brand-primary/20">
            {value.deviceType === "laptop" ? (
              <Laptop className="w-5 h-5" />
            ) : (
              <Monitor className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-content-strong text-sm sm:text-base truncate">
                {currentMatch ? currentMatch.displayName : `${value.cpu.model || "Custom System"}`}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex-shrink-0">
                {value.ram.totalGb}GB RAM
              </span>
              {value.gpu?.vramGb ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 flex-shrink-0">
                  {value.gpu.vramGb}GB VRAM
                </span>
              ) : null}
            </div>

            <p className="text-xs text-content-muted truncate mt-0.5">
              {value.gpu?.model ? `${value.gpu.model} • ` : ""}
              {value.storage?.[0]?.freeGb ? `${value.storage[0].freeGb}GB Free • ` : ""}
              {value.os.family.toUpperCase()} ({value.architecture.toUpperCase()})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-content-muted">
          <span className="hidden sm:inline-block text-xs text-brand-primary font-semibold hover:underline">
            Change
          </span>
          <ChevronDown
            className={`w-4 h-4 text-content-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-brand-primary" : ""
            }`}
          />
        </div>
      </button>

      {/* Rich Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-2 bg-surface-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ maxHeight: "420px" }}
        >
          {/* Search Header */}
          <div className="p-3 border-b border-border-subtle bg-surface-subtle sticky top-0 z-10 space-y-2">
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-content-muted flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search hardware (e.g. RTX 4090, M4 Max, 7900 XTX, 32GB)..."
                className="w-full bg-transparent text-sm text-content-strong placeholder:text-content-muted focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-md text-content-muted hover:text-content-strong"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Popular Searches with Left/Right Buttons */}
            <div className="flex items-center gap-1.5 min-w-0 py-0.5 text-[10px]">
              <span className="text-content-muted font-mono font-bold flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-brand-primary" />
                Quick:
              </span>
              <HorizontalScrollContainer buttonSize="sm" scrollStep={180} className="text-[10px]">
                {[
                  { label: "M4 Max (64GB)", query: "m4 max", icon: "🍏" },
                  { label: "RTX 4090 (24GB)", query: "4090", icon: "🖥️" },
                  { label: "RTX 4060 Laptop", query: "4060", icon: "🎮" },
                  { label: "Ryzen 7800X3D", query: "7800x3d", icon: "⚡" },
                  { label: "MacBook Air", query: "macbook air", icon: "💻" },
                  { label: "64GB RAM", query: "64gb", icon: "🧠" },
                  { label: "Snapdragon", query: "snapdragon", icon: "🔋" },
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item.query);
                      setActiveIndex(0);
                    }}
                    className="px-2 py-0.5 rounded-md bg-surface-card hover:bg-surface-elevated text-content-body hover:text-content-strong border border-border-subtle hover:border-brand-primary/40 font-mono transition-all shrink-0 flex items-center gap-1"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </HorizontalScrollContainer>
            </div>

            {/* Category Filter Pills with Scroll Buttons */}
            <HorizontalScrollContainer scrollStep={180} className="text-[11px]">
              {categories.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isSelected
                        ? "bg-brand-primary text-white shadow-xs"
                        : "bg-surface-card text-content-muted hover:text-content-strong border border-border-subtle"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </HorizontalScrollContainer>
          </div>

          {/* Categorized List */}
          <div ref={listRef} className="overflow-y-auto max-h-[350px] p-2 space-y-3">
            {groupedCategories.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-sm font-medium text-content-strong">
                  No hardware presets found matching &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-content-muted">
                  You can fine-tune any custom CPU, GPU, or RAM specs in the Custom Editor below.
                </p>
                {onSwitchToManual && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onSwitchToManual();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity mt-2"
                  >
                    Open Custom Component Editor
                  </button>
                )}
              </div>
            ) : (
              groupedCategories.map(([category, items]) => (
                <div key={category} className="space-y-1">
                  {/* Category Subheader */}
                  <div className="px-3 py-1 text-[11px] font-bold text-content-muted uppercase tracking-wider sticky top-0 bg-surface-card/95 backdrop-blur-sm z-5">
                    {category}
                  </div>

                  {/* Category Items */}
                  <div className="space-y-0.5">
                    {items.map((opt) => {
                      const isSelected = currentMatch?.id === opt.id;
                      const isHovered = filteredOptions[activeIndex]?.id === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelect(opt)}
                          onMouseEnter={() => {
                            const idx = filteredOptions.findIndex(o => o.id === opt.id);
                            if (idx !== -1) setActiveIndex(idx);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs sm:text-sm transition-colors ${
                            isSelected
                              ? "bg-brand-primary text-white font-semibold shadow-sm"
                              : isHovered
                              ? "bg-surface-subtle text-content-strong"
                              : "text-content-body hover:bg-surface-subtle"
                          }`}
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="truncate">
                                {opt.displayName}
                              </span>
                            </div>
                            {opt.subtitle && (
                              <p className={`text-[11px] truncate mt-0.5 ${
                                isSelected ? "text-white/80" : "text-content-muted"
                              }`}>
                                {opt.subtitle}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-surface-subtle border border-border-subtle text-content-strong"
                            }`}>
                              {opt.memoryBadge}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-white flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Quick Action */}
          <div className="p-2.5 border-t border-border-subtle bg-surface-subtle/80 flex items-center justify-between text-xs text-content-muted px-4">
            <span>
              {filteredOptions.length} hardware models available
            </span>
            {onSwitchToManual && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSwitchToManual();
                }}
                className="text-brand-primary font-semibold hover:underline"
              >
                + Edit Specs Manually
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
