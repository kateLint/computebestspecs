"use client";

import React, { useState } from "react";
import { UserNeedsProfile, PersonaTemplate } from "@/lib/domain/needs-profile";
import { PERSONAS_CATALOG } from "@/services/needs/personas-catalog";
import { parseNaturalLanguageNeeds } from "@/services/needs/natural-language-needs-parser";
import { Sparkles, MessageSquareText, Layers, Check, ArrowRight, UserCheck } from "lucide-react";

interface NeedsIntakeWizardProps {
  onProfileGenerated: (profile: UserNeedsProfile) => void;
  initialProfile?: UserNeedsProfile;
}

export function NeedsIntakeWizard({ onProfileGenerated }: NeedsIntakeWizardProps) {
  const [intakeMode, setIntakeMode] = useState<"describe" | "persona">("describe");
  const [promptText, setPromptText] = useState(
    "I'm a full-stack developer. I use VS Code, Docker with 6 containers, Chrome with around 30 tabs, PostgreSQL, and I want a local AI coding agent."
  );
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("persona-fullstack-dev");

  const handleParsePrompt = () => {
    const parsed = parseNaturalLanguageNeeds(promptText);
    onProfileGenerated(parsed);
  };

  const handleSelectPersona = (persona: PersonaTemplate) => {
    setSelectedPersonaId(persona.id);
    const profile: UserNeedsProfile = {
      id: `profile-${persona.id}`,
      personaId: persona.id,
      primaryGoal: persona.description,
      weights: persona.weights,
      workloads: persona.typicalWorkloads,
      agentProfile: persona.defaultAgentProfile,
      targetLongevityYears: 3,
    };
    onProfileGenerated(profile);
  };

  return (
    <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-6 shadow-sm">
      {/* Intake Method Toggle */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-brand-primary">
            Step 1: Goal Definition
          </span>
          <h2 className="text-base sm:text-lg font-bold text-content-strong font-mono">
            What Do You Want to Accomplish?
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border-subtle font-mono text-xs">
          <button
            type="button"
            onClick={() => setIntakeMode("describe")}
            className={`touch-target px-3 py-1 rounded-lg font-bold transition-all ${
              intakeMode === "describe"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-content-muted hover:text-content-strong"
            }`}
          >
            Describe in Words
          </button>
          <button
            type="button"
            onClick={() => setIntakeMode("persona")}
            className={`touch-target px-3 py-1 rounded-lg font-bold transition-all ${
              intakeMode === "persona"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-content-muted hover:text-content-strong"
            }`}
          >
            Select Persona
          </button>
        </div>
      </div>

      {intakeMode === "describe" ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-content-strong flex items-center gap-1.5">
              <MessageSquareText className="h-4 w-4 text-brand-primary" />
              Describe your day-to-day workflow, apps, and budget:
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g., Computer science student using Android Studio, Docker, Chrome tabs, and local coding AI with $1200 budget..."
              className="w-full p-3.5 rounded-2xl bg-surface-subtle border border-border-subtle text-xs font-mono text-content-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                "Full-Stack Dev + Local AI",
                "CS Student + Android",
                "Video Editor 4K",
                "3D Artist Blender/UE5",
              ].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => {
                    if (pill.includes("Full-Stack")) {
                      setPromptText("Full-stack developer with VS Code, Docker 6 containers, 30 Chrome tabs, and local 14B coding AI.");
                    } else if (pill.includes("CS Student")) {
                      setPromptText("CS Student doing algorithms, Android Studio, Linux VM, lightweight local AI with 8+ hours battery.");
                    } else if (pill.includes("Video Editor")) {
                      setPromptText("4K video editing in Premiere Pro, After Effects motion graphics, and background Media Encoder exports.");
                    } else if (pill.includes("3D Artist")) {
                      setPromptText("3D artist in Blender Cycles rendering, Unreal Engine 5 level design, and 8K Photoshop textures.");
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-[11px] font-mono border border-border-subtle text-content-muted hover:text-content-strong transition-all"
                >
                  {pill}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleParsePrompt}
              className="touch-target px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span>Build Scenario Matrix</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-content-body font-mono">
            Choose a calibrated persona profile. You can customize all apps and weights afterward:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PERSONAS_CATALOG.map((persona) => {
              const isSelected = selectedPersonaId === persona.id;

              return (
                <div
                  key={persona.id}
                  onClick={() => handleSelectPersona(persona)}
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-3 transition-all ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/40 shadow-sm"
                      : "border-border-subtle bg-surface-subtle hover:bg-surface-elevated"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-surface-card border border-border-subtle text-content-muted">
                        {persona.category}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-brand-primary" />}
                    </div>
                    <h4 className="text-xs font-bold text-content-strong font-mono">{persona.title}</h4>
                    <p className="text-[11px] text-content-body leading-normal font-sans line-clamp-2">
                      {persona.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-content-muted">
                    <span>Rec RAM: {persona.recommendedHardwareBaseline.recRamGb}GB</span>
                    <span className="text-brand-primary font-bold">{persona.typicalWorkloads.length} Apps</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
