"use client";

import React, { useEffect } from "react";
import { X, ShieldCheck, CheckCircle2, Cpu, Database, CpuIcon, Layers, Server, Calendar } from "lucide-react";
import { FitEvaluationResult } from "@/lib/domain/needs-profile";

interface ConfidenceProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  provenance: FitEvaluationResult["provenance"];
  fitScore: number;
  verdictHeadline: string;
}

export function ConfidenceProvenanceModal({
  isOpen,
  onClose,
  provenance,
  fitScore,
  verdictHeadline,
}: ConfidenceProvenanceModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provenance-modal-title"
    >
      <div className="bg-surface-card w-full max-w-lg rounded-3xl border border-border-strong shadow-2xl p-6 sm:p-7 space-y-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center border border-status-success/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="provenance-modal-title" className="text-base font-bold text-content-strong">
                How We Know This
              </h2>
              <p className="text-xs text-content-muted">
                Confidence Provenance & Verification Breakdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-2 rounded-xl text-content-muted hover:text-content-strong hover:bg-surface-elevated transition-colors"
            aria-label="Close provenance dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confidence Tier Badge */}
        <div className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
              Calculated Verdict
            </span>
            <div className="text-sm font-extrabold text-content-strong mt-0.5">
              {verdictHeadline} ({fitScore}/100)
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            {provenance.confidenceTier}
          </span>
        </div>

        {/* Evidence Points Checklist */}
        <div className="space-y-2.5">
          <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider block">
            Verification Facts
          </span>
          <div className="space-y-2">
            {provenance.evidencePoints.map((point, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-surface-elevated/70 border border-border-subtle flex items-start gap-3"
              >
                <div className="mt-0.5 shrink-0">
                  {point.status === "exact" ? (
                    <CheckCircle2 className="h-4 w-4 text-status-success" />
                  ) : point.status === "estimate" ? (
                    <span className="text-xs font-bold text-status-warning font-mono">≈</span>
                  ) : (
                    <span className="text-xs font-bold text-brand-violet font-mono">⚙</span>
                  )}
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-content-strong">{point.label}</div>
                  <div className="text-[11px] text-content-muted font-mono mt-0.5">{point.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engine & Dataset Provenance Footer */}
        <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-content-muted gap-2 font-mono">
          <div className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-brand-primary" />
            <span>{provenance.engineVersion}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-content-muted" />
            <span>Dataset: {provenance.datasetDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
