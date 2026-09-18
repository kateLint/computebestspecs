"use client";

import React, { useState, useMemo } from "react";
import { parseNaturalLanguageSpec } from "@/services/normalization/natural-language-spec-parser";
import { HardwareProfile } from "@/lib/domain/hardware";
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle } from "lucide-react";
import { HorizontalScrollContainer } from "@/components/HorizontalScrollContainer";
import { ComputeCompanion } from "@/components/mascot/ComputeCompanion";

interface NaturalLanguageSpecInputProps {
  onApplyParsedHardware: (hardware: HardwareProfile) => void;
}

const POPULAR_SPEC_TEMPLATES = [
  { label: "MacBook Pro M3 Max (36GB)", text: "Apple M3 Max 16-core, 36GB RAM, 1TB SSD, macOS", icon: "🍏" },
  { label: "Gaming Laptop: i7 + RTX 4060", text: "Intel Core i7-13700H, RTX 4060 Laptop 8GB, 32GB RAM, Windows 11", icon: "🎮" },
  { label: "High-End PC: i9 + RTX 4090", text: "Intel Core i9-14900K, RTX 4090 24GB, 64GB RAM, 2TB SSD, Windows 11", icon: "🖥️" },
  { label: "Creator: Ryzen 7 + RTX 4070", text: "AMD Ryzen 7 7700X, RTX 4070 12GB, 32GB RAM, 1TB SSD", icon: "🎨" },
  { label: "MacBook Air M2 (16GB)", text: "Apple M2 8-core, 16GB RAM, 512GB SSD, macOS", icon: "💻" },
  { label: "Budget: Ryzen 5 + RTX 3050", text: "Ryzen 5 5600H, RTX 3050 4GB, 16GB RAM, 512GB SSD", icon: "⚡" },
];

