import { describe, it, expect } from "vitest";
import { normalizeCpuQuery, normalizeGpuQuery, tokenizeHardwareQuery } from "../../services/normalization/hardware-normalizer";
import { Cpu, Gpu } from "../../lib/domain/hardware";

describe("Hardware Normalization Subsystem (§4, §5)", () => {
  const sampleCpuCatalog: Cpu[] = [
    {
      id: "cpu_5600h",
      manufacturer: "AMD",
      model: "AMD Ryzen 5 5600H",
      architecture: "x86_64",
      physicalCores: 6,
      performanceScore: 68,
      laptopVariant: true,
      aliases: ["5600H", "Ryzen 5600H", "AMD 5600H Laptop"],
    },
    {
      id: "cpu_13700k",
      manufacturer: "Intel",
      model: "Intel Core i7-13700K",
      architecture: "x86_64",
      physicalCores: 16,
      performanceScore: 92,
      laptopVariant: false,
      aliases: ["13700K", "Core i7 13700K", "i7-13700K Desktop"],
    },
    {
      id: "cpu_m3_pro",
      manufacturer: "Apple",
      model: "Apple M3 Pro",
      architecture: "arm64",
      physicalCores: 12,
      performanceScore: 88,
      laptopVariant: true,
      aliases: ["M3 Pro", "Apple M3 Pro 12-Core"],
    },
  ];

  const sampleGpuCatalog: Gpu[] = [
    {
      id: "gpu_4070_desktop",
      manufacturer: "NVIDIA",
      model: "NVIDIA GeForce RTX 4070",
      type: "dedicated",
      performanceScore: 88,
      vramGb: 12,
      laptopVariant: false,
      aliases: ["RTX 4070", "RTX 4070 Desktop", "GeForce 4070"],
    },
    {
      id: "gpu_4070_laptop",
      manufacturer: "NVIDIA",
      model: "NVIDIA GeForce RTX 4070 Laptop GPU",
      type: "dedicated",
      performanceScore: 75,
      vramGb: 8,
      laptopVariant: true,
      aliases: ["RTX 4070 Laptop", "RTX 4070 Mobile", "4070 Notebook"],
    },
    {
      id: "gpu_3050_laptop",
      manufacturer: "NVIDIA",
      model: "NVIDIA GeForce RTX 3050 Laptop GPU",
      type: "dedicated",
      performanceScore: 55,
      vramGb: 4,
      laptopVariant: true,
      aliases: ["RTX 3050 Laptop", "3050 Mobile"],
    },
  ];

  it("tokenizes queries and detects vendor, family, and form factor", () => {
    const tokenized = tokenizeHardwareQuery("NVIDIA GeForce RTX 4070 Mobile");
    expect(tokenized.vendor).toBe("NVIDIA");
    expect(tokenized.family).toBe("RTX 40 Series");
    expect(tokenized.isLaptop).toBe(true);
    expect(tokenized.isDesktop).toBe(false);
  });

  it("resolves exact and high-confidence aliases (§4)", () => {
    const result = normalizeGpuQuery("NVIDIA GeForce RTX4070 mobile", sampleGpuCatalog);
    expect(result.status).toBe("HIGH_CONFIDENCE");
    expect(result.canonicalEntity?.id).toBe("gpu_4070_laptop");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("flags ambiguous query when variant is unspecified and does NOT choose automatically (§4, §5)", () => {
    // "4070" is ambiguous between Desktop (12GB) and Laptop (8GB)
    const result = normalizeGpuQuery("4070", sampleGpuCatalog);
    expect(result.status).toBe("AMBIGUOUS");
    expect(result.isAmbiguous).toBe(true);
    expect(result.canonicalEntity).toBeUndefined(); // Must not pick silently
    expect(result.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it("returns NOT_FOUND for unknown hardware queries", () => {
    const result = normalizeCpuQuery("SuperQuantumProcessor X9999", sampleCpuCatalog);
    expect(result.status).toBe("NOT_FOUND");
    expect(result.confidence).toBe(0);
  });
});
