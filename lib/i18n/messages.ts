export const MESSAGES: Record<string, string> = {
  // Hard Incompatibilities
  "os.unsupported": "{software} does not support {osFamily} {version}.",
  "os.architecture_mismatch": "{software} requires {requiredArch} architecture, but your system is running on {actualArch}.",
  "gpu.cuda_missing": "{software} specifically requires NVIDIA CUDA acceleration, which is not available on {gpuModel}.",
  "gpu.metal_missing": "{software} requires Apple Metal graphics API.",
  "gpu.directx_missing": "{software} requires DirectX 12 feature support.",
  "virtualization.unsupported": "{software} relies on hardware virtualization, but CPU virtualization support was not detected.",
  "virtualization.disabled": "Virtualization is supported by your CPU but appears disabled in system firmware/BIOS.",
  "storage.insufficient_install": "Total available storage space is less than the {requiredGb}GB minimum installation requirement for {software}.",

  // RAM & Concurrency
  "ram.pass_professional": "System has ample memory ({totalGb}GB) providing extensive headroom for heavy concurrent workloads.",
  "ram.pass_recommended": "System memory ({totalGb}GB) comfortably meets recommended targets for the active workload profile.",
  "ram.pass_minimum": "System memory ({totalGb}GB) meets individual baseline requirements, but multi-app concurrency will operate near capacity.",
  "ram.borderline_concurrency": "Running {apps} simultaneously requires ~{requiredGb}GB. Your {totalGb}GB RAM will experience heavy paging / swap pressure.",
  "ram.fail_deficit": "Selected workloads require ~{requiredGb}GB RAM ({headroomGb}GB headroom included). System only has {totalGb}GB.",
  "ram.unified_memory_contention": "Apple Unified Memory ({totalGb}GB) is shared dynamically between CPU and GPU workloads. High GPU load may constrain active RAM.",

  // CPU
  "cpu.pass_professional": "{cpuModel} provides outstanding compute performance for multi-threaded and compile tasks.",
  "cpu.pass_recommended": "{cpuModel} provides strong single-core and multi-core throughput for smooth operation.",
  "cpu.pass_minimum": "{cpuModel} meets basic performance criteria, though exports and intensive tasks may take longer.",
  "cpu.fail_weak": "{cpuModel} (Score: {score}) falls below the recommended compute class ({requiredScore}) for this workload.",
  "cpu.laptop_thermal_notice": "Laptop CPUs may throttle sustained multi-minute renders depending on chassis cooling and TDP profiles.",

  // GPU & VRAM
  "gpu.pass_dedicated": "{gpuModel} with {vramGb}GB VRAM meets recommended graphics and 3D acceleration requirements.",
  "gpu.pass_integrated": "Integrated graphics ({gpuModel}) is sufficient for basic 2D and UI tasks, but may bottleneck 3D or video rendering.",
  "gpu.fail_vram_deficit": "Workload requires at least {requiredVram}GB VRAM for stable viewport/timeline performance. GPU only has {vramGb}GB.",
  "gpu.fail_score_low": "GPU compute power ({gpuModel}) is below the recommended threshold for hardware-accelerated filters.",

  // Storage
  "storage.nvme_optimal": "Fast NVMe SSD detected. Workspace caches and application launches will be instantaneous.",
  "storage.sata_pass": "SATA SSD detected. Provides reliable throughput for standard working scratch space.",
  "storage.hdd_warning": "Mechanical HDD detected. Heavy disk scratch and project asset loading will experience notable latency.",
  "storage.free_space_warning": "Free storage ({freeGb}GB) is low. Large cache and temporary render files require additional free space.",

  // Upgrades
  "upgrade.ram.title": "Upgrade Memory to {targetGb}GB",
  "upgrade.ram.reason": "Adding RAM will eliminate swap file paging and allow full multitasking between {apps}.",
  "upgrade.storage.title": "Upgrade System Drive to Fast NVMe SSD",
  "upgrade.storage.reason": "Upgrading from mechanical/SATA disk to NVMe drastically improves timeline scrubbing and project load times.",
  "upgrade.gpu.title": "Upgrade to Dedicated GPU ({targetVram}GB+ VRAM)",
  "upgrade.gpu.reason": "A dedicated GPU will unlock hardware encoding, AI filters, and smooth real-time 3D viewport rendering.",
};

export function formatMessage(key: string, data?: Record<string, string | number | boolean>): string {
  let template = MESSAGES[key] || key;
  if (!data) return template;

  for (const [k, v] of Object.entries(data)) {
    template = template.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return template;
}
