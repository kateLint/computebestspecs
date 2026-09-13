"use client";

import React from "react";
import { ExternalLink, Tag } from "lucide-react";
import { RetailOffer } from "@/lib/monetization/types";
import { isValidAffiliateDestination } from "@/lib/monetization/affiliate-allowlist";
import { analytics } from "@/lib/observability/analytics/client";

interface RetailOfferCardProps {
  offer: RetailOffer;
}

export function RetailOfferCard({ offer }: RetailOfferCardProps) {
  const isAllowed = isValidAffiliateDestination(offer.destinationUrl);

  if (!isAllowed) {
    return null; // Suppress invalid/unsafe external links
  }

  const handleClick = () => {
    analytics.track("affiliate_link_clicked", {
      retailerId: offer.retailerId,
      offerRegion: offer.region,
      currency: offer.currency,
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle hover:border-brand-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-content-strong font-mono">{offer.retailerName}</span>
          {offer.sponsored && (
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Sponsored
            </span>
          )}
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
              offer.priceType === "live"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : offer.priceType === "dated_estimate"
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-surface-subtle text-content-muted"
            }`}
          >
            {offer.priceType === "live"
              ? "Live Quote"
              : offer.priceType === "dated_estimate"
              ? "Estimated Price"
              : "Price Unavailable"}
          </span>
        </div>
        <p className="text-xs text-content-body font-medium line-clamp-1">{offer.title}</p>
        {offer.observedAt && (
          <span className="text-[10px] text-content-muted font-mono block">
            Observed: {new Date(offer.observedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0">
        {offer.price !== null && (
          <div className="text-right">
            <span className="text-sm font-extrabold font-mono text-content-strong">
              {offer.currency === "USD" ? "$" : offer.currency === "ILS" ? "₪" : "€"}
              {offer.price.toLocaleString()}
            </span>
          </div>
        )}

        <a
          href={offer.destinationUrl}
          target="_blank"
          rel="sponsored nofollow noopener"
          onClick={handleClick}
          className="touch-target px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <span>View Offer</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
