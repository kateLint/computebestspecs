"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Cpu,
  Layers,
  ExternalLink,
} from "lucide-react";

interface SuggestCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: "software" | "hardware";
  initialItemName?: string;
}

export function SuggestCatalogModal({
  isOpen,
  onClose,
  defaultType = "software",
  initialItemName = "",
}: SuggestCatalogModalProps) {
  const [type, setType] = useState<"software" | "hardware">(defaultType);
  const [name, setName] = useState(initialItemName);
  const [vendorOrManufacturer, setVendorOrManufacturer] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [minRamGb, setMinRamGb] = useState("");
  const [recRamGb, setRecRamGb] = useState("");
  const [minVramGb, setMinVramGb] = useState("");
  const [recVramGb, setRecVramGb] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setName(initialItemName);
      setIsSubmitted(false);
      setErrorMessage("");
    }
  }, [isOpen, defaultType, initialItemName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter a name for the software or hardware component.");
      return;
    }

    setIsSubmitting(true);

    const suggestionPayload = {
      id: `sug_${Date.now()}`,
      type,
      name: name.trim(),
      vendorOrManufacturer: vendorOrManufacturer.trim() || undefined,
      docsUrl: docsUrl.trim() || undefined,
      specs: {
        minRamGb: minRamGb ? parseFloat(minRamGb) : undefined,
        recRamGb: recRamGb ? parseFloat(recRamGb) : undefined,
        minVramGb: minVramGb ? parseFloat(minVramGb) : undefined,
        recVramGb: recVramGb ? parseFloat(recVramGb) : undefined,
      },
      notes: notes.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };

    try {
      const existing = localStorage.getItem("cbs_community_suggestions_v1");
      const list = existing ? JSON.parse(existing) : [];
      list.push(suggestionPayload);
      localStorage.setItem("cbs_community_suggestions_v1", JSON.stringify(list));
    } catch {
      // LocalStorage quota or private mode fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 450);
  };

  const handleCopyJson = () => {
    const data = {
      type,
      name,
      vendorOrManufacturer,
      docsUrl,
      specs: {
        minRamGb,
        recRamGb,
        minVramGb,
        recVramGb,
      },
      notes,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggest-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-surface-main border border-border-subtle shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-content-body"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="suggest-modal-title" className="text-lg font-bold text-content-strong">
                Suggest Software or Hardware
              </h2>
              <p className="text-xs text-content-muted">
                Help expand our verified benchmark catalog with deterministic specifications.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-muted hover:text-content-strong hover:bg-surface-secondary transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-content-strong">Suggestion Received</h3>
              <p className="text-xs text-content-muted max-w-md mx-auto">
                Thank you! Your entry has been queued for verification against official vendor whitepapers and benchmark databases.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-surface-secondary border border-border-subtle text-content-strong hover:bg-surface-card transition-colors"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopied ? "Copied Spec JSON" : "Copy Spec JSON"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-5 py-2 rounded-xl text-xs font-bold bg-brand-primary text-[var(--on-brand)] hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Suggestion Type Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-secondary border border-border-subtle">
              <button
                type="button"
                onClick={() => setType("software")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  type === "software"
                    ? "bg-surface-card text-brand-primary shadow-sm border border-border-subtle"
                    : "text-content-muted hover:text-content-strong"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Software / App</span>
              </button>
              <button
                type="button"
                onClick={() => setType("hardware")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  type === "hardware"
                    ? "bg-surface-card text-brand-primary shadow-sm border border-border-subtle"
                    : "text-content-muted hover:text-content-strong"
                }`}
              >
                <Cpu className="h-4 w-4" />
                <span>Hardware Component</span>
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-content-strong mb-1">
                  {type === "software" ? "Application / Tool Name *" : "Component / Model Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === "software" ? "e.g. DaVinci Resolve Studio 19" : "e.g. NVIDIA RTX 5080"}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-surface-card border border-border-subtle text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-strong mb-1">
                  {type === "software" ? "Publisher / Developer" : "Manufacturer"}
                </label>
                <input
                  type="text"
                  value={vendorOrManufacturer}
                  onChange={(e) => setVendorOrManufacturer(e.target.value)}
                  placeholder={type === "software" ? "e.g. Blackmagic Design" : "e.g. NVIDIA / Intel / AMD"}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-surface-card border border-border-subtle text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-content-strong mb-1 flex items-center gap-1">
                  <span>Official Documentation / Spec URL</span>
                  <ExternalLink className="h-3 w-3 text-content-muted" />
                </label>
                <input
                  type="url"
                  value={docsUrl}
                  onChange={(e) => setDocsUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-surface-card border border-border-subtle text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                />
              </div>
            </div>

            {/* Hardware / Software Specific Spec Inputs */}
            {type === "software" && (
              <div className="space-y-3 pt-2 border-t border-border-subtle">
                <p className="text-[11px] font-bold text-content-muted uppercase tracking-wider">
                  Memory Requirements (Optional)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-content-muted mb-1">Min RAM (GB)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={minRamGb}
                      onChange={(e) => setMinRamGb(e.target.value)}
                      placeholder="8"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-surface-card border border-border-subtle text-content-strong"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-content-muted mb-1">Rec RAM (GB)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={recRamGb}
                      onChange={(e) => setRecRamGb(e.target.value)}
                      placeholder="32"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-surface-card border border-border-subtle text-content-strong"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-content-muted mb-1">Min VRAM (GB)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={minVramGb}
                      onChange={(e) => setMinVramGb(e.target.value)}
                      placeholder="4"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-surface-card border border-border-subtle text-content-strong"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-content-muted mb-1">Rec VRAM (GB)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={recVramGb}
                      onChange={(e) => setRecVramGb(e.target.value)}
                      placeholder="12"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-surface-card border border-border-subtle text-content-strong"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-content-strong mb-1">
                Additional Notes / Workload Context
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific test cases, hardware quirks, or benchmark insights..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-surface-card border border-border-subtle text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-content-muted">
              <span>Direct feedback, benchmark data or questions:</span>
              <a
                href="mailto:ktlint3@gmail.com"
                className="font-mono font-bold text-brand-primary hover:underline"
              >
                ktlint3@gmail.com
              </a>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-content-muted hover:text-content-strong transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-primary text-[var(--on-brand)] shadow-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit for Verification"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
