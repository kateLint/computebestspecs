"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Edit3,
  Check,
  Cpu,
  Tv,
  Layers,
  HardDrive,
  Monitor,
  Sparkles,
} from "lucide-react";
import { ComputerProfile, FieldConfirmationState, createDefaultComputerProfile } from "@/lib/domain/computer-profile";

interface SpecConfirmationViewProps {
  profile?: ComputerProfile;
  initialProfile?: ComputerProfile;
  ambiguities?: {
    field: "cpu" | "gpu" | "ram" | "storage" | "os";
    question: string;
    options: { id: string; label: string; details?: string }[];
  }[];
  onConfirm: (confirmedProfile: ComputerProfile) => void;
  onCancel?: () => void;
  onBack?: () => void;
}

export function SpecConfirmationView(props: SpecConfirmationViewProps) {
  const { onConfirm, onCancel, onBack, ambiguities = [] } = props;
  const effectiveInitial = props.initialProfile || props.profile || createDefaultComputerProfile();
  const [profile, setProfile] = useState<ComputerProfile>(effectiveInitial);
  const [activeAmbiguities, setActiveAmbiguities] = useState(ambiguities);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) onBack();
    else if (onCancel) onCancel();
  };

  const handleResolveAmbiguity = (field: "cpu" | "gpu", selectedOptionId: string) => {
    setProfile((prev) => {
      const updated: ComputerProfile = { ...prev };

      if (field === "cpu") {
        const candidate = prev.cpu.candidates?.find((c) => c.id === selectedOptionId);
        if (candidate) {
          updated.cpu = {
            ...prev.cpu,
            value: {
              ...prev.cpu.value,
              model: candidate.displayName,
              catalogId: candidate.id,
            },
            confidence: 1.0,
            state: "confirmed",
          };
        }
      } else if (field === "gpu") {
        const candidate = prev.gpu.candidates?.find((c) => c.id === selectedOptionId);
        if (candidate) {
          updated.gpu = {
            ...prev.gpu,
            value: {
              ...prev.gpu.value,
              model: candidate.displayName,
              catalogId: candidate.id,
              variant: candidate.variant || "desktop",
            },
            confidence: 1.0,
            state: "confirmed",
          };
        }
      }

      return updated;
    });

    setActiveAmbiguities((prev) => prev.filter((a) => a.field !== field));
  };


  const handleFieldConfirm = (fieldKey: "cpu" | "gpu" | "ram" | "storage" | "os") => {
    setProfile((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        state: "confirmed",
        confidence: 1.0,
      },
    }));
  };

  const isReadyToEvaluate = activeAmbiguities.length === 0;

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Step Header */}
      <div className="border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2 text-brand-primary text-xs font-mono mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>STEP 2: REVIEW & CONFIRM DETECTED HARDWARE</span>
        </div>
        <h3 className="text-xl font-bold text-content-strong">
          Confirm Your Imported Specifications
        </h3>
        <p className="text-xs text-content-body mt-1 leading-relaxed">
          Please review the detected components below. The deterministic engine uses these verified values to calculate exact compatibility and bottlenecks.
        </p>
      </div>

      {/* Ambiguity Resolution Alerts */}
      {activeAmbiguities.map((amb) => (
        <div
          key={amb.field}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-3 shadow-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-content-strong block">Clarification Needed:</span>
              <p className="text-content-body mt-0.5">{amb.question}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {amb.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleResolveAmbiguity(amb.field as any, opt.id)}
                className="p-3 rounded-xl bg-surface-card hover:bg-surface-elevated border border-amber-500/30 hover:border-brand-primary text-left transition-all group"
              >
                <span className="font-bold text-content-strong text-xs group-hover:text-brand-primary block">
                  {opt.label}
                </span>
                {opt.details && (
                  <span className="text-[11px] text-content-muted block mt-0.5">{opt.details}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Verified Specification Grid */}
      <div className="space-y-3">
        {/* CPU */}
        <FieldCard
          icon={<Cpu className="w-4 h-4 text-brand-primary" />}
          label="Processor (CPU)"
          value={profile.cpu.value.model}
          confidence={profile.cpu.confidence}
          state={profile.cpu.state}
          rawSnippet={profile.cpu.rawText}
          onConfirm={() => handleFieldConfirm("cpu")}
        />

        {/* GPU */}
        <FieldCard
          icon={<Tv className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
          label="Graphics Processor (GPU)"
          value={`${profile.gpu.value.model} ${profile.gpu.value.variant === "laptop" ? "(Laptop GPU)" : ""}`}
          confidence={profile.gpu.confidence}
          state={profile.gpu.state}
          rawSnippet={profile.gpu.rawText}
          onConfirm={() => handleFieldConfirm("gpu")}
        />

        {/* RAM */}
        <FieldCard
          icon={<Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          label="System Memory (RAM)"
          value={`${profile.ram.value.capacityGb} GB ${profile.ram.value.generation || ""}`}
          confidence={profile.ram.confidence}
          state={profile.ram.state}
          rawSnippet={profile.ram.rawText}
          onConfirm={() => handleFieldConfirm("ram")}
        />

        {/* Storage */}
        <FieldCard
          icon={<HardDrive className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
          label="Storage Drive"
          value={`${profile.storage.value.totalCapacityGb >= 1000 ? `${profile.storage.value.totalCapacityGb / 1000} TB` : `${profile.storage.value.totalCapacityGb} GB`} NVMe / SSD`}
          confidence={profile.storage.confidence}
          state={profile.storage.state}
          rawSnippet={profile.storage.rawText}
          onConfirm={() => handleFieldConfirm("storage")}
        />

        {/* OS */}
        <FieldCard
          icon={<Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          label="Operating System"
          value={`${profile.os.value.family.toUpperCase()} ${profile.os.value.versionString || ""}`}
          confidence={profile.os.confidence}
          state={profile.os.state}
          rawSnippet={profile.os.rawText}
          onConfirm={() => handleFieldConfirm("os")}
        />
      </div>

      {/* Footer Action Dock */}
      <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-content-muted hover:text-content-strong transition-colors"
        >
          Cancel & Edit Manually
        </button>

        <button
          type="button"
          disabled={!isReadyToEvaluate}
          onClick={() => onConfirm(profile)}
          className={`touch-target px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
            isReadyToEvaluate
              ? "bg-brand-primary hover:bg-brand-primary-hover text-[var(--on-brand)] shadow-xs"
              : "bg-surface-elevated text-content-muted cursor-not-allowed"
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Confirm & Apply to PC Check</span>
        </button>
      </div>
    </div>
  );
}

function FieldCard({
  icon,
  label,
  value,
  confidence,
  state,
  rawSnippet,
  onConfirm,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  confidence: number;
  state: FieldConfirmationState;
  rawSnippet?: string;
  onConfirm: () => void;
}) {
  const isConfirmed = state === "confirmed";

  return (
    <div className="p-3.5 rounded-2xl bg-surface-card border border-border-subtle flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-xl bg-surface-subtle shrink-0 border border-border-subtle">{icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
              {label}
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isConfirmed
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : confidence >= 0.8
                  ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {isConfirmed ? "Confirmed" : `${Math.round(confidence * 100)}% confidence`}
            </span>
          </div>
          <span className="text-xs font-bold text-content-strong truncate block mt-0.5">
            {value}
          </span>
          {rawSnippet && (
            <span className="text-[10px] text-content-muted truncate block font-mono">
              Detected from: &quot;{rawSnippet}&quot;
            </span>
          )}
        </div>
      </div>

      {!isConfirmed && (
        <button
          type="button"
          onClick={onConfirm}
          className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-brand-primary text-xs font-semibold shrink-0 border border-border-subtle transition-colors"
        >
          Confirm
        </button>
      )}
    </div>
  );
}
