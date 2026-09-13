import { describe, it, expect } from "vitest";
import { formatProvenanceBadge } from "../../lib/domain/provenance";
import { parseSystemInfoDump } from "../../services/normalization/system-info-parser";
import { exportService, CsvCompatibilityRow } from "../../services/export/export-service";
import { can, UserContext } from "../../services/auth/entitlements";
import { evaluateCompatibility } from "../../services/compatibility/compatibility-engine";
import { Cpu, Gpu, HardwareProfile } from "../../lib/domain/hardware";
import { SoftwareVersion, SelectedWorkload } from "../../lib/domain/software";

describe("Product Trust, System Info Parsing & Export Suite", () => {
  const sampleCpus: Cpu[] = [
    { id: "cpu_i7_13700k", manufacturer: "Intel", model: "Intel Core i7-13700K", architecture: "x86_64", performanceScore: 92, aliases: ["13700K", "i7 13700K"] },
    { id: "cpu_m3_pro", manufacturer: "Apple", model: "Apple M3 Pro", architecture: "arm64", performanceScore: 88, aliases: ["M3 Pro", "Apple M3 Pro"] },
  ];

  const sampleGpus: Gpu[] = [
    { id: "gpu_rtx_4070", manufacturer: "NVIDIA", model: "NVIDIA GeForce RTX 4070", type: "dedicated", performanceScore: 88, vramGb: 12, supportsCuda: true, aliases: ["RTX 4070", "GeForce RTX 4070"] },
  ];

  it("1. Formats provenance badges clearly distinguishing official vendor docs vs benchmark vs estimates", () => {
    const officialBadge = formatProvenanceBadge("OFFICIAL_REQUIREMENT", "2026-08-28T00:00:00.000Z");
    expect(officialBadge.icon).toBe("✓");
    expect(officialBadge.label).toBe("Official requirement");
    expect(officialBadge.badgeClass).toContain("emerald");

    const benchmarkBadge = formatProvenanceBadge("BENCHMARK");
    expect(benchmarkBadge.icon).toBe("◉");
    expect(benchmarkBadge.label).toBe("Benchmark-derived");
    expect(benchmarkBadge.badgeClass).toContain("cyan");

    const estimateBadge = formatProvenanceBadge("WORKLOAD_ESTIMATE");
    expect(estimateBadge.icon).toBe("≈");
    expect(estimateBadge.label).toBe("Estimated workload");
    expect(estimateBadge.badgeClass).toContain("amber");
  });

  it("2. Parses dxdiag dump accurately", () => {
    const dxdiagDump = `
------------------
System Information
------------------
Operating System: Windows 11 Pro 64-bit (10.0, Build 22631)
Processor: 13th Gen Intel(R) Core(TM) i7-13700K (24 CPUs), ~3.4GHz
Memory: 32768MB RAM
Card name: NVIDIA GeForce RTX 4070
    `;

    const parsed = parseSystemInfoDump(dxdiagDump, sampleCpus, sampleGpus);

    expect(parsed.detectedDumpType).toBe("DXDIAG");
    expect(parsed.detectedHardware.ram?.totalGb).toBe(32);
    expect(parsed.detectedHardware.os?.family).toBe("windows");
    expect(parsed.detectedHardware.cpu?.model).toBe("Intel Core i7-13700K");
    expect(parsed.detectedHardware.gpu?.model).toBe("NVIDIA GeForce RTX 4070");
    expect(parsed.unresolvedFields.length).toBe(0);
  });

  it("3. Parses macOS system_profiler dump accurately", () => {
    const macDump = `
Hardware:

    Hardware Overview:

      Model Name: MacBook Pro
      Chip: Apple M3 Pro
      Total Number of Cores: 12 (6 performance and 6 efficiency)
      Memory: 36 GB
    `;

    const parsed = parseSystemInfoDump(macDump, sampleCpus, sampleGpus);

    expect(parsed.detectedDumpType).toBe("MACOS_SYSTEM_PROFILER");
    expect(parsed.detectedHardware.os?.family).toBe("macos");
    expect(parsed.detectedHardware.architecture).toBe("arm64");
    expect(parsed.detectedHardware.ram?.totalGb).toBe(36);
    expect(parsed.detectedHardware.deviceType).toBe("laptop");
  });

  it("4. Generates structured Text and CSV exports for single machine and fleet IT analysis", () => {
    const pc: HardwareProfile = {
      cpu: { model: "Intel Core i7-13700K", architecture: "x86_64", performanceScore: 92 },
      gpu: { model: "NVIDIA GeForce RTX 4070", type: "dedicated", performanceScore: 88, vramGb: 12 },
      ram: { totalGb: 32 },
      storage: [{ type: "NVME_SSD", totalGb: 1000, freeGb: 500 }],
      os: { family: "windows", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
    };

    const workloads: SelectedWorkload[] = [
      { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "v1", versionString: "2024", workloadId: "w1", workloadName: "Heavy Editing", intensity: "heavy", concurrency: "foreground" },
    ];

    const version: SoftwareVersion = {
      id: "v1", softwareId: "photoshop", version: "2024", isLatest: true,
      supportedOperatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }],
      minimumRequirements: { minimumRamGb: 8, recommendedRamGb: 16, storage: { installGb: 10 }, operatingSystems: [{ family: "windows", supportedArchitectures: ["x86_64"] }] },
      workloads: [{ id: "w1", softwareVersionId: "v1", name: "Heavy Editing", intensity: "heavy", typical: { ramGb: 8, cpuLoadPercent: 40, gpuLoadPercent: 30, vramGb: 4, diskScratchGb: 10 }, estimatedRamGb: { min: 4, typical: 8, high: 16 }, workloadConcurrencyFactor: 0.8 }],
      sourceRecords: [{ retrievedAt: new Date().toISOString(), type: "official", confidence: "high" }],
    };

    const result = evaluateCompatibility(pc, workloads, [version], true, true);

    // Single report text
    const textReport = exportService.generateTextReport(result, pc, workloads);
    expect(textReport.reportText).toContain("COMPUTER COMPATIBILITY REPORT");
    expect(textReport.reportText).toContain("Intel Core i7-13700K");

    // CSV fleet export
    const fleetRows: CsvCompatibilityRow[] = [
      {
        computerName: "Workstation-01",
        cpuModel: pc.cpu.model,
        gpuModel: pc.gpu?.model || "",
        ramGb: pc.ram.totalGb,
        osFamily: pc.os.family,
        softwareStack: "Photoshop 2024",
        compatibilityStatus: result.compatibilityStatus,
        performanceTier: result.performanceTier,
        score: result.score,
        primaryBottleneck: "None",
        recommendedUpgrade: "None",
        confidence: result.confidence,
      },
    ];

    const csvOutput = exportService.generateCsvExport(fleetRows);
    expect(csvOutput).toContain('"Workstation-01"');
    expect(csvOutput).toContain('"Intel Core i7-13700K"');
    expect(csvOutput).toContain("32");
  });

  it("5. Evaluates entitlement-based access control (can(user, permission))", () => {
    const anonymousUser: UserContext = { role: "ANONYMOUS" };
    const freeUser: UserContext = { role: "FREE" };
    const proUser: UserContext = { role: "PRO" };
    const businessUser: UserContext = { role: "BUSINESS" };

    // Anonymous can check compatibility, but cannot save computers
    expect(can(anonymousUser, "run_basic_check")).toBe(true);
    expect(can(anonymousUser, "save_computers")).toBe(false);

    // Free user can save computers, but cannot run advanced simulation or export PDF
    expect(can(freeUser, "save_computers")).toBe(true);
    expect(can(freeUser, "advanced_simulation")).toBe(false);
    expect(can(freeUser, "export_pdf")).toBe(false);

    // Pro user can export PDF and run advanced simulation, but cannot export CSV or bulk analysis
    expect(can(proUser, "export_pdf")).toBe(true);
    expect(can(proUser, "advanced_simulation")).toBe(true);
    expect(can(proUser, "export_csv")).toBe(false);

    // Business user has bulk analysis, CSV export, and API access
    expect(can(businessUser, "export_csv")).toBe(true);
    expect(can(businessUser, "bulk_analysis")).toBe(true);
    expect(can(businessUser, "api_access")).toBe(true);
  });
});
