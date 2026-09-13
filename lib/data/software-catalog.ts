import { Software, SoftwareVersion } from "../domain/software";

/**
 * Curated Canonical Software Catalog (§30 Production Products)
 * All requirements extracted from official vendor system requirements and empirical workload traces.
 */
export const CANONICAL_SOFTWARE_CATALOG: { software: Software; versions: SoftwareVersion[] }[] = [
  // 1. Adobe Photoshop 2024
  {
    software: {
      id: "photoshop",
      name: "Adobe Photoshop 2024",
      slug: "photoshop",
      category: "Design",
      developer: "Adobe",
      iconUrl: "/icons/photoshop.svg",
      description: "Industry-standard raster graphics editor and digital compositing tool.",
      isVerified: true,
      aliases: ["Photoshop", "Adobe Photoshop", "PS 2024"],
    },
    versions: [
      {
        id: "ver_photoshop_2024",
        softwareId: "photoshop",
        version: "25.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [
          { family: "windows", minimumVersion: "10 64-bit v22H2", supportedArchitectures: ["x86_64", "arm64"] },
          { family: "macos", minimumVersion: "12.0", supportedArchitectures: ["arm64", "x86_64"] },
        ],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 45, minimumCores: 4 },
          gpu: { minimumPerformanceScore: 35, minimumVramGb: 2, supportsDirectX12: true, supportsMetal: true },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          professionalRamGb: 32,
          storage: { installGb: 20, scratchDiskGb: 50, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }, { family: "macos", supportedArchitectures: ["arm64"] }],
        },
        workloads: [
          {
            id: "ps_photo_edit",
            name: "Standard Photo Retouching",
            description: "Basic photo correction, layered adjustments, Web graphics.",
            typical: { ramGb: 4.5, cpu: 25, gpu: 20, vramGb: 2.0 },
            peak: { ramGb: 7.0, cpu: 60, gpu: 45, vramGb: 3.5 },
          },
          {
            id: "ps_heavy_composite",
            name: "Heavy Multi-Layer Compositing",
            description: "100+ layer 16-bit posters, Smart Objects, Generative AI fills.",
            typical: { ramGb: 10.0, cpu: 45, gpu: 40, vramGb: 4.0 },
            peak: { ramGb: 18.0, cpu: 85, gpu: 75, vramGb: 6.0 },
          },
        ],
        sourceRecords: [{ publisher: "Adobe Systems", url: "https://helpx.adobe.com/photoshop/system-requirements.html", retrievedAt: "2026-01-15", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 2. Android Studio & Emulator
  {
    software: {
      id: "android-studio",
      name: "Android Studio Iguana",
      slug: "android-studio",
      category: "IDE",
      developer: "Google",
      iconUrl: "/icons/android-studio.svg",
      description: "Official IDE for Android application development based on IntelliJ IDEA.",
      isVerified: true,
      aliases: ["Android Studio", "Studio", "IDEA"],
    },
    versions: [
      {
        id: "ver_android_studio_2024",
        softwareId: "android-studio",
        version: "2024.1",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [
          { family: "windows", minimumVersion: "10", supportedArchitectures: ["x86_64", "arm64"] },
          { family: "macos", minimumVersion: "12.0", supportedArchitectures: ["arm64", "x86_64"] },
          { family: "linux", supportedArchitectures: ["x86_64", "arm64"] },
        ],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 50, minimumCores: 4 },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          professionalRamGb: 32,
          storage: { installGb: 16, scratchDiskGb: 30, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "as_gradle_build",
            name: "Gradle Compilation & Indexing",
            typical: { ramGb: 5.5, cpu: 40, gpu: 10, vramGb: 0.5 },
            peak: { ramGb: 9.0, cpu: 95, gpu: 20, vramGb: 1.0 },
          },
        ],
        sourceRecords: [{ publisher: "Google Developers", url: "https://developer.android.com/studio/intro", retrievedAt: "2026-01-20", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 3. Android Emulator
  {
    software: {
      id: "android-emulator",
      name: "Android Emulator (AVD)",
      slug: "android-emulator",
      category: "Virtualization",
      developer: "Google",
      iconUrl: "/icons/android.svg",
      description: "Hardware-accelerated virtual mobile device emulation.",
      isVerified: true,
      aliases: ["AVD", "Android Emulator"],
    },
    versions: [
      {
        id: "ver_android_emu_34",
        softwareId: "android-emulator",
        version: "34.1",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [
          { family: "windows", supportedArchitectures: ["x86_64", "arm64"] },
          { family: "macos", supportedArchitectures: ["arm64", "x86_64"] },
          { family: "linux", supportedArchitectures: ["x86_64"] },
        ],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 50, minimumCores: 4 },
          gpu: { minimumPerformanceScore: 40, minimumVramGb: 1 },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          requiresVirtualization: true,
          storage: { installGb: 15, scratchDiskGb: 20 },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "emu_pixel_run",
            name: "Pixel 8 Virtual Device",
            typical: { ramGb: 4.5, cpu: 30, gpu: 35, vramGb: 1.5 },
            peak: { ramGb: 6.5, cpu: 70, gpu: 60, vramGb: 2.5 },
          },
        ],
        sourceRecords: [{ publisher: "Google", url: "https://developer.android.com/studio/run/emulator-acceleration", retrievedAt: "2026-01-20", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 4. Google Chrome
  {
    software: {
      id: "chrome",
      name: "Google Chrome",
      slug: "chrome",
      category: "Browser",
      developer: "Google",
      iconUrl: "/icons/chrome.svg",
      description: "Fast, modern web browser for power users and web developers.",
      isVerified: true,
      aliases: ["Chrome", "Google Chrome"],
    },
    versions: [
      {
        id: "ver_chrome_122",
        softwareId: "chrome",
        version: "122.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          minimumRamGb: 4,
          recommendedRamGb: 8,
          storage: { installGb: 2 },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "chrome_dev_tabs",
            name: "25 Tabs + DevTools & Inspect",
            typical: { ramGb: 3.5, cpu: 15, gpu: 15, vramGb: 0.8 },
            peak: { ramGb: 5.5, cpu: 45, gpu: 30, vramGb: 1.5 },
          },
        ],
        sourceRecords: [{ publisher: "Google", url: "https://support.google.com/chrome/answer/95346", retrievedAt: "2026-02-01", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 5. Blender 4.2 LTS
  {
    software: {
      id: "blender",
      name: "Blender 4.2 LTS",
      slug: "blender",
      category: "3D",
      developer: "Blender Foundation",
      iconUrl: "/icons/blender.svg",
      description: "Open-source 3D creation suite supporting modeling, rigging, animation, and Cycles rendering.",
      isVerified: true,
      aliases: ["Blender", "Blender 4"],
    },
    versions: [
      {
        id: "ver_blender_42",
        softwareId: "blender",
        version: "4.2",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [
          { family: "windows", minimumVersion: "10", supportedArchitectures: ["x86_64", "arm64"] },
          { family: "macos", minimumVersion: "11.0", supportedArchitectures: ["arm64", "x86_64"] },
          { family: "linux", supportedArchitectures: ["x86_64"] },
        ],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 50, minimumCores: 4 },
          gpu: { minimumPerformanceScore: 50, minimumVramGb: 4, supportsVulkan: true, supportsDirectX12: true, supportsMetal: true },
          minimumRamGb: 8,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 5, scratchDiskGb: 40, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "blender_cycles_render",
            name: "Cycles GPU Path Tracing & Geometry",
            typical: { ramGb: 12.0, cpu: 50, gpu: 85, vramGb: 6.0 },
            peak: { ramGb: 24.0, cpu: 90, gpu: 99, vramGb: 10.0 },
          },
        ],
        sourceRecords: [{ publisher: "Blender Foundation", url: "https://www.blender.org/download/requirements/", retrievedAt: "2026-02-10", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 6. DaVinci Resolve Studio 19
  {
    software: {
      id: "davinci-resolve",
      name: "DaVinci Resolve Studio 19",
      slug: "davinci-resolve",
      category: "Video Editing",
      developer: "Blackmagic Design",
      iconUrl: "/icons/davinci.svg",
      description: "Professional video editing, color grading, visual effects, and audio post-production.",
      isVerified: true,
      aliases: ["DaVinci Resolve", "Resolve 19", "Blackmagic Resolve"],
    },
    versions: [
      {
        id: "ver_resolve_19",
        softwareId: "davinci-resolve",
        version: "19.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [
          { family: "windows", minimumVersion: "10 64-bit", supportedArchitectures: ["x86_64"] },
          { family: "macos", minimumVersion: "13.0", supportedArchitectures: ["arm64"] },
          { family: "linux", supportedArchitectures: ["x86_64"] },
        ],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 65, minimumCores: 8 },
          gpu: { minimumPerformanceScore: 65, minimumVramGb: 6, requiresDedicatedGpu: true, supportsCuda: true, supportsMetal: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 10, scratchDiskGb: 100, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "resolve_4k_color",
            name: "4K ProRes / BRAW Multi-Node Color Grade",
            typical: { ramGb: 18.0, cpu: 65, gpu: 80, vramGb: 7.5 },
            peak: { ramGb: 28.0, cpu: 95, gpu: 98, vramGb: 11.5 },
          },
        ],
        sourceRecords: [{ publisher: "Blackmagic Design", url: "https://www.blackmagicdesign.com/products/davinciresolve/techspecs", retrievedAt: "2026-02-15", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 7. Ollama / Local AI (LLaMA 3.1 8B & 14B)
  {
    software: {
      id: "ollama-local-ai",
      name: "Ollama / Local LLM Inference",
      slug: "ollama-local-ai",
      category: "AI",
      developer: "Ollama",
      iconUrl: "/icons/ai.svg",
      description: "Local private LLM execution server and CLI.",
      isVerified: true,
      aliases: ["Ollama", "llama.cpp", "Local AI"],
    },
    versions: [
      {
        id: "ver_ollama_03",
        softwareId: "ollama-local-ai",
        version: "0.3.12",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 55, minimumCores: 6 },
          gpu: { minimumPerformanceScore: 60, minimumVramGb: 6, supportsCuda: true, supportsMetal: true, supportsVulkan: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          storage: { installGb: 10, scratchDiskGb: 30, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "llm_8b_q4",
            name: "Llama 3.1 8B (Q4_K_M)",
            typical: { ramGb: 6.0, cpu: 30, gpu: 70, vramGb: 5.5 },
            peak: { ramGb: 8.0, cpu: 85, gpu: 95, vramGb: 6.8 },
          },
          {
            id: "llm_14b_q4",
            name: "Qwen 2.5 14B (Q4_K_M)",
            typical: { ramGb: 12.0, cpu: 40, gpu: 85, vramGb: 9.5 },
            peak: { ramGb: 16.0, cpu: 95, gpu: 98, vramGb: 11.5 },
          },
        ],
        sourceRecords: [{ publisher: "Ollama Project", url: "https://ollama.com", retrievedAt: "2026-03-01", kind: "BENCHMARK" }],
      },
    ],
  },

  // 8. Unreal Engine 5.4
  {
    software: {
      id: "unreal-engine",
      name: "Unreal Engine 5.4",
      slug: "unreal-engine",
      category: "Game Development",
      developer: "Epic Games",
      iconUrl: "/icons/unreal.svg",
      description: "Advanced real-time 3D creation tool for AAA games, simulation, and virtual production.",
      isVerified: true,
      aliases: ["UE5", "Unreal Engine 5", "Epic Games Unreal"],
    },
    versions: [
      {
        id: "ver_ue_54",
        softwareId: "unreal-engine",
        version: "5.4",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [
          { family: "windows", minimumVersion: "10 64-bit", supportedArchitectures: ["x86_64"] },
          { family: "macos", minimumVersion: "13.0", supportedArchitectures: ["arm64"] },
          { family: "linux", supportedArchitectures: ["x86_64"] },
        ],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 70, minimumCores: 8 },
          gpu: { minimumPerformanceScore: 75, minimumVramGb: 8, requiresDedicatedGpu: true, supportsDirectX12: true, supportsMetal: true, supportsVulkan: true },
          minimumRamGb: 32,
          recommendedRamGb: 64,
          professionalRamGb: 128,
          storage: { installGb: 120, scratchDiskGb: 100, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "ue5_level_edit",
            name: "Lumen & Nanite Open World Scene",
            typical: { ramGb: 22.0, cpu: 65, gpu: 85, vramGb: 9.0 },
            peak: { ramGb: 36.0, cpu: 98, gpu: 99, vramGb: 14.0 },
          },
        ],
        sourceRecords: [{ publisher: "Epic Games", url: "https://dev.epicgames.com/documentation/en-us/unreal-engine/hardware-and-software-specifications-for-unreal-engine", retrievedAt: "2026-01-10", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 9. Docker Desktop
  {
    software: {
      id: "docker-desktop",
      name: "Docker Desktop",
      slug: "docker-desktop",
      category: "Development",
      developer: "Docker Inc.",
      iconUrl: "/icons/docker.svg",
      description: "Containerization runtime and GUI management platform.",
      isVerified: true,
      aliases: ["Docker", "Docker Desktop"],
    },
    versions: [
      {
        id: "ver_docker_430",
        softwareId: "docker-desktop",
        version: "4.30",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 45, minimumCores: 4 },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          requiresVirtualization: true,
          storage: { installGb: 10, scratchDiskGb: 40 },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "docker_microservices",
            name: "5 Microservice Containers + Postgres",
            typical: { ramGb: 6.0, cpu: 20, gpu: 0, vramGb: 0 },
            peak: { ramGb: 10.0, cpu: 75, gpu: 0, vramGb: 0 },
          },
        ],
        sourceRecords: [{ publisher: "Docker", url: "https://docs.docker.com/desktop/install/windows-install/#system-requirements", retrievedAt: "2026-01-22", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 10. Stable Diffusion WebUI / ComfyUI
  {
    software: {
      id: "comfyui-stable-diffusion",
      name: "ComfyUI / Stable Diffusion XL",
      slug: "comfyui-stable-diffusion",
      category: "AI",
      developer: "ComfyUI Community",
      iconUrl: "/icons/sd.svg",
      description: "Node-based generative AI workflow orchestrator for SDXL, Flux, and animated diffusion.",
      isVerified: true,
      aliases: ["ComfyUI", "SD WebUI", "Stable Diffusion"],
    },
    versions: [
      {
        id: "ver_comfyui_02",
        softwareId: "comfyui-stable-diffusion",
        version: "0.2.4",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "linux" }, { family: "macos" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 50, minimumCores: 6 },
          gpu: { minimumPerformanceScore: 70, minimumVramGb: 8, requiresDedicatedGpu: true, supportsCuda: true, supportsMetal: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          storage: { installGb: 25, scratchDiskGb: 50, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "linux" }, { family: "macos" }],
        },
        workloads: [
          {
            id: "sdxl_generation",
            name: "SDXL 1024x1024 Batch 4 Iterations",
            typical: { ramGb: 12.0, cpu: 30, gpu: 95, vramGb: 8.5 },
            peak: { ramGb: 18.0, cpu: 75, gpu: 99, vramGb: 11.5 },
          },
        ],
        sourceRecords: [{ publisher: "ComfyUI", url: "https://github.com/comfyanonymous/ComfyUI", retrievedAt: "2026-02-28", kind: "COMMUNITY_REPORTED" }],
      },
    ],
  },

  // 11. Adobe Premiere Pro
  {
    software: {
      id: "premiere-pro",
      name: "Adobe Premiere Pro 2024",
      slug: "premiere-pro",
      category: "Video Editing",
      developer: "Adobe",
      iconUrl: "/icons/premiere.svg",
      description: "Industry-standard timeline-based video editing software for 4K/8K multi-cam timelines.",
      isVerified: true,
      aliases: ["Premiere", "Premiere Pro", "PR 2024"],
    },
    versions: [
      {
        id: "ver_premiere_2024",
        softwareId: "premiere-pro",
        version: "24.5",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [
          { family: "windows", minimumVersion: "10 64-bit v22H2", supportedArchitectures: ["x86_64"] },
          { family: "macos", minimumVersion: "13.0", supportedArchitectures: ["arm64"] },
        ],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 60, minimumCores: 6 },
          gpu: { minimumPerformanceScore: 55, minimumVramGb: 4, supportsDirectX12: true, supportsMetal: true, supportsCuda: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 30, scratchDiskGb: 150, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }],
        },
        workloads: [
          {
            id: "premiere_4k_cut",
            name: "4K H.264 / ProRes Multi-Cam Editing",
            typical: { ramGb: 18.0, cpu: 55, gpu: 65, vramGb: 6.0 },
            peak: { ramGb: 30.0, cpu: 90, gpu: 85, vramGb: 8.0 },
          },
        ],
        sourceRecords: [{ publisher: "Adobe", url: "https://helpx.adobe.com/premiere-pro/system-requirements.html", retrievedAt: "2026-01-15", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 12. Adobe After Effects
  {
    software: {
      id: "after-effects",
      name: "Adobe After Effects 2024",
      slug: "after-effects",
      category: "Video Editing",
      developer: "Adobe",
      iconUrl: "/icons/after-effects.svg",
      description: "Digital visual effects, motion graphics, and compositing application with heavy multi-frame rendering.",
      isVerified: true,
      aliases: ["After Effects", "AE", "After Effects 2024"],
    },
    versions: [
      {
        id: "ver_ae_2024",
        softwareId: "after-effects",
        version: "24.3",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 65, minimumCores: 8 },
          gpu: { minimumPerformanceScore: 60, minimumVramGb: 4, supportsDirectX12: true, supportsMetal: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 30, scratchDiskGb: 200, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }],
        },
        workloads: [
          {
            id: "ae_motion_vfx",
            name: "Multi-Frame Motion Graphics & 3D Camera Tracking",
            typical: { ramGb: 24.0, cpu: 75, gpu: 60, vramGb: 6.0 },
            peak: { ramGb: 48.0, cpu: 98, gpu: 80, vramGb: 10.0 },
          },
        ],
        sourceRecords: [{ publisher: "Adobe", url: "https://helpx.adobe.com/after-effects/system-requirements.html", retrievedAt: "2026-01-15", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 13. Final Cut Pro
  {
    software: {
      id: "final-cut-pro",
      name: "Apple Final Cut Pro 11",
      slug: "final-cut-pro",
      category: "Video Editing",
      developer: "Apple",
      iconUrl: "/icons/fcp.svg",
      description: "Professional non-linear video editing optimized for Apple Silicon Neural Engine and Metal architecture.",
      isVerified: true,
      aliases: ["Final Cut Pro", "FCP", "FCPX"],
    },
    versions: [
      {
        id: "ver_fcp_11",
        softwareId: "final-cut-pro",
        version: "11.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "macos", minimumVersion: "14.6", supportedArchitectures: ["arm64"] }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 60, minimumCores: 8, architectures: ["arm64"] },
          gpu: { minimumPerformanceScore: 60, minimumVramGb: 8, supportsMetal: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 10, scratchDiskGb: 100, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "macos", supportedArchitectures: ["arm64"] }],
        },
        workloads: [
          {
            id: "fcp_8k_prores",
            name: "8K ProRes RAW Timeline & Magnetic Mask AI",
            typical: { ramGb: 16.0, cpu: 40, gpu: 70, vramGb: 12.0 },
            peak: { ramGb: 28.0, cpu: 80, gpu: 95, vramGb: 20.0 },
          },
        ],
        sourceRecords: [{ publisher: "Apple", url: "https://www.apple.com/final-cut-pro/specs/", retrievedAt: "2026-02-10", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 14. Unity 6
  {
    software: {
      id: "unity",
      name: "Unity 6",
      slug: "unity",
      category: "Game Development",
      developer: "Unity Technologies",
      iconUrl: "/icons/unity.svg",
      description: "Real-time 2D/3D development platform for games, VR/AR, and interactive experiences.",
      isVerified: true,
      aliases: ["Unity", "Unity 6", "Unity Engine"],
    },
    versions: [
      {
        id: "ver_unity_6",
        softwareId: "unity",
        version: "6.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 55, minimumCores: 6 },
          gpu: { minimumPerformanceScore: 55, minimumVramGb: 4, supportsDirectX12: true, supportsVulkan: true, supportsMetal: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          storage: { installGb: 40, scratchDiskGb: 80, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "unity_hdrp_build",
            name: "HDRP Real-Time Scene & C# Script Compilation",
            typical: { ramGb: 14.0, cpu: 60, gpu: 65, vramGb: 5.0 },
            peak: { ramGb: 26.0, cpu: 95, gpu: 85, vramGb: 8.0 },
          },
        ],
        sourceRecords: [{ publisher: "Unity", url: "https://docs.unity3d.com/6000.0/Documentation/Manual/system-requirements.html", retrievedAt: "2026-01-20", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 15. Autodesk Maya 2025
  {
    software: {
      id: "autodesk-maya",
      name: "Autodesk Maya 2025",
      slug: "autodesk-maya",
      category: "3D",
      developer: "Autodesk",
      iconUrl: "/icons/maya.svg",
      description: "3D animation, modeling, simulation, and rendering software with Arnold raytracing engine.",
      isVerified: true,
      aliases: ["Maya", "Autodesk Maya", "Maya 2025"],
    },
    versions: [
      {
        id: "ver_maya_2025",
        softwareId: "autodesk-maya",
        version: "2025.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 65, minimumCores: 8 },
          gpu: { minimumPerformanceScore: 65, minimumVramGb: 6, supportsDirectX12: true, supportsMetal: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 20, scratchDiskGb: 100, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "maya_arnold_render",
            name: "Arnold CPU/GPU Production Rendering & Character Rigging",
            typical: { ramGb: 18.0, cpu: 75, gpu: 70, vramGb: 6.0 },
            peak: { ramGb: 36.0, cpu: 100, gpu: 95, vramGb: 12.0 },
          },
        ],
        sourceRecords: [{ publisher: "Autodesk", url: "https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/System-requirements-for-Autodesk-Maya-2025.html", retrievedAt: "2026-01-25", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 16. Maxon Cinema 4D 2025
  {
    software: {
      id: "cinema-4d",
      name: "Maxon Cinema 4D 2025",
      slug: "cinema-4d",
      category: "3D",
      developer: "Maxon",
      iconUrl: "/icons/c4d.svg",
      description: "Professional 3D modeling, animation, simulation, and Redshift rendering suite for motion designers.",
      isVerified: true,
      aliases: ["Cinema 4D", "C4D", "C4D 2025"],
    },
    versions: [
      {
        id: "ver_c4d_2025",
        softwareId: "cinema-4d",
        version: "2025.1",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 65, minimumCores: 8 },
          gpu: { minimumPerformanceScore: 70, minimumVramGb: 8, supportsCuda: true, supportsMetal: true, supportsDirectX12: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 20, scratchDiskGb: 80, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }],
        },
        workloads: [
          {
            id: "c4d_redshift",
            name: "Redshift GPU Raytracing & Pyro Particle Simulation",
            typical: { ramGb: 20.0, cpu: 65, gpu: 85, vramGb: 8.0 },
            peak: { ramGb: 38.0, cpu: 95, gpu: 99, vramGb: 14.0 },
          },
        ],
        sourceRecords: [{ publisher: "Maxon", url: "https://www.maxon.net/en/requirements/cinema-4d-2025-requirements", retrievedAt: "2026-01-18", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 17. Godot Engine
  {
    software: {
      id: "godot",
      name: "Godot Engine 4.3",
      slug: "godot",
      category: "Game Development",
      developer: "Godot Foundation",
      iconUrl: "/icons/godot.svg",
      description: "Lightweight, cross-platform 2D and 3D game engine with Vulkan and GDExtension.",
      isVerified: true,
      aliases: ["Godot", "Godot 4", "Godot Engine"],
    },
    versions: [
      {
        id: "ver_godot_43",
        softwareId: "godot",
        version: "4.3",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 40, minimumCores: 4 },
          gpu: { minimumPerformanceScore: 35, minimumVramGb: 2, supportsVulkan: true },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          storage: { installGb: 5, scratchDiskGb: 20, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "godot_vulkan_dev",
            name: "2D/3D Scene Testing & GDScript Execution",
            typical: { ramGb: 4.5, cpu: 30, gpu: 40, vramGb: 2.0 },
            peak: { ramGb: 8.5, cpu: 70, gpu: 70, vramGb: 4.0 },
          },
        ],
        sourceRecords: [{ publisher: "Godot", url: "https://godotengine.org/download/", retrievedAt: "2026-02-01", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 18. Visual Studio Code
  {
    software: {
      id: "vs-code",
      name: "Visual Studio Code",
      slug: "vs-code",
      category: "Development",
      developer: "Microsoft",
      iconUrl: "/icons/vscode.svg",
      description: "Extensible code editor with language servers, Git integration, TypeScript and debugging.",
      isVerified: true,
      aliases: ["VSCode", "VS Code", "Code"],
    },
    versions: [
      {
        id: "ver_vscode_190",
        softwareId: "vs-code",
        version: "1.92",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 35, minimumCores: 4 },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          professionalRamGb: 32,
          storage: { installGb: 5, scratchDiskGb: 20, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "vscode_monorepo",
            name: "Heavy Monorepo + TypeScript LSP + Rust Analyzer",
            typical: { ramGb: 4.0, cpu: 25, gpu: 10, vramGb: 0.5 },
            peak: { ramGb: 10.0, cpu: 65, gpu: 20, vramGb: 1.5 },
          },
        ],
        sourceRecords: [{ publisher: "Microsoft", url: "https://code.visualstudio.com/docs/supporting/requirements", retrievedAt: "2026-01-10", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 19. JetBrains IntelliJ IDEA Ultimate
  {
    software: {
      id: "intellij-idea",
      name: "IntelliJ IDEA Ultimate 2024",
      slug: "intellij-idea",
      category: "IDE",
      developer: "JetBrains",
      iconUrl: "/icons/intellij.svg",
      description: "Leading enterprise IDE for Java, Kotlin, Scala, Spring, and full-stack backend development.",
      isVerified: true,
      aliases: ["IntelliJ", "IntelliJ IDEA", "IDEA"],
    },
    versions: [
      {
        id: "ver_intellij_2024",
        softwareId: "intellij-idea",
        version: "2024.2",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 50, minimumCores: 6 },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          professionalRamGb: 32,
          storage: { installGb: 15, scratchDiskGb: 40, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "intellij_maven_index",
            name: "Enterprise Spring Boot Build & Background Indexing",
            typical: { ramGb: 8.0, cpu: 50, gpu: 15, vramGb: 1.0 },
            peak: { ramGb: 16.0, cpu: 95, gpu: 25, vramGb: 2.0 },
          },
        ],
        sourceRecords: [{ publisher: "JetBrains", url: "https://www.jetbrains.com/help/idea/installation-guide.html#requirements", retrievedAt: "2026-01-12", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 20. Apple Xcode
  {
    software: {
      id: "xcode",
      name: "Apple Xcode 16",
      slug: "xcode",
      category: "IDE",
      developer: "Apple",
      iconUrl: "/icons/xcode.svg",
      description: "Integrated development environment for iOS, iPadOS, macOS, watchOS, and visionOS apps.",
      isVerified: true,
      aliases: ["Xcode", "Xcode 16", "Apple Xcode"],
    },
    versions: [
      {
        id: "ver_xcode_16",
        softwareId: "xcode",
        version: "16.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "macos", minimumVersion: "14.5", supportedArchitectures: ["arm64"] }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 60, minimumCores: 8, architectures: ["arm64"] },
          gpu: { minimumPerformanceScore: 50, minimumVramGb: 4, supportsMetal: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 40, scratchDiskGb: 100, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "macos", supportedArchitectures: ["arm64"] }],
        },
        workloads: [
          {
            id: "xcode_swift_build",
            name: "Swift 6 Concurrency Compilation + SwiftUI Live Previews",
            typical: { ramGb: 14.0, cpu: 70, gpu: 40, vramGb: 4.0 },
            peak: { ramGb: 28.0, cpu: 100, gpu: 65, vramGb: 8.0 },
          },
        ],
        sourceRecords: [{ publisher: "Apple", url: "https://developer.apple.com/xcode/resources/", retrievedAt: "2026-02-15", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 21. Figma Desktop
  {
    software: {
      id: "figma-desktop",
      name: "Figma Desktop",
      slug: "figma-desktop",
      category: "Design",
      developer: "Figma",
      iconUrl: "/icons/figma.svg",
      description: "Collaborative interface design, interactive prototyping, and design systems platform.",
      isVerified: true,
      aliases: ["Figma", "Figma App"],
    },
    versions: [
      {
        id: "ver_figma_120",
        softwareId: "figma-desktop",
        version: "120.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 40, minimumCores: 4 },
          gpu: { minimumPerformanceScore: 35, minimumVramGb: 2, supportsDirectX12: true, supportsMetal: true },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          professionalRamGb: 32,
          storage: { installGb: 5, scratchDiskGb: 20, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }],
        },
        workloads: [
          {
            id: "figma_heavy_design_system",
            name: "Complex 500+ Screen Design System & Vector Canvases",
            typical: { ramGb: 6.0, cpu: 30, gpu: 40, vramGb: 2.0 },
            peak: { ramGb: 12.0, cpu: 75, gpu: 65, vramGb: 4.0 },
          },
        ],
        sourceRecords: [{ publisher: "Figma", url: "https://help.figma.com/hc/en-us/articles/360039827194-Figma-browser-and-system-requirements", retrievedAt: "2026-01-05", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 22. Autodesk AutoCAD 2025
  {
    software: {
      id: "autocad",
      name: "Autodesk AutoCAD 2025",
      slug: "autocad",
      category: "Engineering",
      developer: "Autodesk",
      iconUrl: "/icons/autocad.svg",
      description: "Computer-aided design (CAD) software for precision 2D drafting and 3D architectural modeling.",
      isVerified: true,
      aliases: ["AutoCAD", "CAD", "AutoCAD 2025"],
    },
    versions: [
      {
        id: "ver_autocad_2025",
        softwareId: "autocad",
        version: "2025.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 55, minimumCores: 6 },
          gpu: { minimumPerformanceScore: 50, minimumVramGb: 4, supportsDirectX12: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          storage: { installGb: 20, scratchDiskGb: 50, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }],
        },
        workloads: [
          {
            id: "autocad_3d_dwg",
            name: "Large 3D Architectural Plans & Shaded Viewport",
            typical: { ramGb: 10.0, cpu: 45, gpu: 50, vramGb: 3.5 },
            peak: { ramGb: 20.0, cpu: 85, gpu: 75, vramGb: 6.0 },
          },
        ],
        sourceRecords: [{ publisher: "Autodesk", url: "https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/System-requirements-for-AutoCAD-2025-including-Specialized-Toolsets.html", retrievedAt: "2026-01-20", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 23. Dassault Systèmes SOLIDWORKS 2024
  {
    software: {
      id: "solidworks",
      name: "Dassault SOLIDWORKS 2024",
      slug: "solidworks",
      category: "Engineering",
      developer: "Dassault Systèmes",
      iconUrl: "/icons/solidworks.svg",
      description: "Parametric 3D CAD modeling, mechanical assembly design, and stress simulation.",
      isVerified: true,
      aliases: ["SOLIDWORKS", "SolidWorks", "SW 2024"],
    },
    versions: [
      {
        id: "ver_sw_2024",
        softwareId: "solidworks",
        version: "2024 SP2",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows", minimumVersion: "11", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 65, minimumCores: 8 },
          gpu: { minimumPerformanceScore: 60, minimumVramGb: 6, supportsDirectX12: true, requiresDedicatedGpu: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 30, scratchDiskGb: 80, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
        },
        workloads: [
          {
            id: "sw_assembly_sim",
            name: "1,000+ Component Mechanical Assembly & FEA Stress Mesh",
            typical: { ramGb: 16.0, cpu: 65, gpu: 60, vramGb: 5.0 },
            peak: { ramGb: 32.0, cpu: 95, gpu: 85, vramGb: 8.0 },
          },
        ],
        sourceRecords: [{ publisher: "Dassault", url: "https://www.solidworks.com/support/system-requirements", retrievedAt: "2026-01-14", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 24. MathWorks MATLAB R2024b
  {
    software: {
      id: "matlab",
      name: "MathWorks MATLAB R2024b",
      slug: "matlab",
      category: "Engineering",
      developer: "MathWorks",
      iconUrl: "/icons/matlab.svg",
      description: "High-level numeric computing, algorithm development, matrix computation, and Simulink.",
      isVerified: true,
      aliases: ["MATLAB", "Simulink", "MathWorks"],
    },
    versions: [
      {
        id: "ver_matlab_2024b",
        softwareId: "matlab",
        version: "R2024b",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 55, minimumCores: 6, requiredCapabilities: { avx2: true } },
          gpu: { minimumPerformanceScore: 45, minimumVramGb: 4, supportsCuda: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 30, scratchDiskGb: 60, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "matlab_matrix_sim",
            name: "Simulink Dynamic Model & Parallel Matrix Eigenvalues",
            typical: { ramGb: 14.0, cpu: 70, gpu: 40, vramGb: 4.0 },
            peak: { ramGb: 30.0, cpu: 100, gpu: 70, vramGb: 8.0 },
          },
        ],
        sourceRecords: [{ publisher: "MathWorks", url: "https://www.mathworks.com/support/requirements/matlab-system-requirements.html", retrievedAt: "2026-02-05", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 25. Cyberpunk 2077
  {
    software: {
      id: "cyberpunk-2077",
      name: "Cyberpunk 2077: Phantom Liberty",
      slug: "cyberpunk-2077",
      category: "Gaming",
      developer: "CD PROJEKT RED",
      iconUrl: "/icons/cyberpunk.svg",
      description: "Open-world action RPG featuring full Path Tracing (Overdrive Mode), DLSS 3.5, and heavy CPU city streaming.",
      isVerified: true,
      aliases: ["Cyberpunk", "Cyberpunk 2077", "CP2077"],
    },
    versions: [
      {
        id: "ver_cp2077_21",
        softwareId: "cyberpunk-2077",
        version: "2.13",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows", minimumVersion: "10 64-bit", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 65, minimumCores: 8 },
          gpu: { minimumPerformanceScore: 75, minimumVramGb: 8, supportsDirectX12: true, requiresDedicatedGpu: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          storage: { installGb: 90, scratchDiskGb: 30, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }],
        },
        workloads: [
          {
            id: "cp2077_pathtracing_4k",
            name: "1440p / 4K Ray Tracing Overdrive Gameplay",
            typical: { ramGb: 14.0, cpu: 70, gpu: 95, vramGb: 10.0 },
            peak: { ramGb: 20.0, cpu: 90, gpu: 99, vramGb: 14.0 },
          },
        ],
        sourceRecords: [{ publisher: "CD PROJEKT RED", url: "https://support.cdprojektred.com/en/cyberpunk/pc/sp-technical/issue/1556/cyberpunk-2077-system-requirements", retrievedAt: "2026-01-20", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 26. Black Myth: Wukong
  {
    software: {
      id: "black-myth-wukong",
      name: "Black Myth: Wukong",
      slug: "black-myth-wukong",
      category: "Gaming",
      developer: "Game Science",
      iconUrl: "/icons/wukong.svg",
      description: "Action RPG based on Chinese mythology, built on Unreal Engine 5 with Full Ray Tracing.",
      isVerified: true,
      aliases: ["Wukong", "Black Myth", "BMW"],
    },
    versions: [
      {
        id: "ver_wukong_10",
        softwareId: "black-myth-wukong",
        version: "1.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows", minimumVersion: "10 64-bit", supportedArchitectures: ["x86_64"] }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 65, minimumCores: 8 },
          gpu: { minimumPerformanceScore: 75, minimumVramGb: 8, supportsDirectX12: true, requiresDedicatedGpu: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          storage: { installGb: 130, scratchDiskGb: 30, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }],
        },
        workloads: [
          {
            id: "wukong_ue5_rt",
            name: "UE5 Full Ray Tracing & Frame Generation",
            typical: { ramGb: 14.0, cpu: 65, gpu: 95, vramGb: 9.5 },
            peak: { ramGb: 22.0, cpu: 85, gpu: 99, vramGb: 13.0 },
          },
        ],
        sourceRecords: [{ publisher: "Game Science", url: "https://store.steampowered.com/app/2358720/Black_Myth_Wukong/", retrievedAt: "2026-01-22", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 27. Ableton Live 12
  {
    software: {
      id: "ableton-live",
      name: "Ableton Live 12 Suite",
      slug: "ableton-live",
      category: "Audio",
      developer: "Ableton",
      iconUrl: "/icons/ableton.svg",
      description: "Fast, fluid digital audio workstation (DAW) for music production, sound design, and live performance.",
      isVerified: true,
      aliases: ["Ableton", "Ableton Live", "Live 12"],
    },
    versions: [
      {
        id: "ver_ableton_12",
        softwareId: "ableton-live",
        version: "12.0",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 55, minimumCores: 6, requiredCapabilities: { avx2: true } },
          gpu: { minimumPerformanceScore: 30, minimumVramGb: 2, supportsDirectX12: true, supportsMetal: true },
          minimumRamGb: 16,
          recommendedRamGb: 32,
          professionalRamGb: 64,
          storage: { installGb: 80, scratchDiskGb: 100, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }],
        },
        workloads: [
          {
            id: "ableton_80_track",
            name: "80+ Track Production + Kontakt Sample Libraries + Ozone VSTs",
            typical: { ramGb: 18.0, cpu: 60, gpu: 25, vramGb: 2.0 },
            peak: { ramGb: 36.0, cpu: 95, gpu: 40, vramGb: 4.0 },
          },
        ],
        sourceRecords: [{ publisher: "Ableton", url: "https://help.ableton.com/hc/en-us/articles/115001663084-Live-Minimum-System-Requirements", retrievedAt: "2026-01-10", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 28. OBS Studio
  {
    software: {
      id: "obs-studio",
      name: "OBS Studio 30",
      slug: "obs-studio",
      category: "Streaming",
      developer: "OBS Project",
      iconUrl: "/icons/obs.svg",
      description: "Free, open-source software for video recording and live streaming with NVENC, AV1, and QuickSync hardware encoding.",
      isVerified: true,
      aliases: ["OBS", "OBS Studio", "Open Broadcaster Software"],
    },
    versions: [
      {
        id: "ver_obs_30",
        softwareId: "obs-studio",
        version: "30.2",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 45, minimumCores: 6 },
          gpu: { minimumPerformanceScore: 50, minimumVramGb: 4, supportsDirectX12: true, supportsMetal: true },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          storage: { installGb: 5, scratchDiskGb: 50, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "obs_4k_stream",
            name: "4K 60FPS NVENC / AV1 Live Stream + Overlay Compositing",
            typical: { ramGb: 4.5, cpu: 30, gpu: 35, vramGb: 2.5 },
            peak: { ramGb: 8.0, cpu: 65, gpu: 55, vramGb: 4.5 },
          },
        ],
        sourceRecords: [{ publisher: "OBS Project", url: "https://obsproject.com/wiki/System-Requirements", retrievedAt: "2026-01-15", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 29. Microsoft Excel (Heavy Datasets)
  {
    software: {
      id: "microsoft-excel",
      name: "Microsoft Excel 2024",
      slug: "microsoft-excel",
      category: "Productivity",
      developer: "Microsoft",
      iconUrl: "/icons/excel.svg",
      description: "Industry-standard spreadsheet and data analysis platform handling million-row Power Query and VBA models.",
      isVerified: true,
      aliases: ["Excel", "Microsoft Excel", "Office Excel"],
    },
    versions: [
      {
        id: "ver_excel_2024",
        softwareId: "microsoft-excel",
        version: "2024 (Build 17830)",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 40, minimumCores: 4 },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          professionalRamGb: 32,
          storage: { installGb: 10, scratchDiskGb: 20, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }],
        },
        workloads: [
          {
            id: "excel_1m_rows",
            name: "1,000,000 Row Power Query Data Model & Multi-Thread Calculation",
            typical: { ramGb: 6.0, cpu: 35, gpu: 10, vramGb: 0.5 },
            peak: { ramGb: 18.0, cpu: 85, gpu: 20, vramGb: 1.5 },
          },
        ],
        sourceRecords: [{ publisher: "Microsoft", url: "https://www.microsoft.com/en-us/microsoft-365/microsoft-365-and-office-resources", retrievedAt: "2026-01-10", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },

  // 30. Slack Desktop
  {
    software: {
      id: "slack",
      name: "Slack Desktop",
      slug: "slack",
      category: "Productivity",
      developer: "Salesforce",
      iconUrl: "/icons/slack.svg",
      description: "Team collaboration, messaging, file sharing, and audio/video Huddles platform.",
      isVerified: true,
      aliases: ["Slack", "Slack App"],
    },
    versions: [
      {
        id: "ver_slack_438",
        softwareId: "slack",
        version: "4.38.125",
        releaseYear: 2024,
        isLatest: true,
        dataQuality: "VERIFIED",
        supportedOperatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        minimumRequirements: {
          cpu: { minimumPerformanceScore: 30, minimumCores: 4 },
          minimumRamGb: 8,
          recommendedRamGb: 16,
          storage: { installGb: 3, scratchDiskGb: 10, preferredType: "NVME_SSD" },
          operatingSystems: [{ family: "windows" }, { family: "macos" }, { family: "linux" }],
        },
        workloads: [
          {
            id: "slack_multi_workspace",
            name: "5 Active Workspaces + Screen Sharing Huddle",
            typical: { ramGb: 2.5, cpu: 15, gpu: 15, vramGb: 0.5 },
            peak: { ramGb: 5.5, cpu: 45, gpu: 35, vramGb: 1.2 },
          },
        ],
        sourceRecords: [{ publisher: "Slack", url: "https://slack.com/help/articles/115002037526-System-requirements-for-using-Slack", retrievedAt: "2026-01-08", kind: "OFFICIAL_REQUIREMENT" }],
      },
    ],
  },
];

export const SOFTWARE_VERSIONS: SoftwareVersion[] = CANONICAL_SOFTWARE_CATALOG.flatMap(c => c.versions);
export const SOFTWARE_CATALOG = CANONICAL_SOFTWARE_CATALOG;

