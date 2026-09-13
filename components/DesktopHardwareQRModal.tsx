"use client";

import { X, Smartphone, Copy, Check } from "lucide-react";
import { useState } from "react";
import { HardwareProfile } from "@/lib/domain/hardware";

interface DesktopHardwareQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardware: Partial<HardwareProfile>;
}

export function DesktopHardwareQRModal({
  isOpen,
  onClose,
  hardware,
}: DesktopHardwareQRModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Encode hardware specs into URL parameter
  const encodedHw = encodeURIComponent(
    JSON.stringify({
      cpu: hardware.cpu?.model,
      gpu: hardware.gpu?.model,
      ram: hardware.ram?.totalGb,
      os: hardware.os?.family,
    })
  );

  const transferUrl = typeof window !== "undefined"
    ? `${window.location.origin}/check?hw=${encodedHw}`
    : `https://computebestspecs.com/check?hw=${encodedHw}`;

  // Direct SVG QR Code Matrix representation
  const qrMatrix = [
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [1,1,0,1,0,1,1,1,0,1,0,1,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,0,1,1,0,1,0],
    [1,1,1,1,1,1,1,0,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,1,1,1,1],
    [1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,1,0,1,0,1,0],
    [1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,1,1],
    [1,1,1,1,1,1,1,0,1,1,0,1,1,0,0,1,0],
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(transferUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="surface-card w-full max-w-sm rounded-3xl border border-border-subtle shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-brand-primary" />
            <h3 id="qr-modal-title" className="text-sm font-bold text-content-strong font-mono">
              Open PC Specs on Mobile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-1.5 rounded-xl text-content-muted hover:text-content-strong hover:bg-surface-subtle transition-colors"
            aria-label="Close QR dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-content-body font-mono leading-relaxed">
          Scan this QR code with your smartphone camera to seamlessly load your current PC configuration:
        </p>

        {/* QR Code Container */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border-subtle flex flex-col items-center justify-center space-y-3 shadow-inner">
          <svg viewBox="0 0 17 17" className="w-44 h-44 shape-rendering-crispEdges">
            {qrMatrix.map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx}
                  y={rIdx}
                  width="1"
                  height="1"
                  fill={cell === 1 ? "#0F172A" : "transparent"}
                />
              ))
            )}
          </svg>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">
            {hardware.cpu?.model || "Standard Setup"} • {hardware.ram?.totalGb || 16}GB RAM
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="touch-target flex-1 py-2.5 rounded-xl bg-surface-subtle border border-border-subtle hover:bg-surface-elevated text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Link Copied!" : "Copy Transfer Link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
