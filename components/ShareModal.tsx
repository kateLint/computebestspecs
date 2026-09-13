"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon, QrCode, FileDown, Mail, Check, X } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  shareUrl?: string;
  score?: number;
  verdict?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  title = "ComputeBestSpecs PC Diagnostic Report",
  shareUrl,
  score,
  verdict,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const currentUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "https://computebestspecs.com");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`ComputeBestSpecs Evaluation: ${score ? `${score}/100 - ` : ""}${verdict || "Report"}`);
    const body = encodeURIComponent(`Check out this deterministic hardware compatibility evaluation on ComputeBestSpecs:\n\n${currentUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-surface-card border border-border-subtle rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-surface-elevated text-brand-primary">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-content-strong">Share Diagnostic Report</h3>
              <p className="text-[11px] text-content-muted">Authoritative snapshot link & export</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-2 rounded-xl text-content-muted hover:text-content-strong hover:bg-surface-elevated"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Share Action Grid (Touch Friendly >= 44px) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopy}
            className="touch-target flex flex-col items-center justify-center p-3 rounded-2xl border border-border-subtle bg-surface-subtle hover:bg-surface-elevated text-content-strong text-xs font-semibold gap-1.5 transition-all active:scale-[0.98]"
          >
            {copied ? <Check className="h-5 w-5 text-semantic-success" /> : <LinkIcon className="h-5 w-5 text-brand-primary" />}
            <span>{copied ? "Link Copied!" : "Copy Link"}</span>
          </button>

          {/* QR Code */}
          <button
            type="button"
            onClick={() => setShowQR(!showQR)}
            className="touch-target flex flex-col items-center justify-center p-3 rounded-2xl border border-border-subtle bg-surface-subtle hover:bg-surface-elevated text-content-strong text-xs font-semibold gap-1.5 transition-all active:scale-[0.98]"
          >
            <QrCode className="h-5 w-5 text-brand-cyan" />
            <span>{showQR ? "Hide QR" : "Show QR Code"}</span>
          </button>

          {/* Download / Print PDF */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="touch-target flex flex-col items-center justify-center p-3 rounded-2xl border border-border-subtle bg-surface-subtle hover:bg-surface-elevated text-content-strong text-xs font-semibold gap-1.5 transition-all active:scale-[0.98]"
          >
            <FileDown className="h-5 w-5 text-semantic-success" />
            <span>Print / PDF</span>
          </button>

          {/* Email Report */}
          <button
            type="button"
            onClick={handleEmail}
            className="touch-target flex flex-col items-center justify-center p-3 rounded-2xl border border-border-subtle bg-surface-subtle hover:bg-surface-elevated text-content-strong text-xs font-semibold gap-1.5 transition-all active:scale-[0.98]"
          >
            <Mail className="h-5 w-5 text-brand-violet" />
            <span>Email Report</span>
          </button>
        </div>

        {/* QR Code View */}
        {showQR && (
          <div className="p-4 bg-surface-subtle rounded-2xl border border-border-subtle flex flex-col items-center justify-center gap-2 text-center">
            {/* Clean SVG QR Placeholder / Mock Matrix for fast rendering without external bloat */}
            <div className="w-36 h-36 bg-white p-2 rounded-xl border border-border-subtle flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 100 100" className="w-full h-full text-obsidian fill-current">
                <rect x="10" y="10" width="30" height="30" rx="4" />
                <rect x="60" y="10" width="30" height="30" rx="4" />
                <rect x="10" y="60" width="30" height="30" rx="4" />
                <rect x="18" y="18" width="14" height="14" fill="white" />
                <rect x="68" y="18" width="14" height="14" fill="white" />
                <rect x="18" y="68" width="14" height="14" fill="white" />
                <rect x="22" y="22" width="6" height="6" fill="black" />
                <rect x="72" y="22" width="6" height="6" fill="black" />
                <rect x="22" y="72" width="6" height="6" fill="black" />
                <rect x="48" y="48" width="10" height="10" />
                <rect x="65" y="55" width="8" height="15" />
                <rect x="55" y="70" width="20" height="10" />
                <rect x="48" y="20" width="6" height="18" />
                <rect x="80" y="80" width="10" height="10" />
              </svg>
            </div>
            <p className="text-[11px] font-mono text-content-muted">Scan to open evaluation snapshot on mobile</p>
          </div>
        )}

        {/* Raw URL Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-content-muted">Snapshot URL</label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-subtle border border-border-subtle">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="bg-transparent text-xs font-mono text-content-body flex-1 focus:outline-none select-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
