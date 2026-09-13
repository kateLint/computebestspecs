"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { errors } from "@/lib/observability/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    errors.captureException(error, {
      extra: { digest: error.digest },
    });
  }, [error]);

  const errorCode = error.digest ? `ERR_${error.digest.slice(0, 8)}` : "ERR_UNHANDLED_PAGE_EXCEPTION";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-6 animate-fade-in font-sans">
      <div className="inline-flex p-3 rounded-2xl bg-status-danger/10 text-status-danger border border-status-danger/20">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-content-strong">Unable to Load Screen</h1>
        <p className="text-xs text-content-body leading-relaxed max-w-sm mx-auto">
          We encountered a problem rendering this page. You can retry the action or return to the main dashboard.
        </p>
        <div className="inline-block px-3 py-1 rounded-lg bg-surface-subtle text-[10px] font-mono text-content-muted border border-border-subtle">
          Incident ID: <strong className="text-content-strong">{errorCode}</strong>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="touch-target w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-md transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="touch-target w-full sm:w-auto px-6 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-secondary text-content-strong border border-border-subtle text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
