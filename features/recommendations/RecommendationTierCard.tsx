import Link from "next/link";
import { RecommendedHardwareTier } from "@/lib/domain/recommendation";
import { Cpu, HardDrive, Monitor, CheckCircle2, Layers, Zap, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

interface RecommendationTierCardProps {
  tier: RecommendedHardwareTier;
  isPopular?: boolean;
  tierRole?: "entry" | "best_fit" | "high_headroom";
}

export function RecommendationTierCard({ tier, isPopular, tierRole = "best_fit" }: RecommendationTierCardProps) {
  const isBestFit = isPopular || tierRole === "best_fit" || tier.tierName.toLowerCase().includes("recommended");
  const isHighHeadroom = tierRole === "high_headroom" || tier.tierName.toLowerCase().includes("professional");

  // Encode recommended specs into /check URL with prefilled specs
  const checkHwParams = new URLSearchParams({
    cpu: tier.cpu.exampleModels[0] || tier.cpu.description,
    gpu: tier.gpu.exampleModels[0] || tier.gpu.description,
    ram: String(tier.ramGb),
  }).toString();

  return (
    <div
      className={`p-6 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden shadow-sm ${
        isBestFit
          ? "bg-surface-card border-brand-primary/50 ring-2 ring-brand-primary/30 shadow-md"
          : "bg-surface-card border-border-subtle hover:border-border-strong"
      }`}
    >
      {isBestFit && (
        <div className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
          ★ Recommended Baseline
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          {isHighHeadroom && <Sparkles className="h-4 w-4 text-brand-violet" />}
          {isBestFit && <Zap className="h-4 w-4 text-brand-primary" />}
          {!isHighHeadroom && !isBestFit && <CheckCircle2 className="h-4 w-4 text-status-success" />}
          <h3 className="text-lg font-bold text-content-strong tracking-tight">{tier.tierName}</h3>
        </div>
        <p className="text-xs text-content-body mb-6 leading-relaxed">
          {tier.tierDescription}
        </p>

        {/* Specs List */}
        <div className="space-y-4 border-t border-border-subtle pt-4">
          {/* CPU */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-medium text-content-muted uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-brand-primary" />
              Target Processor (CPU)
            </span>
            <p className="text-xs font-semibold text-content-strong font-mono">{tier.cpu.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {tier.cpu.exampleModels.map((m) => (
                <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-content-muted border border-border-subtle">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Memory */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-medium text-content-muted uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-brand-cyan" />
              Target Memory (RAM)
            </span>
            <p className="text-sm font-mono font-bold text-content-strong">{tier.ramGb} GB RAM</p>
            <p className="text-[11px] font-mono text-content-muted">{tier.ramType}</p>
          </div>

          {/* Graphics */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-medium text-content-muted uppercase tracking-wider flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5 text-brand-violet" />
              Target Graphics (GPU)
            </span>
            <p className="text-xs font-semibold text-content-strong font-mono">{tier.gpu.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {tier.gpu.exampleModels.map((m) => (
                <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-content-muted border border-border-subtle">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-medium text-content-muted uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-status-success" />
              Storage Spec
            </span>
            <p className="text-xs font-semibold text-content-strong font-mono">{tier.storage.description}</p>
          </div>
        </div>

        {/* Experience & Trade-offs */}
        <div className="mt-5 pt-4 border-t border-border-subtle space-y-2 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-content-muted block mb-0.5">Target Experience:</span>
            <p className="text-content-body italic">{tier.targetExperience}</p>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-mono uppercase font-bold text-content-muted block mb-1">Key Trade-off:</span>
            <div className="text-[11px] text-content-muted flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-status-warning shrink-0 mt-0.5" />
              <span>
                {isBestFit
                  ? "Sufficient memory and compute for concurrent workloads; higher price than entry office machines."
                  : isHighHeadroom
                  ? "Maximum headroom for future workload growth; higher initial purchase price and power draw."
                  : "Lowest acquisition cost; limited multitasking headroom during heavy peak sessions."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Action Link to evaluate in Check */}
      <div className="mt-6 pt-4 border-t border-border-subtle">
        <Link
          href={`/check?${checkHwParams}`}
          className={`touch-target w-full py-2.5 px-3 rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            isBestFit
              ? "bg-brand-primary text-white hover:bg-brand-primary-hover"
              : "bg-surface-elevated text-content-strong hover:bg-surface-secondary border border-border-subtle"
          }`}
        >
          <span>Evaluate This Spec</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}


