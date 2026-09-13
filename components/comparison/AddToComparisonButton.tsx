"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Check, AlertCircle, ArrowRight } from "lucide-react";
import { addComputerToComparison, getComparisonSet, MAX_COMPARISON_ITEMS } from "@/lib/comparison/storage";
import { HardwareProfile } from "@/lib/domain/hardware";
import { SelectedWorkload } from "@/lib/domain/software";

interface AddToComparisonButtonProps {
  hardware: HardwareProfile;
  workloads: SelectedWorkload[];
  isSimultaneous: boolean;
  score?: number;
  status?: string;
  defaultName?: string;
  className?: string;
}

export function AddToComparisonButton({
  hardware,
  workloads,
  isSimultaneous,
  score,
  status,
  defaultName,
  className,
}: AddToComparisonButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState(
    defaultName || `${hardware.cpu?.model || "My PC"} (${hardware.ram?.totalGb || 16}GB)`
  );
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleAdd = () => {
    const cpuName = hardware.cpu?.model || "Standard Processor";
    const gpuName = hardware.gpu?.model || "Standard Graphics";
    const ramGb = hardware.ram?.totalGb || 16;
    const storageGb = hardware.storage?.[0]?.totalGb || 512;
    const osName = hardware.os?.family || "Windows 11";
    const formFactor =
      hardware.deviceType === "laptop"
        ? "laptop"
        : hardware.deviceType === "mini-pc"
        ? "mini_pc"
        : "desktop";

    const res = addComputerToComparison({
      name: customName.trim() || `${cpuName} Rig`,
      hardware: {
        cpu: cpuName,
        gpu: gpuName,
        ramGb,
        storageGb,
        os: osName,
        formFactor,
        rawHardwareProfile: hardware,
      },
      workloads,
      isSimultaneous,
      engineVersion: "1.0.0",
      catalogVersion: "1.0.0",
      cachedScore: score,
      cachedStatus: status,
    });

    if (res.success) {
      setFeedback({
        success: true,
        message: "Saved to comparison set (Slot " + getComparisonSet().items.length + "/3).",
      });
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } else {
      setFeedback({
        success: false,
        message: res.reason || "Could not add to comparison.",
      });
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        id="cbs-add-to-comparison-btn"
        onClick={() => {
          setFeedback(null);
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-subtle hover:bg-surface-elevated text-cyan-400 hover:text-cyan-300 border border-border-subtle hover:border-cyan-500/40 shadow-xs transition-all ${className ?? ""}`}
      >
        <Scale className="w-4 h-4" />
        <span>Add to Comparison</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-2xl z-50 text-left">
          <h4 className="text-xs font-bold text-content-strong flex items-center justify-between">
            <span>Save to Comparison</span>
            <span className="text-[11px] font-mono text-cyan-400">
              {getComparisonSet().items.length}/{MAX_COMPARISON_ITEMS} slots
            </span>
          </h4>

          <div className="mt-3">
            <label className="block text-[11px] text-content-muted font-medium mb-1">
              Computer Label:
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              maxLength={60}
              placeholder="e.g. My Current Laptop"
              className="w-full px-2.5 py-1.5 rounded-xl bg-surface-subtle border border-border-subtle text-xs text-content-strong focus:outline-none focus:border-brand-primary"
            />
          </div>

          {feedback && (
            <div
              className={`mt-2.5 p-2 rounded-xl text-xs flex items-start gap-1.5 ${
                feedback.success
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
              }`}
            >
              {feedback.success ? (
                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="mt-3.5 flex items-center justify-between gap-2">
            {feedback?.success ? (
              <button
                type="button"
                onClick={() => router.push("/compare")}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors"
              >
                <span>View Comparison</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1.5 text-xs text-content-muted hover:text-content-strong"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Confirm & Save
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
