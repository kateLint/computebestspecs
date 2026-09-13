import { CompatibilityResult } from "../../lib/domain/compatibility";
import { HardwareProfile } from "../../lib/domain/hardware";
import { SelectedWorkload } from "../../lib/domain/software";

export interface TextCompatibilityReport {
  title: string;
  generatedAt: string;
  reportText: string;
}

export interface CsvCompatibilityRow {
  computerName: string;
  cpuModel: string;
  gpuModel: string;
  ramGb: number;
  osFamily: string;
  softwareStack: string;
  compatibilityStatus: string;
  performanceTier: string;
  score: number;
  primaryBottleneck: string;
  recommendedUpgrade: string;
  confidence: number;
}

export class ExportService {
  /**
   * Generates a clean, professional ASCII/Text Compatibility Report suitable for display or PDF rendering.
   */
  generateTextReport(
    result: CompatibilityResult,
    hardware: HardwareProfile,
    workloads: SelectedWorkload[]
  ): TextCompatibilityReport {
    const appsList = workloads.map(w => `• ${w.softwareName} (${w.workloadName} — ${w.intensity})`).join("\n");
    const primaryBottleneck = result.bottlenecks[0]?.component?.toUpperCase() || "NONE DETECTED";
    const upgrade = result.upgradeRecommendations[0]
      ? `${result.upgradeRecommendations[0].from} → ${result.upgradeRecommendations[0].to} (+${result.upgradeRecommendations[0].simulationDelta?.deltaScore || 0} pts)`
      : "No urgent upgrade required";

    const reportText = `
================================================================================
                       COMPUTER COMPATIBILITY REPORT
================================================================================

MACHINE SPECIFICATION
--------------------------------------------------------------------------------
CPU:        ${hardware.cpu.model} (${hardware.cpu.physicalCores || "?"} Cores)
GPU:        ${hardware.gpu?.model || "Integrated Graphics"} (${hardware.gpu?.vramGb || 0}GB VRAM)
RAM:        ${hardware.ram.totalGb}GB
Storage:    ${hardware.storage[0]?.totalGb || 512}GB ${hardware.storage[0]?.type || "NVMe SSD"}
OS:         ${hardware.os.family.toUpperCase()} ${hardware.os.version || ""} (${hardware.architecture})
Device:     ${hardware.deviceType.toUpperCase()}

SELECTED WORKLOAD STACK
--------------------------------------------------------------------------------
${appsList}

EVALUATION SUMMARY
--------------------------------------------------------------------------------
Overall Status:    ${result.compatibilityStatus.toUpperCase()}
Performance Tier:  ${result.performanceTier.toUpperCase()}
Compatibility Score: ${result.score}/100
Confidence:        ${result.confidence}%

COMPONENT BREAKDOWN
--------------------------------------------------------------------------------
Processor (CPU):   ${result.components.cpu.performanceTier?.toUpperCase() || "PASS"} (${result.components.cpu.score}/100)
Memory (RAM):      ${result.components.memory.performanceTier?.toUpperCase() || "PASS"} (${result.components.memory.score}/100)
Graphics (GPU):    ${result.components.gpu.performanceTier?.toUpperCase() || "PASS"} (${result.components.gpu.score}/100)
Video Memory:      ${result.components.vram.performanceTier?.toUpperCase() || "PASS"} (${result.components.vram.score}/100)
Storage:           ${result.components.storage.performanceTier?.toUpperCase() || "PASS"} (${result.components.storage.score}/100)

PRIMARY BOTTLENECK
--------------------------------------------------------------------------------
Component:         ${primaryBottleneck}
Reason:            ${result.bottlenecks[0]?.reason || "Balanced configuration"}

RECOMMENDED UPGRADE
--------------------------------------------------------------------------------
${upgrade}

DATA PROVENANCE & ENGINE METADATA
--------------------------------------------------------------------------------
Engine Version:    ${result.meta.engineVersion}
Policy Version:    ${result.meta.policyVersion}
Dataset Revision:  ${result.meta.benchmarkDatasetVersion}
Fingerprint:       ${result.meta.evaluationFingerprint.substring(0, 16)}...
Generated At:      ${result.meta.evaluatedAt}
================================================================================
`.trim();

    return {
      title: `Compatibility Report - ${hardware.cpu.model}`,
      generatedAt: result.meta.evaluatedAt,
      reportText,
    };
  }

  /**
   * Generates standard CSV export for B2B fleet analysis (e.g. 100+ workstations).
   */
  generateCsvExport(rows: CsvCompatibilityRow[]): string {
    const headers = [
      "Computer Name",
      "CPU Model",
      "GPU Model",
      "RAM (GB)",
      "OS",
      "Software Stack",
      "Compatibility Status",
      "Performance Tier",
      "Score",
      "Primary Bottleneck",
      "Recommended Upgrade",
      "Confidence (%)",
    ];

    const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

    const lines = [
      headers.map(escapeCsv).join(","),
      ...rows.map(r => [
        escapeCsv(r.computerName),
        escapeCsv(r.cpuModel),
        escapeCsv(r.gpuModel),
        r.ramGb,
        escapeCsv(r.osFamily),
        escapeCsv(r.softwareStack),
        escapeCsv(r.compatibilityStatus),
        escapeCsv(r.performanceTier),
        r.score,
        escapeCsv(r.primaryBottleneck),
        escapeCsv(r.recommendedUpgrade),
        r.confidence,
      ].join(",")),
    ];

    return lines.join("\n");
  }

  /**
   * Generates clean JSON export.
   */
  generateJsonExport(result: CompatibilityResult, hardware: HardwareProfile, workloads: SelectedWorkload[]): string {
    return JSON.stringify({
      reportType: "COMPUTEBESTSPECS_EVALUATION_V1",
      evaluatedAt: result.meta.evaluatedAt,
      hardware,
      workloads,
      evaluation: result,
    }, null, 2);
  }
}

export const exportService = new ExportService();