export function NaturalLanguageSpecInput({ onApplyParsedHardware }: NaturalLanguageSpecInputProps) {
  const [inputText, setInputText] = useState("i7 laptop, RTX 4060, 16GB RAM, 512GB SSD");
  const [isFocused, setIsFocused] = useState(false);
  const [showAmbiguityModal, setShowAmbiguityModal] = useState(false);
  const [ambiguousCandidate, setAmbiguousCandidate] = useState<{ query: string; options: string[] } | null>(null);

  const parsedResult = parseNaturalLanguageSpec(inputText);

  // Suggestions matching user typing
  const matchingSuggestions = useMemo(() => {
    if (!inputText.trim()) return POPULAR_SPEC_TEMPLATES;
    const q = inputText.toLowerCase().trim();
    const matched = POPULAR_SPEC_TEMPLATES.filter(
      t => t.label.toLowerCase().includes(q) || t.text.toLowerCase().includes(q)
    );
    return matched.length > 0 ? matched : POPULAR_SPEC_TEMPLATES.slice(0, 3);
  }, [inputText]);

  const handleApply = () => {
    // Check if there is ambiguity in GPU/CPU
    if (inputText.toLowerCase().includes("rtx 4070") && !inputText.toLowerCase().includes("laptop") && !inputText.toLowerCase().includes("desktop")) {
      setAmbiguousCandidate({
        query: "RTX 4070",
        options: ["RTX 4070 Desktop (12GB VRAM)", "RTX 4070 Laptop GPU (8GB VRAM)", "I am not sure"],
      });
      setShowAmbiguityModal(true);
      return;
    }

    onApplyParsedHardware(parsedResult.inferredHardware);
  };

  const handleSelectTemplate = (text: string) => {
    setInputText(text);
    setIsFocused(false);
  };

  const handleResolveAmbiguity = (choice: string) => {
    setShowAmbiguityModal(false);
    if (choice.includes("Laptop")) {
      const updated = {
        ...parsedResult.inferredHardware,
        gpu: {
          ...parsedResult.inferredHardware.gpu,
          model: "NVIDIA GeForce RTX 4070 Laptop GPU",
          vramGb: 8,
          laptopVariant: true,
        },
      };
      onApplyParsedHardware(updated as HardwareProfile);
    } else {
      onApplyParsedHardware(parsedResult.inferredHardware);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Box */}
      <div className="relative">
        <label className="block text-xs font-bold text-content-strong uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ComputeCompanion state="idle" size="sm" />
            <span>Describe Your Computer in Plain Text</span>
          </span>
          <span className="text-[10px] text-content-muted font-normal">e.g. &quot;M3 Pro MacBook 36GB&quot; or &quot;Ryzen 5, 3060, 16GB&quot;</span>
        </label>
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // delay blur so click on suggestion triggers
              setTimeout(() => setIsFocused(false), 200);
            }}
            placeholder='e.g. "i7-13700H laptop, RTX 4060, 16GB RAM, Windows 11"'
            className="flex-1 bg-surface-card border border-border-subtle hover:border-border-strong rounded-xl px-4 py-3 text-xs sm:text-sm text-content-strong placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <button
            type="button"
            onClick={handleApply}
            className="touch-target px-5 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span>Apply</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {isFocused && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-surface-card border border-border-strong rounded-2xl shadow-xl p-2 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="px-2.5 py-1 text-[10px] uppercase font-bold text-content-muted flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-primary" />
                <span>Suggested Specification Templates</span>
              </span>
              <span className="font-mono text-brand-primary">{matchingSuggestions.length} Options</span>
            </div>
            {matchingSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onMouseDown={() => handleSelectTemplate(item.text)}
                className="w-full text-left p-2 rounded-xl hover:bg-surface-elevated text-xs transition-colors flex items-center justify-between group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span>{item.icon}</span>
                    <span className="font-bold text-content-strong group-hover:text-brand-primary transition-colors truncate">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-content-muted truncate mt-0.5 font-mono">
                    {item.text}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Use Spec →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Spec Chips with Left/Right Buttons */}
      <div className="flex items-center gap-1.5 min-w-0 py-0.5 text-[10px]">
        <span className="text-content-muted font-mono font-bold flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-brand-primary" />
          Templates:
        </span>
        <HorizontalScrollContainer buttonSize="sm" scrollStep={180} className="text-[10px]">
          {POPULAR_SPEC_TEMPLATES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectTemplate(item.text)}
              className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-content-body hover:text-content-strong border border-border-subtle hover:border-brand-primary/40 font-mono transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </HorizontalScrollContainer>
      </div>

      {/* Instant Parsed Chips */}
      <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-content-muted flex items-center justify-between">
          <span>Detected Components</span>
          <span className="text-status-success font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {parsedResult.confidence}% Confidence
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase font-bold block">CPU</span>
            <span className="font-semibold text-content-strong truncate block mt-0.5">
              {parsedResult.inferredHardware.cpu.model}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase font-bold block">GPU</span>
            <span className="font-semibold text-content-strong truncate block mt-0.5">
              {parsedResult.inferredHardware.gpu?.model || "Integrated"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase font-bold block">Memory</span>
            <span className="font-semibold text-content-strong block mt-0.5">
              {parsedResult.inferredHardware.ram.totalGb} GB RAM
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle">
            <span className="text-[9px] text-content-muted uppercase font-bold block">OS</span>
            <span className="font-semibold text-content-strong capitalize block mt-0.5">
              {parsedResult.inferredHardware.os.family} {parsedResult.inferredHardware.os.version || ""}
            </span>
          </div>
        </div>
      </div>

      {/* Ambiguity Resolution Modal */}
      {showAmbiguityModal && ambiguousCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
          <div className="bg-surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border-strong text-content-strong space-y-4">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
              <ComputeCompanion state="ambiguity" size="sm" />
              <span>Specification Clarification</span>
            </div>
            <p className="text-xs text-content-body">
              I found multiple hardware matches for <strong className="text-content-strong">&quot;{ambiguousCandidate.query}&quot;</strong>. Which one are you using?
            </p>
            <div className="space-y-2">
              {ambiguousCandidate.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleResolveAmbiguity(opt)}
                  className="touch-target w-full text-left p-3.5 rounded-xl bg-surface-elevated hover:bg-brand-primary/10 hover:border-brand-primary/40 border border-border-subtle text-xs font-semibold text-content-strong transition-all flex items-center justify-between"
                >
                  <span>{opt}</span>
                  <ArrowRight className="h-4 w-4 text-brand-primary" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
