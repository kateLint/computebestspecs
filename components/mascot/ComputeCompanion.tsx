"use client";

import React from "react";
import { motion, useReducedMotion, TargetAndTransition } from "framer-motion";
import { PRECISION_EASING } from "@/lib/motion/motion-config";

export type CompanionState =
  | "idle"
  | "thinking"
  | "success"
  | "warning"
  | "ambiguity"
  | "spill"
  | "error"
  | "unknown";

export interface ComputeCompanionProps {
  state?: CompanionState;
  size?: "sm" | "md" | "lg";
  caption?: string;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { w: 26, h: 26, text: "text-[10px]" },
  md: { w: 34, h: 34, text: "text-xs" },
  lg: { w: 46, h: 46, text: "text-sm" },
} as const;

interface MoodSpec {
  ledColor: string;
  glowColor: string;
  label: string;
}

const MOOD_CONFIG = {
  idle: {
    ledColor: "var(--brand-primary)",
    glowColor: "var(--glow-brand)",
    label: "Diagnostic Ready",
  },
  thinking: {
    ledColor: "var(--brand-violet)",
    glowColor: "var(--glow-violet)",
    label: "Evaluating Workload",
  },
  success: {
    ledColor: "var(--status-success)",
    glowColor: "var(--glow-success)",
    label: "Optimal Compatibility",
  },
  warning: {
    ledColor: "var(--status-warning)",
    glowColor: "var(--glow-warning)",
    label: "Bottleneck Detected",
  },
  ambiguity: {
    ledColor: "var(--brand-cyan)",
    glowColor: "var(--glow-cyan)",
    label: "Specification Clarification",
  },
  spill: {
    ledColor: "var(--status-warning)",
    glowColor: "var(--glow-warning)",
    label: "VRAM Offload Active",
  },
  error: {
    ledColor: "var(--status-danger)",
    glowColor: "var(--glow-danger)",
    label: "Hard Incompatibility",
  },
  unknown: {
    ledColor: "var(--status-unknown)",
    glowColor: "var(--glow-unknown)",
    label: "State Indeterminate",
  },
} satisfies Record<CompanionState, MoodSpec>;

const STATE_ANIMATIONS: Partial<Record<CompanionState, TargetAndTransition>> = {
  thinking: { scale: [1, 1.04, 1] },
  warning: { x: [0, -1.5, 1.5, 0] },
  spill: { x: [0, -1, 1, 0] },
  error: { x: [0, -2, 2, -1, 1, 0] },
  success: { y: [0, -2, 0] },
};

export function ComputeCompanion({
  state = "idle",
  size = "md",
  caption,
  className = "",
}: ComputeCompanionProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const dimensions = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const mood = MOOD_CONFIG[state] || MOOD_CONFIG.idle;

  return (
    <div
      role="status"
      aria-label={caption ? caption : mood.label}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {/* Precision Geometric Silicon Die Companion */}
      <motion.div
        animate={shouldReduceMotion ? undefined : STATE_ANIMATIONS[state]}
        transition={{ duration: 0.24, ease: PRECISION_EASING }}
        className="relative flex items-center justify-center shrink-0"
        style={{ width: dimensions.w, height: dimensions.h }}
        aria-hidden={caption ? "true" : undefined}
      >
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-xs"
        >
          {/* Top Micro Pins */}
          <line x1="10" y1="2" x2="10" y2="7" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="2" x2="22" y2="7" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="2" x2="34" y2="7" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />

          {/* Bottom Micro Pins */}
          <line x1="10" y1="37" x2="10" y2="42" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="37" x2="22" y2="42" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="37" x2="34" y2="42" stroke="var(--border-strong)" strokeWidth="2" strokeLinecap="round" />

          {/* Side Pins (Subtle at medium and large sizes) */}
          {size !== "sm" && (
            <>
              <line x1="2" y1="16" x2="7" y2="16" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="2" y1="28" x2="7" y2="28" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="37" y1="16" x2="42" y2="16" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="37" y1="28" x2="42" y2="28" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}

          {/* Chamfered Silicon Die Body */}
          <path
            d="M10 6 H34 L38 10 V34 L34 38 H10 L6 34 V10 Z"
            fill="var(--card-main)"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Die Corner Circuit Traces */}
          <path d="M11 11 L15 11" stroke="var(--border-subtle)" strokeWidth="1" />
          <path d="M11 11 L11 15" stroke="var(--border-subtle)" strokeWidth="1" />
          <path d="M33 11 L29 11" stroke="var(--border-subtle)" strokeWidth="1" />
          <path d="M33 11 L33 15" stroke="var(--border-subtle)" strokeWidth="1" />

          {/* LED Status Eyes */}
          {state === "ambiguity" ? (
            <>
              <circle cx="16" cy="22" r="2.5" fill={mood.ledColor} />
              <circle cx="28" cy="22" r="2.5" fill={mood.ledColor} />
            </>
          ) : (
            <>
              {/* Left LED Eye */}
              <circle
                cx="16"
                cy="22"
                r="2.75"
                fill={mood.ledColor}
                style={{ filter: `drop-shadow(0 0 2.5px ${mood.glowColor})` }}
              />
              {/* Right LED Eye */}
              <circle
                cx="28"
                cy="22"
                r="2.75"
                fill={mood.ledColor}
                style={{ filter: `drop-shadow(0 0 2.5px ${mood.glowColor})` }}
              />
            </>
          )}

          {/* Central Bus Interconnect Trace */}
          <line
            x1="16"
            y1="29"
            x2="28"
            y2="29"
            stroke="var(--border-subtle)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Contextual Caption (Sans typography) */}
      {caption && (
        <span className={`${dimensions.text} text-content-body font-medium leading-tight`}>
          {caption}
        </span>
      )}
    </div>
  );
}
