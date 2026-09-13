"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/observability/analytics/client";

export function HomeAnalyticsTracker() {
  useEffect(() => {
    analytics.track("homepage_viewed", {
      entrySource: typeof document !== "undefined" && document.referrer ? "referral" : "direct",
    });
  }, []);

  return null;
}
