"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { errors } from "@/lib/observability/errors";

export default function GlobalError({
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

  const errorCode = error.digest ? `ERR_${error.digest.slice(0, 8)}` : "ERR_APPLICATION_EXCEPTION";

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Something went wrong</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected error occurred during processing. Our diagnostic telemetry has been notified.
            </p>
            <div className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
              Reference: <strong className="text-slate-200">{errorCode}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="touch-target w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
            <a
              href="/"
              className="touch-target w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Return Home</span>
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
