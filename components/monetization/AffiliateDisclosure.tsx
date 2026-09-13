import React from "react";
import { Info } from "lucide-react";

export function AffiliateDisclosure() {
  return (
    <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle flex items-start gap-2 text-[11px] text-content-muted leading-relaxed">
      <Info className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
      <div>
        <span className="font-bold text-content-strong">Affiliate Disclosure: </span>
        <span>
          ComputeBestSpecs may earn an affiliate commission when you purchase hardware through our links. Hardware recommendations are strictly deterministic and calculated purely from workload demands; rankings are never altered by commercial partnerships.
        </span>
      </div>
    </div>
  );
}
