"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import {
  getComparisonSet,
  removeComputerFromComparison,
  clearSavedComparisons,
  subscribeToComparisonSet,
  MAX_COMPARISON_ITEMS,
  exportComparisonSetToJson,
  importComparisonItemFromJson,
} from "@/lib/comparison/storage";
import { ComparisonSet, EvaluatedComparisonItem, ComparisonAnalysis } from "@/lib/comparison/types";
import { analyzeComparisonSet } from "@/lib/comparison/engine";
import { evaluateCompatibility } from "@/lib/engine/evaluate";

export default function ComparePage() {
  const router = useRouter();
  const [comparisonSet, setComparisonSet] = useState<ComparisonSet | null>(null);
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const current = getComparisonSet();
    setComparisonSet(current);
    recalculateComparison(current);

    const unsubscribe = subscribeToComparisonSet((set) => {
      setComparisonSet(set);
      recalculateComparison(set);
    });

    return () => unsubscribe();
  }, []);

  const recalculateComparison = async (set: ComparisonSet) => {
    if (set.items.length === 0) {
      setAnalysis(null);
      return;
    }

    setIsEvaluating(true);
    try {
      // For each saved computer, evaluate against the shared workloads
      const evaluated: EvaluatedComparisonItem[] = set.items.map((item) => {
        const result = evaluateCompatibility({
          hardware: item.hardware.rawHardwareProfile || {
            cpu: { model: item.hardware.cpu },
            gpu: { model: item.hardware.gpu },
            ram: { sizeGb: item.hardware.ramGb },
            storage: { devices: [{ capacityGb: item.hardware.storageGb, type: "nvme" }] },
            os: { family: item.hardware.os },
            formFactor: item.hardware.formFactor,
          },
          workloads: set.sharedWorkloads.length > 0 ? set.sharedWorkloads : item.workloads,
          softwareVersions: [],
          scenarioMode: set.sharedIsSimultaneous ? "PEAK" : "TYPICAL",
        });

        const isRecalculated = item.cachedScore !== undefined && item.cachedScore !== result.score;
        return {
          item,
          result,
          isRecalculated,
          recalculationReason: isRecalculated ? "Updated with latest software catalog baseline" : undefined,
        };
      });

      const resAnalysis = analyzeComparisonSet(evaluated);
      setAnalysis(resAnalysis);
    } catch (err) {
      console.error("Failed to evaluate comparison set:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRemove = (id: string) => {
    removeComputerFromComparison(id);
  };

  const handleDuplicateAndEdit = (item: EvaluatedComparisonItem) => {
    // Navigate to /check with hardware details preloaded
    router.push(
      `/check?prefillCpu=${encodeURIComponent(item.item.hardware.cpu)}&prefillGpu=${encodeURIComponent(
        item.item.hardware.gpu
      )}&prefillRam=${item.item.hardware.ramGb}&prefillOs=${encodeURIComponent(item.item.hardware.os)}`
    );
  };

  const handleClearAll = () => {
    if (confirm("Clear all saved comparison computers from this browser?")) {
      clearSavedComparisons();
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportComparisonSetToJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `computebestspecs_comparison_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importComparisonItemFromJson(content);
        if (!res.success) {
          alert(`Import failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!comparisonSet || comparisonSet.items.length === 0) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] bg-surface-main text-content-strong py-16 px-4 font-sans">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
            <Scale className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-content-strong">
            Side-by-Side PC Comparison
          </h1>
          <p className="text-content-body max-w-lg mx-auto text-sm leading-relaxed">
            You don&apos;t have any computers saved for comparison yet. Complete a computer check and click{" "}
            <span className="text-brand-primary font-semibold">&quot;Add to Comparison&quot;</span> to compare up to 3 systems under the exact same workload.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/check"
              className="touch-target px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-[var(--on-brand)] font-bold text-sm transition-all shadow-md"
            >
              Evaluate a Computer
            </Link>
            <Link
              href="/recommend"
              className="touch-target px-5 py-2.5 rounded-xl bg-surface-card hover:bg-surface-elevated text-content-strong font-semibold text-sm border border-border-subtle transition-all"
            >
              Explore Prebuilt Tiers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = analysis?.evaluatedItems || [];
  const rows = analysis?.rows || [];
  const visibleRows = onlyDifferences ? rows.filter((r) => r.isMeaningfulDiff) : rows;

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-surface-main text-content-strong py-8 sm:py-12 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-primary text-xs font-mono mb-1">
              <Scale className="w-4 h-4" />
              <span>SAVED COMPARISON ({items.length}/{MAX_COMPARISON_ITEMS} SLOTS)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-content-strong">
              System Comparison Matrix
            </h1>
            <p className="text-xs md:text-sm text-content-body mt-1">
              Comparing meaningful hardware capacity and performance differences across a unified workload suite.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOnlyDifferences(!onlyDifferences)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                onlyDifferences
                  ? "bg-brand-primary/10 text-brand-primary border-brand-primary/30"
                  : "bg-surface-card text-content-body border-border-subtle hover:text-content-strong hover:bg-surface-elevated"
              }`}
            >
              {onlyDifferences ? "Showing Meaningful Differences Only" : "Show All Metrics"}
            </button>

            {items.length < MAX_COMPARISON_ITEMS ? (
              <Link
                href="/check"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-[var(--on-brand)] text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Computer</span>
              </Link>
            ) : (
              <span className="text-[11px] text-content-muted bg-surface-subtle px-3 py-1.5 rounded-xl border border-border-subtle">
                Max 3 slots filled
              </span>
            )}

            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-elevated text-content-body border border-border-subtle transition-all flex items-center gap-1.5"
              title="Export saved comparisons as JSON"
            >
              <span>Export JSON</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-card hover:bg-surface-elevated text-content-body border border-border-subtle transition-all cursor-pointer flex items-center gap-1.5">
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 bg-rose-500/10 border border-rose-500/20 transition-colors font-medium"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* 3-Slot Limit Banner if Full */}
        {items.length >= MAX_COMPARISON_ITEMS && (
          <div className="p-3.5 rounded-2xl bg-surface-card border border-brand-primary/30 text-content-body text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-primary shrink-0" />
              <span>
                You can compare up to three computers. Remove or replace one to add another specification.
              </span>
            </div>
            <Link
              href="/check"
              className="text-brand-primary hover:underline font-semibold shrink-0"
            >
              New Check &rarr;
            </Link>
          </div>
        )}

        {/* 1-Slot Helper if only 1 item */}
        {items.length === 1 && (
          <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle text-content-body text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-primary shrink-0" />
              <span>
                You have 1 computer saved. Add a second computer to see side-by-side trade-offs, bottlenecks, and score deltas.
              </span>
            </div>
            <Link
              href="/check"
              className="px-3.5 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-[var(--on-brand)] font-bold shadow-xs transition-all"
            >
              Add Second Computer
            </Link>
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-3xl border border-border-subtle bg-surface-card shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-subtle">
                <th className="p-4 w-1/4 text-xs font-semibold text-content-muted uppercase tracking-wider">
                  Specification / Metric
                </th>
                {items.map((it, idx) => (
                  <th key={it.item.id} className="p-4 w-1/4 align-top border-l border-border-subtle">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-brand-primary uppercase tracking-wider">
                          Slot {idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-content-strong line-clamp-1 mt-0.5">
                          {it.item.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Duplicate & Edit in Check PC"
                          onClick={() => handleDuplicateAndEdit(it)}
                          className="p-1.5 rounded-lg text-content-muted hover:text-brand-primary hover:bg-surface-elevated transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Remove computer"
                          onClick={() => handleRemove(it.item.id)}
                          className="p-1.5 rounded-lg text-content-muted hover:text-rose-500 hover:bg-surface-elevated transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {analysis?.bestMatchItemId === it.item.id && items.length > 1 && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <Sparkles className="w-3 h-3" />
                        <span>Highest Capacity Match</span>
                      </div>
                    )}
                  </th>
                ))}
                {/* Fill empty slots up to 3 */}
                {Array.from({ length: Math.max(0, MAX_COMPARISON_ITEMS - items.length) }).map((_, idx) => (
                  <th
                    key={`empty_${idx}`}
                    className="p-4 w-1/4 align-middle text-center border-l border-border-subtle bg-surface-subtle/40"
                  >
                    <div className="py-6 flex flex-col items-center justify-center text-content-muted space-y-2">
                      <Scale className="w-6 h-6 stroke-1 text-content-muted" />
                      <span className="text-xs font-mono">Slot {items.length + idx + 1} Empty</span>
                      <Link
                        href="/check"
                        className="text-xs text-brand-primary hover:underline font-semibold"
                      >
                        + Add Computer
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {visibleRows.map((row, rIdx) => (
                <tr
                  key={row.label}
                  className={rIdx % 2 === 0 ? "bg-surface-card" : "bg-surface-subtle/30"}
                >
                  <td className="p-3.5 font-semibold text-content-strong">
                    <div className="flex items-center gap-1.5">
                      <span>{row.label}</span>
                      {row.isMeaningfulDiff && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" title="Meaningful difference" />
                      )}
                    </div>
                  </td>
                  {row.values.map((v) => (
                    <td
                      key={v.itemId}
                      className="p-3.5 border-l border-border-subtle align-top"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`font-medium ${
                            v.status === "good"
                              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                              : v.status === "warning"
                              ? "text-amber-600 dark:text-amber-400"
                              : v.status === "bad"
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : "text-content-strong"
                          }`}
                        >
                          {v.text}
                        </span>
                        {v.subtext && (
                          <span className="text-[11px] text-content-muted">{v.subtext}</span>
                        )}
                      </div>
                    </td>
                  ))}
                  {/* Empty slot placeholder cells */}
                  {Array.from({ length: Math.max(0, MAX_COMPARISON_ITEMS - items.length) }).map((_, idx) => (
                    <td key={`empty_cell_${idx}`} className="p-3.5 border-l border-border-subtle text-content-muted italic">
                      —
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Trade-Off & Recommendation Summaries */}
        {items.length > 1 && analysis?.tradeOffs && (
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-content-strong flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>Trade-Offs & Decision Context</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.tradeOffs.map((to) => (
                <div
                  key={to.itemId}
                  className="p-5 rounded-3xl bg-surface-card border border-border-subtle space-y-3 shadow-xs"
                >
                  <h3 className="text-xs font-bold text-brand-primary font-mono">
                    {to.headline}
                  </h3>

                  <div>
                    <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
                      Best Suited For:
                    </span>
                    <p className="text-xs text-content-strong mt-0.5 font-medium">
                      {to.bestFor}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
                      Upgrade Potential:
                    </span>
                    <p className="text-xs text-content-body mt-0.5">
                      {to.upgradeability}
                    </p>
                  </div>

                  {to.pros.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Advantages:</span>
                      <ul className="list-disc list-inside text-xs text-content-body mt-1 space-y-0.5">
                        {to.pros.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {to.cons.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Trade-offs:</span>
                      <ul className="list-disc list-inside text-xs text-content-body mt-1 space-y-0.5">
                        {to.cons.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle text-content-muted text-xs flex items-center justify-between">
          <span>
            Saved comparison configurations are stored privately in your local browser only. No specifications or cookies are uploaded to external servers.
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-brand-primary hover:underline shrink-0 ml-4 font-semibold"
          >
            Clear saved data
          </button>
        </div>
      </div>
    </div>
  );
}
