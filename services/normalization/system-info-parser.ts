import { normalizeCpuQuery, normalizeGpuQuery } from "./hardware-normalizer";
import { Cpu, Gpu, HardwareProfile } from "../../lib/domain/hardware";

export interface ParsedSystemInfoResult {
  detectedHardware: Partial<HardwareProfile>;
  rawExtracted: {
    cpuText?: string;
    gpuText?: string;
    memoryText?: string;
    osText?: string;
    storageText?: string;
  };
  detectedDumpType: "DXDIAG" | "MSINFO32" | "MACOS_SYSTEM_PROFILER" | "GENERIC_TEXT";
  confidence: number;
  unresolvedFields: string[];
}

export function parseSystemInfoDump(
  rawText: string,
  cpuCatalog: Cpu[],
  gpuCatalog: Gpu[]
): ParsedSystemInfoResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  let dumpType: "DXDIAG" | "MSINFO32" | "MACOS_SYSTEM_PROFILER" | "GENERIC_TEXT" = "GENERIC_TEXT";
  if (text.includes("System Information") && text.includes("Operating System:") && text.includes("Processor:")) {
    dumpType = "DXDIAG";
  } else if (text.includes("OS Name") && text.includes("Processor") && text.includes("Total Physical Memory")) {
    dumpType = "MSINFO32";
  } else if (text.includes("Hardware Overview:") || text.includes("Chip:") || text.includes("Model Name:")) {
    dumpType = "MACOS_SYSTEM_PROFILER";
  }

  let cpuText: string | undefined;
  let gpuText: string | undefined;
  let memoryText: string | undefined;
  let osText: string | undefined;

  // 1. Extract CPU
  const cpuMatchDxdiag = text.match(/Processor:\s*([^\r\n]+)/i);
  const cpuMatchMsinfo = text.match(/Processor\s+([^\r\n]+)/i);
  const cpuMatchMac = text.match(/(?:Chip|Processor Name):\s*([^\r\n]+)/i);
  cpuText = cpuMatchDxdiag?.[1]?.trim() || cpuMatchMsinfo?.[1]?.trim() || cpuMatchMac?.[1]?.trim();

  if (!cpuText) {
    const genericCpu = text.match(/(?:Intel|AMD|Apple|Qualcomm|Ryzen|Core\s*i[3579])[\w\d\s\-\.]+/i);
    if (genericCpu) cpuText = genericCpu[0].trim();
  }

  // 2. Extract GPU / Card name
  const gpuMatchDxdiag = text.match(/Card name:\s*([^\r\n]+)/i);
  const gpuMatchMsinfo = text.match(/Name\s+(NVIDIA[^\r\n]+|AMD[^\r\n]+|Intel[^\r\n]+Arc[^\r\n]+)/i);
  const gpuMatchMac = text.match(/Chipset Model:\s*([^\r\n]+)/i);
  gpuText = gpuMatchDxdiag?.[1]?.trim() || gpuMatchMsinfo?.[1]?.trim() || gpuMatchMac?.[1]?.trim();

  if (!gpuText) {
    const genericGpu = text.match(/(?:NVIDIA\s*GeForce|RTX|GTX|AMD\s*Radeon|Radeon\s*RX)\s*[\w\d\s\-\.]+/i);
    if (genericGpu) gpuText = genericGpu[0].trim();
  }

  // 3. Extract Memory (RAM)
  let ramGb = 16;
  const memMatchDxdiag = text.match(/Memory:\s*(\d+)\s*MB\s*RAM/i);
  const memMatchMsinfo = text.match(/Total Physical Memory\s+([\d\.]+)\s*(?:GB|MB)/i);
  const memMatchMac = text.match(/Memory:\s*(\d+)\s*GB/i);

  if (memMatchDxdiag) {
    const mb = parseInt(memMatchDxdiag[1], 10);
    ramGb = Math.round(mb / 1024);
    memoryText = `${ramGb} GB RAM`;
  } else if (memMatchMsinfo) {
    const num = parseFloat(memMatchMsinfo[1]);
    ramGb = Math.round(num);
    memoryText = `${ramGb} GB`;
  } else if (memMatchMac) {
    ramGb = parseInt(memMatchMac[1], 10);
    memoryText = `${ramGb} GB`;
  } else {
    const genericRam = text.match(/(\d+)\s*GB\s*(?:RAM|Memory)/i);
    if (genericRam) {
      ramGb = parseInt(genericRam[1], 10);
      memoryText = `${ramGb} GB`;
    }
  }

  // 4. Extract OS
  let osFamily: "windows" | "macos" | "linux" = "windows";
  if (lower.includes("mac os") || lower.includes("macos") || lower.includes("darwin") || dumpType === "MACOS_SYSTEM_PROFILER") {
    osFamily = "macos";
    osText = "macOS";
  } else if (lower.includes("linux") || lower.includes("ubuntu")) {
    osFamily = "linux";
    osText = "Linux";
  } else {
    osFamily = "windows";
    osText = "Windows";
  }

  // Normalize CPU & GPU against catalog
  const normalizedCpu = cpuText ? normalizeCpuQuery(cpuText, cpuCatalog) : undefined;
  const normalizedGpu = gpuText ? normalizeGpuQuery(gpuText, gpuCatalog) : undefined;

  const unresolvedFields: string[] = [];
  if (!normalizedCpu || normalizedCpu.status === "NOT_FOUND" || normalizedCpu.status === "AMBIGUOUS") {
    unresolvedFields.push("cpu");
  }
  if (gpuText && normalizedGpu && (normalizedGpu.status === "NOT_FOUND" || normalizedGpu.status === "AMBIGUOUS")) {
    unresolvedFields.push("gpu");
  }

  const detectedHardware: Partial<HardwareProfile> = {
    cpu: {
      model: normalizedCpu?.canonicalEntity?.model || cpuText || "Unknown CPU",
      architecture: normalizedCpu?.canonicalEntity?.architecture || (osFamily === "macos" && cpuText?.includes("M") ? "arm64" : "x86_64"),
      physicalCores: normalizedCpu?.canonicalEntity?.physicalCores || 8,
      performanceScore: normalizedCpu?.canonicalEntity?.performanceScore || 60,
      laptopVariant: normalizedCpu?.canonicalEntity?.laptopVariant,
      isVerified: normalizedCpu?.status === "EXACT" || normalizedCpu?.status === "HIGH_CONFIDENCE",
    },
    gpu: normalizedGpu?.canonicalEntity ? {
      model: normalizedGpu.canonicalEntity.model,
      type: normalizedGpu.canonicalEntity.type,
      performanceScore: normalizedGpu.canonicalEntity.performanceScore,
      vramGb: normalizedGpu.canonicalEntity.vramGb,
      supportsCuda: normalizedGpu.canonicalEntity.supportsCuda,
      supportsDirectX12: normalizedGpu.canonicalEntity.supportsDirectX12,
      isVerified: true,
    } : (gpuText ? {
      model: gpuText,
      type: "dedicated",
      performanceScore: 50,
      vramGb: 4,
      isVerified: false,
    } : undefined),
    ram: {
      totalGb: ramGb,
    },
    storage: [
      { type: "NVME_SSD", totalGb: 512, freeGb: 200 },
    ],
    os: {
      family: osFamily,
      architecture: osFamily === "macos" && cpuText?.includes("M") ? "arm64" : "x86_64",
    },
    architecture: osFamily === "macos" && cpuText?.includes("M") ? "arm64" : "x86_64",
    deviceType: dumpType === "MACOS_SYSTEM_PROFILER" && lower.includes("book") ? "laptop" : (lower.includes("laptop") ? "laptop" : "desktop"),
    supportsVirtualization: true,
  };

  const confidence = unresolvedFields.length === 0 ? 0.95 : (unresolvedFields.length === 1 ? 0.75 : 0.50);

  return {
    detectedHardware,
    rawExtracted: {
      cpuText,
      gpuText,
      memoryText,
      osText,
    },
    detectedDumpType: dumpType,
    confidence,
    unresolvedFields,
  };
}
