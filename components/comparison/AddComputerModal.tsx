"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Plus,
  Sparkles,
  Laptop,
  Monitor,
  Cpu,
  HardDrive,
  Layers,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Apple,
  Zap,
} from "lucide-react";
import { addComputerToComparison, getComparisonSet, MAX_COMPARISON_ITEMS } from "@/lib/comparison/storage";
import { HardwareProfile } from "@/lib/domain/hardware";
import { SelectedWorkload } from "@/lib/domain/software";
import { parseTextSpecifications } from "@/lib/importer/text-spec-parser";
import { validateAndSanitizeImageFile } from "@/lib/importer/image-validator";
import { recognizeTextWithWorker } from "@/lib/importer/ocr-service";
import { ComputerProfile, computerProfileToHardwareProfile } from "@/lib/domain/computer-profile";
import { SpecConfirmationView } from "@/components/importer/SpecConfirmationView";

export interface AddComputerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
  sharedWorkloads?: SelectedWorkload[];
  sharedIsSimultaneous?: boolean;
}

export interface PresetPC {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  formFactor: "desktop" | "laptop" | "mini_pc";
  cpu: string;
  gpu: string;
  ramGb: number;
  storageGb: number;
  os: string;
  rawHardwareProfile: HardwareProfile;
}

export const POPULAR_PRESETS: PresetPC[] = [
  {
    id: "preset_m3_max",
    name: 'Apple MacBook Pro 16" (M3 Max)',
    badge: "Apple Silicon",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    description: "16-Core CPU, 40-Core GPU, 48GB Unified Memory, 1TB NVMe SSD, macOS",
    formFactor: "laptop",
    cpu: "Apple M3 Max",
    gpu: "Apple M3 Max 40-Core GPU",
    ramGb: 48,
    storageGb: 1000,
    os: "macOS",
    rawHardwareProfile: {
      cpu: {
        model: "Apple M3 Max",
        manufacturer: "Apple",
        architecture: "arm64",
        physicalCores: 16,
        threads: 16,
        performanceScore: 98,
        laptopVariant: true,
        isVerified: true,
      },
      gpu: {
        model: "Apple M3 Max 40-Core GPU",
        manufacturer: "Apple",
        type: "unified",
        performanceScore: 88,
        vramGb: 48,
        supportsMetal: true,
        supportsVulkan: true,
        isVerified: true,
      },
      ram: { totalGb: 48, type: "Unified" },
      storage: [{ type: "NVME_SSD" as any, totalGb: 1000, freeGb: 600, isSystemDrive: true }],
      os: { family: "macos", version: "Sonoma 14.4", architecture: "arm64" },
      architecture: "arm64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    },
  },
  {
    id: "preset_gaming_laptop",
    name: "ASUS ROG Strix G16 (RTX 4070)",
    badge: "Gaming & AI Laptop",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    description: "Intel i7-13700H, RTX 4070 Laptop (8GB), 32GB DDR5, 1TB NVMe, Windows 11",
    formFactor: "laptop",
    cpu: "Intel Core i7-13700H",
    gpu: "NVIDIA GeForce RTX 4070 Laptop GPU",
    ramGb: 32,
    storageGb: 1000,
    os: "Windows 11",
    rawHardwareProfile: {
      cpu: {
        model: "Intel Core i7-13700H",
        manufacturer: "Intel",
        architecture: "x86_64",
        physicalCores: 14,
        threads: 20,
        performanceScore: 85,
        laptopVariant: true,
        isVerified: true,
      },
      gpu: {
        model: "NVIDIA GeForce RTX 4070 Laptop GPU",
        manufacturer: "NVIDIA",
        type: "dedicated",
        performanceScore: 80,
        vramGb: 8,
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
        laptopVariant: true,
        isVerified: true,
      },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD" as any, totalGb: 1000, freeGb: 600, isSystemDrive: true }],
      os: { family: "windows", version: "11 Home", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    },
  },
  {
    id: "preset_rtx4090_workstation",
    name: "Pro Studio Workstation (RTX 4090)",
    badge: "Maximum Performance",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    description: "Intel i9-14900K, RTX 4090 (24GB), 64GB DDR5, 2TB NVMe SSD, Windows 11",
    formFactor: "desktop",
    cpu: "Intel Core i9-14900K",
    gpu: "NVIDIA GeForce RTX 4090",
    ramGb: 64,
    storageGb: 2000,
    os: "Windows 11",
    rawHardwareProfile: {
      cpu: {
        model: "Intel Core i9-14900K",
        manufacturer: "Intel",
        architecture: "x86_64",
        physicalCores: 24,
        threads: 32,
        performanceScore: 100,
        laptopVariant: false,
        isVerified: true,
      },
      gpu: {
        model: "NVIDIA GeForce RTX 4090",
        manufacturer: "NVIDIA",
        type: "dedicated",
        performanceScore: 100,
        vramGb: 24,
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
        isVerified: true,
      },
      ram: { totalGb: 64, type: "DDR5" },
      storage: [{ type: "NVME_SSD" as any, totalGb: 2000, freeGb: 1400, isSystemDrive: true }],
      os: { family: "windows", version: "11 Pro", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    },
  },
  {
    id: "preset_ryzen_creator",
    name: "AMD Ryzen 7 Creator Rig",
    badge: "Balanced Creator",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    description: "AMD Ryzen 7 7800X3D, RTX 4070 Ti Super (16GB), 32GB DDR5, 2TB NVMe",
    formFactor: "desktop",
    cpu: "AMD Ryzen 7 7800X3D",
    gpu: "NVIDIA GeForce RTX 4070 Ti SUPER",
    ramGb: 32,
    storageGb: 2000,
    os: "Windows 11",
    rawHardwareProfile: {
      cpu: {
        model: "AMD Ryzen 7 7800X3D",
        manufacturer: "AMD",
        architecture: "x86_64",
        physicalCores: 8,
        threads: 16,
        performanceScore: 92,
        laptopVariant: false,
        isVerified: true,
      },
      gpu: {
        model: "NVIDIA GeForce RTX 4070 Ti SUPER",
        manufacturer: "NVIDIA",
        type: "dedicated",
        performanceScore: 89,
        vramGb: 16,
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
        isVerified: true,
      },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD" as any, totalGb: 2000, freeGb: 1400, isSystemDrive: true }],
      os: { family: "windows", version: "11 Pro", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    },
  },
  {
    id: "preset_budget_creator",
    name: "Budget Creator & Gaming PC",
    badge: "Value Pick",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    description: "AMD Ryzen 5 7600X, RTX 4060 (8GB), 32GB DDR5, 1TB NVMe, Windows 11",
    formFactor: "desktop",
    cpu: "AMD Ryzen 5 7600X",
    gpu: "NVIDIA GeForce RTX 4060",
    ramGb: 32,
    storageGb: 1000,
    os: "Windows 11",
    rawHardwareProfile: {
      cpu: {
        model: "AMD Ryzen 5 7600X",
        manufacturer: "AMD",
        architecture: "x86_64",
        physicalCores: 6,
        threads: 12,
        performanceScore: 78,
        laptopVariant: false,
        isVerified: true,
      },
      gpu: {
        model: "NVIDIA GeForce RTX 4060",
        manufacturer: "NVIDIA",
        type: "dedicated",
        performanceScore: 72,
        vramGb: 8,
        supportsCuda: true,
        supportsDirectX12: true,
        supportsVulkan: true,
        isVerified: true,
      },
      ram: { totalGb: 32, type: "DDR5" },
      storage: [{ type: "NVME_SSD" as any, totalGb: 1000, freeGb: 600, isSystemDrive: true }],
      os: { family: "windows", version: "11 Home", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    },
  },
  {
    id: "preset_ultrabook",
    name: "Dell XPS 14 Productivity Ultrabook",
    badge: "Thin & Light",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    description: "Intel Core Ultra 7 155H, Intel Arc Graphics, 16GB LPDDR5X, 512GB NVMe",
    formFactor: "laptop",
    cpu: "Intel Core Ultra 7 155H",
    gpu: "Intel Arc Graphics",
    ramGb: 16,
    storageGb: 512,
    os: "Windows 11",
    rawHardwareProfile: {
      cpu: {
        model: "Intel Core Ultra 7 155H",
        manufacturer: "Intel",
        architecture: "x86_64",
        physicalCores: 16,
        threads: 22,
        performanceScore: 82,
        laptopVariant: true,
        isVerified: true,
      },
      gpu: {
        model: "Intel Arc Graphics",
        manufacturer: "Intel",
        type: "integrated",
        performanceScore: 45,
        vramGb: 2,
        supportsDirectX12: true,
        supportsVulkan: true,
        isVerified: true,
      },
      ram: { totalGb: 16, type: "LPDDR5X" },
      storage: [{ type: "NVME_SSD" as any, totalGb: 512, freeGb: 300, isSystemDrive: true }],
      os: { family: "windows", version: "11 Home", architecture: "x86_64" },
      architecture: "x86_64",
      deviceType: "laptop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    },
  },
];

const SAMPLE_SPECS = [
  {
    label: "Clean Desktop Specs",
    text: "Intel Core i7-13700K 16-Core\n32GB DDR5 RAM\nNVIDIA GeForce RTX 4070 12GB\n1TB NVMe SSD\nWindows 11 64-bit",
  },
  {
    label: "Gaming Laptop Listing",
    text: "ASUS ROG Strix G16 (2024)\nCPU: Intel Core i9-13980HX\nGraphics: NVIDIA GeForce RTX 4080 Laptop GPU 12GB GDDR6\nMemory: 32 GB DDR5-4800\nStorage: 1TB PCIe 4.0 NVMe M.2 SSD\nOS: Windows 11 Home",
  },
  {
    label: "Apple Silicon Mac",
    text: "Apple MacBook Pro 16-inch\nApple M3 Max chip with 16-core CPU, 40-core GPU\n48GB Unified Memory\n1TB SSD Storage\nmacOS Sonoma",
  },
];

export function AddComputerModal({
  isOpen,
  onClose,
  onAdded,
  sharedWorkloads = [],
  sharedIsSimultaneous = true,
}: AddComputerModalProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "import">("presets");
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // Custom Form State
  const [customName, setCustomName] = useState("");
  const [customCpu, setCustomCpu] = useState("Intel Core i7-13700K");
  const [customGpu, setCustomGpu] = useState("NVIDIA GeForce RTX 4070");
  const [customRamGb, setCustomRamGb] = useState(32);
  const [customStorageGb, setCustomStorageGb] = useState(1000);
  const [customOs, setCustomOs] = useState<"windows" | "macos" | "linux">("windows");
  const [customFormFactor, setCustomFormFactor] = useState<"desktop" | "laptop" | "mini_pc">("desktop");

  // Import / OCR State
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ progress: number; status: string } | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<ComputerProfile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelOcrRef = useRef<(() => void) | null>(null);

  if (!isOpen) return null;

  const handleAddPreset = (preset: PresetPC) => {
    const res = addComputerToComparison({
      name: preset.name,
      hardware: {
        cpu: preset.cpu,
        gpu: preset.gpu,
        ramGb: preset.ramGb,
        storageGb: preset.storageGb,
        os: preset.os,
        formFactor: preset.formFactor,
        rawHardwareProfile: preset.rawHardwareProfile,
      },
      workloads: sharedWorkloads,
      isSimultaneous: sharedIsSimultaneous,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    });

    if (res.success) {
      setFeedback({ success: true, message: `Added "${preset.name}" to comparison matrix.` });
      setTimeout(() => {
        onClose();
        onAdded?.();
        setFeedback(null);
      }, 700);
    } else {
      setFeedback({ success: false, message: res.reason || "Failed to add preset." });
    }
  };

  const handleAddCustom = () => {
    const isApple = customOs === "macos" || customCpu.toLowerCase().includes("apple") || customCpu.toLowerCase().includes("m1") || customCpu.toLowerCase().includes("m2") || customCpu.toLowerCase().includes("m3") || customCpu.toLowerCase().includes("m4");
    const isLaptop = customFormFactor === "laptop";

    const rawHardware: HardwareProfile = {
      cpu: {
        model: customCpu.trim() || "Standard Processor",
        manufacturer: isApple ? "Apple" : customCpu.toLowerCase().includes("amd") ? "AMD" : "Intel",
        architecture: isApple ? "arm64" : "x86_64",
        physicalCores: isApple ? 12 : 8,
        threads: isApple ? 12 : 16,
        performanceScore: 80,
        laptopVariant: isLaptop,
        isVerified: true,
      },
      gpu: {
        model: customGpu.trim() || "Standard Graphics",
        manufacturer: customGpu.toLowerCase().includes("rtx") || customGpu.toLowerCase().includes("nvidia")
          ? "NVIDIA"
          : customGpu.toLowerCase().includes("radeon") || customGpu.toLowerCase().includes("amd")
          ? "AMD"
          : isApple
          ? "Apple"
          : "Intel",
        type: isApple ? "unified" : customGpu.toLowerCase().includes("arc") || customGpu.toLowerCase().includes("integrated") ? "integrated" : "dedicated",
        performanceScore: isApple ? 85 : 75,
        vramGb: isApple ? customRamGb : customGpu.toLowerCase().includes("4090") ? 24 : customGpu.toLowerCase().includes("4080") ? 16 : customGpu.toLowerCase().includes("4070") ? 12 : 8,
        supportsCuda: customGpu.toLowerCase().includes("rtx") || customGpu.toLowerCase().includes("nvidia"),
        supportsDirectX12: !isApple,
        supportsMetal: isApple,
        supportsVulkan: true,
        laptopVariant: isLaptop,
        isVerified: true,
      },
      ram: {
        totalGb: customRamGb,
        type: isApple ? "Unified" : "DDR5",
      },
      storage: [
        {
          type: "NVME_SSD" as any,
          totalGb: customStorageGb,
          freeGb: Math.round(customStorageGb * 0.5),
          isSystemDrive: true,
        },
      ],
      os: {
        family: customOs,
        version: customOs === "macos" ? "14.4" : "11",
        architecture: isApple ? "arm64" : "x86_64",
      },
      architecture: isApple ? "arm64" : "x86_64",
      deviceType: isLaptop ? "laptop" : customFormFactor === "mini_pc" ? "mini-pc" : "desktop",
      supportsVirtualization: true,
      isVirtualizationEnabled: true,
    };

    const finalName = customName.trim() || `${customCpu} / ${customGpu}`;

    const res = addComputerToComparison({
      name: finalName,
      hardware: {
        cpu: customCpu.trim() || "Standard Processor",
        gpu: customGpu.trim() || "Standard Graphics",
        ramGb: customRamGb,
        storageGb: customStorageGb,
        os: customOs === "macos" ? "macOS" : customOs === "linux" ? "Linux Ubuntu" : "Windows 11",
        formFactor: customFormFactor,
        rawHardwareProfile: rawHardware,
      },
      workloads: sharedWorkloads,
      isSimultaneous: sharedIsSimultaneous,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    });

    if (res.success) {
      setFeedback({ success: true, message: `Added "${finalName}" to comparison.` });
      setTimeout(() => {
        onClose();
        onAdded?.();
        setFeedback(null);
      }, 700);
    } else {
      setFeedback({ success: false, message: res.reason || "Failed to add specification." });
    }
  };

  const handleParseText = () => {
    if (!pastedText.trim()) {
      setImportError("Please paste or type hardware specs first.");
      return;
    }
    setImportError(null);
    setIsProcessing(true);
    try {
      const profile = parseTextSpecifications(pastedText, "pasted_text");
      setCandidateProfile(profile);
    } catch (err: any) {
      setImportError(err.message || "Failed to parse specifications.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setIsProcessing(true);

    try {
      const sanitized = await validateAndSanitizeImageFile(file);
      setOcrProgress({ progress: 30, status: "Initializing local OCR worker..." });

      const ocrTask = recognizeTextWithWorker(sanitized.cleanBlob, (p: number, status: string) => {
        setOcrProgress({ progress: Math.min(95, Math.round(30 + p * 0.65)), status });
      });
      cancelOcrRef.current = ocrTask.cancel;

      const recognizedText = await ocrTask.promise;
      if (!recognizedText || !recognizedText.trim()) {
        setImportError("Could not extract legible text from image. Please try pasting text directly.");
        setIsProcessing(false);
        return;
      }

      const profile = parseTextSpecifications(recognizedText, "image_ocr");
      setCandidateProfile(profile);
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("cancelled")) {
        setImportError("OCR text extraction was cancelled.");
      } else {
        setImportError(err.message || "Failed to process screenshot.");
      }
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
      cancelOcrRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImportedProfile = (confirmedProfile: ComputerProfile) => {
    const rawHardware = computerProfileToHardwareProfile(confirmedProfile);
    const res = addComputerToComparison({
      name: confirmedProfile.name || `${confirmedProfile.cpu.value.model} PC`,
      hardware: {
        cpu: confirmedProfile.cpu.value.model,
        gpu: confirmedProfile.gpu.value.model,
        ramGb: confirmedProfile.ram.value.capacityGb,
        storageGb: confirmedProfile.storage.value.totalCapacityGb,
        os: confirmedProfile.os.value.family === "macos" ? "macOS" : confirmedProfile.os.value.family === "linux" ? "Linux" : "Windows 11",
        formFactor: confirmedProfile.formFactor,
        rawHardwareProfile: rawHardware,
      },
      workloads: sharedWorkloads,
      isSimultaneous: sharedIsSimultaneous,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
    });

    if (res.success) {
      setFeedback({ success: true, message: `Imported "${confirmedProfile.name}" into comparison.` });
      setTimeout(() => {
        onClose();
        onAdded?.();
        setFeedback(null);
      }, 700);
    } else {
      setImportError(res.reason || "Failed to add imported computer.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-strong">Add Computer Specification</h2>
              <p className="text-xs text-content-muted">
                Add a computer directly to compare against your workload ({getComparisonSet().items.length}/{MAX_COMPARISON_ITEMS} slots used)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-content-muted hover:text-content-strong hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-subtle px-6 bg-surface-card gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("presets");
              setCandidateProfile(null);
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "presets"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-content-body hover:text-content-strong"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Popular Presets (1-Click)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("custom");
              setCandidateProfile(null);
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "custom"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-content-body hover:text-content-strong"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Custom Spec Builder</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "import"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-content-body hover:text-content-strong"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste / Screenshot OCR</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                feedback.success
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {feedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-3">
              <p className="text-xs text-content-muted">
                Select a standard modern PC architecture to immediately benchmark side-by-side:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POPULAR_PRESETS.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-surface-subtle hover:bg-surface-elevated border border-border-subtle hover:border-brand-primary/40 transition-all flex flex-col justify-between gap-3 text-left group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                        <span className="text-[11px] text-content-muted capitalize flex items-center gap-1">
                          {p.formFactor === "laptop" ? <Laptop className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                          {p.formFactor}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-content-strong group-hover:text-brand-primary transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-xs text-content-muted mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddPreset(p)}
                      className="w-full py-2 px-3 rounded-xl bg-surface-card hover:bg-brand-primary text-content-strong hover:text-white text-xs font-bold border border-border-subtle hover:border-brand-primary transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Comparison</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM SPEC BUILDER */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Computer Label */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-content-strong mb-1">
                    Computer Name / Label
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Dell XPS 15 or Custom Build"
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-subtle text-xs text-content-strong focus:outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Form Factor */}
                <div>
                  <label className="block text-xs font-bold text-content-strong mb-1">
                    Form Factor
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["desktop", "laptop", "mini_pc"] as const).map((ff) => (
                      <button
                        key={ff}
                        type="button"
                        onClick={() => setCustomFormFactor(ff)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                          customFormFactor === ff
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-surface-subtle text-content-body border-border-subtle hover:bg-surface-elevated"
                        }`}
                      >
                        {ff.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OS */}
                <div>
                  <label className="block text-xs font-bold text-content-strong mb-1">
                    Operating System
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["windows", "macos", "linux"] as const).map((os) => (
                      <button
                        key={os}
                        type="button"
                        onClick={() => setCustomOs(os)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold border capitalize transition-all ${
                          customOs === os
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-surface-subtle text-content-body border-border-subtle hover:bg-surface-elevated"
                        }`}
                      >
                        {os === "macos" ? "macOS" : os}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CPU Model */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-content-strong mb-1 flex items-center justify-between">
                    <span>Processor (CPU)</span>
                    <span className="text-[10px] text-content-muted font-normal">Pick chip or type custom</span>
                  </label>
                  <input
                    type="text"
                    value={customCpu}
                    onChange={(e) => setCustomCpu(e.target.value)}
                    placeholder="e.g. Intel Core i7-13700K, AMD Ryzen 7 7800X3D, Apple M3 Max"
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-subtle text-xs text-content-strong focus:outline-none focus:border-brand-primary mb-1.5"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[
                      "Apple M4 Max",
                      "Apple M3 Max",
                      "Intel Core i9-14900K",
                      "Intel Core i7-13700K",
                      "AMD Ryzen 7 7800X3D",
                      "AMD Ryzen 9 7950X",
                      "Intel Core Ultra 7 155H",
                      "AMD Ryzen 5 7600X",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCustomCpu(chip)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-surface-subtle hover:bg-surface-elevated border border-border-subtle text-content-body hover:text-brand-primary transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GPU Model */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-content-strong mb-1 flex items-center justify-between">
                    <span>Graphics Card (GPU)</span>
                    <span className="text-[10px] text-content-muted font-normal">Pick GPU or type custom</span>
                  </label>
                  <input
                    type="text"
                    value={customGpu}
                    onChange={(e) => setCustomGpu(e.target.value)}
                    placeholder="e.g. NVIDIA GeForce RTX 4070, Apple 40-core GPU, Intel Arc"
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-subtle text-xs text-content-strong focus:outline-none focus:border-brand-primary mb-1.5"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[
                      "NVIDIA GeForce RTX 4090",
                      "NVIDIA GeForce RTX 4080 SUPER",
                      "NVIDIA GeForce RTX 4070 SUPER",
                      "NVIDIA GeForce RTX 4060",
                      "Apple M3 Max 40-Core GPU",
                      "AMD Radeon RX 7900 XTX",
                      "Intel Arc Graphics",
                    ].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCustomGpu(g)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-surface-subtle hover:bg-surface-elevated border border-border-subtle text-content-body hover:text-brand-primary transition-colors"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* RAM */}
                <div>
                  <label className="block text-xs font-bold text-content-strong mb-1">
                    Memory (RAM)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[8, 16, 32, 48, 64, 96, 128].map((ram) => (
                      <button
                        key={ram}
                        type="button"
                        onClick={() => setCustomRamGb(ram)}
                        className={`py-1 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          customRamGb === ram
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-surface-subtle text-content-body border-border-subtle hover:bg-surface-elevated"
                        }`}
                      >
                        {ram}GB
                      </button>
                    ))}
                  </div>
                </div>

                {/* Storage */}
                <div>
                  <label className="block text-xs font-bold text-content-strong mb-1">
                    Storage (NVMe SSD)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "512GB", val: 512 },
                      { label: "1TB", val: 1000 },
                      { label: "2TB", val: 2000 },
                      { label: "4TB", val: 4000 },
                    ].map((st) => (
                      <button
                        key={st.val}
                        type="button"
                        onClick={() => setCustomStorageGb(st.val)}
                        className={`py-1 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          customStorageGb === st.val
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-surface-subtle text-content-body border-border-subtle hover:bg-surface-elevated"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 flex justify-end gap-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-content-muted hover:text-content-strong"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom PC to Matrix</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT / OCR */}
          {activeTab === "import" && (
            <div className="space-y-4">
              {candidateProfile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Extracted Hardware Profile
                    </span>
                    <button
                      type="button"
                      onClick={() => setCandidateProfile(null)}
                      className="text-xs text-content-muted hover:text-content-strong underline"
                    >
                      Re-import
                    </button>
                  </div>
                  <SpecConfirmationView
                    profile={candidateProfile}
                    onConfirm={handleConfirmImportedProfile}
                    onCancel={() => setCandidateProfile(null)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-content-strong mb-1">
                      Paste Hardware Listing or System Specs
                    </label>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      rows={4}
                      placeholder="e.g. Intel i7-13700K, RTX 4070 12GB, 32GB RAM, 1TB NVMe, Windows 11..."
                      className="w-full p-3 rounded-2xl bg-surface-subtle border border-border-subtle text-xs text-content-strong font-mono focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  {/* Sample chips */}
                  <div>
                    <span className="text-[11px] text-content-muted mr-2">Try sample specs:</span>
                    <div className="inline-flex flex-wrap gap-1.5 mt-1">
                      {SAMPLE_SPECS.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPastedText(s.text)}
                          className="text-[11px] px-2.5 py-1 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-border-subtle text-content-body hover:text-brand-primary transition-all"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image OCR Dropzone */}
                  <div className="relative border-2 border-dashed border-border-subtle hover:border-brand-primary/40 rounded-2xl p-4 text-center bg-surface-subtle/40 transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Upload className="w-5 h-5 text-content-muted" />
                      <p className="text-xs text-content-strong font-semibold">
                        Or upload a screenshot (Task Manager, System Info, Spec Sheet)
                      </p>
                      <p className="text-[10px] text-content-muted">
                        OCR runs 100% locally in your browser using WebWorkers. No images leave your device.
                      </p>
                    </div>
                  </div>

                  {ocrProgress && (
                    <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-xs text-brand-primary flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{ocrProgress.status} ({Math.round(ocrProgress.progress * 100)}%)...</span>
                    </div>
                  )}

                  {importError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{importError}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleParseText}
                      disabled={isProcessing || !pastedText.trim()}
                      className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Parsing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Parse & Review Specs</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
