"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Cpu, Layers, Database, Sparkles } from "lucide-react";
import { PRECISION_EASING } from "@/lib/motion/motion-config";

interface EvaluationRevealSequenceProps {
  onComplete: () => void;
}

const STEPS = [
  { id: "hardware", label: "Hardware Profile Identified", icon: Cpu },
  { id: "software", label: "Official Requirements Resolved", icon: Database },
  { id: "workload", label: "Concurrency Working Set Modeled", icon: Layers },
  { id: "compatibility", label: "Deterministic Compatibility Calculated", icon: Sparkles },
];

export function EvaluationRevealSequence({ onComplete }: EvaluationRevealSequenceProps) {
  const shouldReduceMotion = useReducedMotion();
  const [completedSteps, setCompletedSteps] = useState<number>(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete();
      return;
    }

    const stepInterval = 180; // Fast: 180ms per step = ~720ms total
    const timers: NodeJS.Timeout[] = [];

    STEPS.forEach((_, idx) => {
      const timer = setTimeout(() => {
        setCompletedSteps(idx + 1);
        if (idx === STEPS.length - 1) {
          setTimeout(onComplete, 200);
        }
      }, (idx + 1) * stepInterval);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [onComplete, shouldReduceMotion]);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/20 max-w-md mx-auto space-y-4 shadow-2xl">
      <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider flex items-center justify-between pb-2 border-b border-white/10">
        <span>Deterministic Pipeline</span>
        <span className="text-brand-400 font-mono">Precision Engine</span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {STEPS.map((step, idx) => {
          const isDone = completedSteps > idx;
          const isCurrent = completedSteps === idx;

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                isDone
                  ? "bg-slate-900/90 border-emerald-500/30 text-white"
                  : isCurrent
                  ? "bg-white/5 border-brand-500/50 text-slate-200 ring-1 ring-brand-500/30"
                  : "bg-transparent border-transparent text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <step.icon className={`h-4 w-4 ${isDone ? "text-emerald-400" : isCurrent ? "text-brand-400 animate-pulse" : "text-slate-600"}`} />
                <span>{step.label}</span>
              </div>

              {isDone && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15, ease: PRECISION_EASING }}
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
