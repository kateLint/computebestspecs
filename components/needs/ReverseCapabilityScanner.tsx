"use client";

import React from "react";
import { CheckCircle2, ThumbsUp, AlertTriangle, Sparkles } from "lucide-react";
import { FitEvaluationResult } from "@/lib/domain/needs-profile";

interface ReverseCapabilityScannerProps {
  capabilityMap: FitEvaluationResult["capabilityMap"];
}

export function ReverseCapabilityScanner({ capabilityMap }: ReverseCapabilityScannerProps) {
  return (
    <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-cyan">
            Hardware Strengths & Limits
          </span>
          <h3 className="text-base font-bold text-content-strong font-mono flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-cyan" />
            What is this PC Actually Good At?
          </h3>
        </div>
        <span className="text-xs text-content-muted font-mono">Domain Capability Profile</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Excellent For */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
            <CheckCircle2 className="h-4 w-4" />
            <span>Excellent Performance</span>
          </div>
          <ul className="space-y-1.5 text-content-strong text-[11px] font-sans">
            {capabilityMap.excellentFor.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Good For */}
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-[11px]">
            <ThumbsUp className="h-4 w-4" />
            <span>Good / Usable</span>
          </div>
          <ul className="space-y-1.5 text-content-body text-[11px] font-sans">
            {capabilityMap.goodFor.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Poor Fit For */}
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[11px]">
            <AlertTriangle className="h-4 w-4" />
            <span>Poor Fit / Constrained</span>
          </div>
          <ul className="space-y-1.5 text-content-muted text-[11px] font-sans">
            {capabilityMap.poorFitFor.length > 0 ? (
              capabilityMap.poorFitFor.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-[11px] text-content-muted">No severe limitations found.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
