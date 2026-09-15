"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  AlertCircle,
  ShieldCheck,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { parseTextSpecifications } from "@/lib/importer/text-spec-parser";
import { validateAndSanitizeImageFile } from "@/lib/importer/image-validator";
import { recognizeTextWithWorker } from "@/lib/importer/ocr-service";
import { SpecConfirmationView } from "./SpecConfirmationView";
import { ComputerProfile } from "@/lib/domain/computer-profile";
import { analytics } from "@/lib/observability/analytics/client";

interface SpecImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileConfirmed: (profile: ComputerProfile) => void;
}

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

export function SpecImportModal({ isOpen, onClose, onProfileConfirmed }: SpecImportModalProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "ocr">("paste");
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ progress: number; status: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<ComputerProfile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelOcrRef = useRef<(() => void) | null>(null);

  const handleReset = () => {
    setPastedText("");
    setIsProcessing(false);
    setOcrProgress(null);
    setErrorMsg(null);
    setCandidateProfile(null);
    if (cancelOcrRef.current) {
      cancelOcrRef.current();
      cancelOcrRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      analytics.track("journey_started" as any, { journey: "spec_import" });
    } else {
      handleReset();
    }
  }, [isOpen]);

  const handleParseText = () => {
    if (!pastedText.trim()) {
      setErrorMsg("Please paste or enter some computer hardware specifications first.");
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const profile = parseTextSpecifications(pastedText, "pasted_text");
      setCandidateProfile(profile);
      analytics.track("journey_completed" as any, {
        journey: "spec_import",
        source: "pasted_text",
        confidence: profile.resolution.overallConfidence,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse specification text.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setErrorMsg(null);
    setIsProcessing(true);
    setOcrProgress({ progress: 10, status: "Validating image security & format..." });

    try {
      // 1. Validate magic bytes, limits (<=8MB, <=24MP), and strip metadata via canvas
      const sanitized = await validateAndSanitizeImageFile(file);

      setOcrProgress({ progress: 30, status: "Initializing local Web Worker OCR..." });

      // 2. Run OCR in isolated Web Worker with cancellation support
      const ocrTask = recognizeTextWithWorker(sanitized.cleanBlob, (p: number, status: string) => {
        setOcrProgress({ progress: Math.min(95, Math.round(30 + p * 0.65)), status });
      });

      cancelOcrRef.current = ocrTask.cancel;
      const extractedText = await ocrTask.promise;

      setOcrProgress({ progress: 100, status: "Matching hardware catalog..." });

      // 3. Deterministically parse OCR text
      const profile = parseTextSpecifications(extractedText, "image_ocr");
      setCandidateProfile(profile);

      analytics.track("journey_completed" as any, {
        journey: "spec_import",
        source: "image_ocr",
        confidence: profile.resolution.overallConfidence,
      });
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("cancelled")) {
        setErrorMsg("OCR text extraction was cancelled.");
      } else {
        setErrorMsg(err.message || "Failed to process image screenshot.");
      }
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
      cancelOcrRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCancelOcr = () => {
    if (cancelOcrRef.current) {
      cancelOcrRef.current();
      cancelOcrRef.current = null;
    }
    setIsProcessing(false);
    setOcrProgress(null);
  };

  const handleConfirmed = (confirmedProfile: ComputerProfile) => {
    onProfileConfirmed(confirmedProfile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spec-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="surface-card bg-surface border border-border-subtle rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-border-subtle flex items-center justify-between shrink-0 bg-surface-subtle/50">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-primary" />
              <h2 id="spec-import-title" className="text-lg sm:text-xl font-bold text-content-strong">
                {candidateProfile ? "Confirm Detected Specifications" : "Import Computer Specifications"}
              </h2>
            </div>
            <p className="text-xs text-content-body mt-0.5">
              {candidateProfile
                ? "Review extracted fields, resolve ambiguities, and confirm before evaluation."
                : "Paste your hardware specs or upload a screenshot. 100% processed locally in your browser."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-content-muted hover:text-content-strong hover:bg-surface-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {candidateProfile ? (
            <SpecConfirmationView
              initialProfile={candidateProfile}
              onConfirm={handleConfirmed}
              onBack={() => setCandidateProfile(null)}
            />
          ) : (
            <>
              {/* Privacy & Determinism Guarantee Banner */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Zero Server Uploads & Deterministic Matching</span>
                  <p className="text-content-body text-[11px] leading-relaxed">
                    Screenshots and text are processed strictly inside your browser using local canvas decoding and Web Workers.
                    Specifications are matched deterministically against the verified hardware catalog.
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-surface-subtle rounded-2xl border border-border-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("paste");
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "paste"
                      ? "bg-surface text-brand-primary shadow-xs border border-border-subtle"
                      : "text-content-body hover:text-content-strong"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Paste Plain Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("ocr");
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "ocr"
                      ? "bg-surface text-brand-primary shadow-xs border border-border-subtle"
                      : "text-content-body hover:text-content-strong"
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Upload Screenshot (OCR)</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* TAB 1: Paste Text */}
              {activeTab === "paste" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-content-strong mb-1.5">
                      Paste Hardware Specifications or Store Listing
                    </label>
                    <textarea
                      rows={5}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="e.g. AMD Ryzen 7 7800X3D, RTX 4080 Super 16GB, 32GB RAM, 2TB SSD, Windows 11..."
                      className="w-full p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle text-content-strong placeholder:text-content-muted text-xs font-mono focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all resize-y"
                    />
                  </div>

                  {/* Sample Snippets */}
                  <div>
                    <span className="text-[11px] font-semibold text-content-muted block mb-1.5">
                      Or try an example template:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {SAMPLE_SPECS.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPastedText(sample.text)}
                          className="px-2.5 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-elevated text-content-body text-[11px] font-medium border border-border-subtle transition-colors"
                        >
                          {sample.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleParseText}
                    disabled={isProcessing || !pastedText.trim()}
                    className="touch-target w-full py-3.5 px-5 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Parsing Candidates...</span>
                      </>
                    ) : (
                      <>
                        <span>Extract Candidate Specs</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 2: Screenshot OCR */}
              {activeTab === "ocr" && (
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />

                  {isProcessing && ocrProgress ? (
                    <div className="p-6 rounded-2xl bg-surface-subtle border border-border-subtle text-center space-y-4">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-primary mx-auto" />
                      <div>
                        <div className="text-xs font-bold text-content-strong mb-1">
                          {ocrProgress.status}
                        </div>
                        <div className="w-full bg-surface-elevated rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                          <div
                            className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${ocrProgress.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-content-muted mt-1 block font-mono">
                          {ocrProgress.progress}%
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelOcr}
                        className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface text-content-body text-xs font-bold border border-border-subtle transition-colors"
                      >
                        Cancel OCR
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border-subtle hover:border-brand-primary/50 bg-surface-subtle/50 hover:bg-surface-subtle rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-content-strong block">
                          Click to select or drop a screenshot here
                        </span>
                        <span className="text-[11px] text-content-muted block mt-0.5">
                          Supported formats: PNG, JPEG, WebP (Max 8 MB, 24 MP)
                        </span>
                      </div>
                      <div className="text-[10px] text-content-muted font-mono bg-surface-elevated px-3 py-1.5 rounded-xl inline-block border border-border-subtle">
                        Windows Task Manager • About This Mac • DxDiag • System Info
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
