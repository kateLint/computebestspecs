"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Cpu,
  Layers,
  HardDrive,
  MonitorPlay,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Laptop,
  RotateCcw,
  Filter,
} from "lucide-react";
import { HardwareRequirements } from "@/lib/domain/software";
import { HorizontalScrollContainer } from "@/components/HorizontalScrollContainer";
import { SuggestCatalogModal } from "@/components/catalog/SuggestCatalogModal";

export interface CatalogSoftwareItem {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  category: string;
  description?: string | null;
  latestVersion: string;
  dataQuality: "VERIFIED" | "PARTIAL" | "STALE" | "CONFLICTING" | "TEST_DATA_ONLY" | string;
  minimumRequirements?: HardwareRequirements | null;
  recommendedRequirements?: HardwareRequirements | null;
  workloads: {
    id: string;
    name: string;
    intensity: string;
    estimatedRamTypical?: number | null;
  }[];
  primarySource?: {
    type: string;
    publisher?: string | null;
    title?: string | null;
    url?: string | null;
    lastVerifiedAt?: string | null;
    retrievedAt?: string | null;
  } | null;
  supportedPlatforms: {
    windows: boolean;
    macos: boolean;
    linux: boolean;
  };
}

interface SoftwareCatalogViewProps {
  initialSoftware: CatalogSoftwareItem[];
}

export function SoftwareCatalogView({ initialSoftware }: SoftwareCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedQuality, setSelectedQuality] = useState<string>("all");
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    initialSoftware.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return ["all", ...Array.from(cats).sort()];
  }, [initialSoftware]);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete Suggestions computation (exhaustive options)
  const autocompleteSuggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // Matching apps
    const matchingApps = initialSoftware.filter((sw) => {
      if (!q) return true;
      return (
        sw.name.toLowerCase().includes(q) ||
        sw.vendor.toLowerCase().includes(q) ||
        sw.category.toLowerCase().includes(q) ||
        sw.slug.toLowerCase().includes(q) ||
        sw.workloads.some((w) => w.name.toLowerCase().includes(q))
      );
    }).slice(0, 8);

    // Matching categories
    const matchingCategories = categories.filter((cat) => {
      if (cat === "all") return false;
      if (!q) return true;
      return cat.toLowerCase().includes(q);
    }).slice(0, 5);

    // Matching workloads
    const matchingWorkloads: { name: string; appName: string }[] = [];
    if (q) {
      initialSoftware.forEach((sw) => {
        sw.workloads.forEach((w) => {
          if (w.name.toLowerCase().includes(q) && matchingWorkloads.length < 5) {
            matchingWorkloads.push({ name: w.name, appName: sw.name });
          }
        });
      });
    }

    return {
      apps: matchingApps,
      categories: matchingCategories,
      workloads: matchingWorkloads,
    };
  }, [initialSoftware, categories, searchQuery]);

  const filteredSoftware = useMemo(() => {
    return initialSoftware.filter((sw) => {
      // Category filter
      if (selectedCategory !== "all" && sw.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Platform filter
      if (selectedPlatform === "windows" && !sw.supportedPlatforms.windows) return false;
      if (selectedPlatform === "macos" && !sw.supportedPlatforms.macos) return false;
      if (selectedPlatform === "linux" && !sw.supportedPlatforms.linux) return false;

      // Quality filter
      if (selectedQuality === "verified" && sw.dataQuality !== "VERIFIED") return false;
      if (selectedQuality === "partial" && sw.dataQuality !== "PARTIAL") return false;
      if (selectedQuality === "stale" && sw.dataQuality !== "STALE") return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = sw.name.toLowerCase().includes(query);
        const matchesVendor = sw.vendor.toLowerCase().includes(query);
        const matchesDesc = sw.description?.toLowerCase().includes(query);
        const matchesWorkload = sw.workloads.some((w) => w.name.toLowerCase().includes(query));
        if (!matchesName && !matchesVendor && !matchesDesc && !matchesWorkload) {
          return false;
        }
      }

      return true;
    });
  }, [initialSoftware, searchQuery, selectedCategory, selectedPlatform, selectedQuality]);

  const renderDataQualityBadge = (quality: string) => {
    switch (quality) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
            <CheckCircle2 className="h-3 w-3" />
            <span>Verified</span>
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
            <AlertTriangle className="h-3 w-3" />
            <span>Partial Spec</span>
          </span>
        );
      case "STALE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase">
            <Clock className="h-3 w-3" />
            <span>Stale</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-subtle text-content-muted border border-border-subtle uppercase">
            <span>Official Profile</span>
          </span>
        );
    }
  };

  const renderSourceBadge = (source?: CatalogSoftwareItem["primarySource"], vendor?: string) => {
    if (!source) {
      return (
        <div className="flex items-center gap-1 text-[11px] text-content-muted font-mono">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Vendor Baseline</span>
        </div>
      );
    }

    const isOfficial = source.type === "official" || source.type === "vendor";
    const publisherName = source.publisher || vendor || "Vendor";
    const dateStr = source.lastVerifiedAt || source.retrievedAt;
    const formattedDate = dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : null;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] w-full">
        <div className="flex items-center gap-1.5">
          {isOfficial ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>✓ Official {publisherName}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-brand-cyan font-mono">
              <Database className="h-3.5 w-3.5" />
              <span>◉ Benchmark Dataset</span>
            </span>
          )}
          {formattedDate && (
            <span className="text-content-muted font-mono text-[10px]">
              • Verified {formattedDate}
            </span>
          )}
        </div>

        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-primary hover:underline inline-flex items-center gap-1 text-[11px] font-mono font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Citation</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Product Trust Framing */}
      <div className="space-y-3 pb-6 border-b border-border-subtle">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold border border-brand-primary/20">
          <Database className="h-3.5 w-3.5" />
          <span>Evidence & Workload Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-content-strong tracking-tight">
          Verified Software Requirements & Compatibility Catalog
        </h1>
        <p className="text-sm sm:text-base text-content-body max-w-3xl leading-relaxed">
          See the verified sources, platform support matrices, and real-world workload assumptions behind our deterministic sizing recommendations.
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="surface-card p-4 rounded-2xl border border-border-subtle space-y-4 shadow-sm">
        {/* Search Bar with Autocomplete */}
        <div ref={searchContainerRef} className="relative w-full">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsAutocompleteOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsAutocompleteOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsAutocompleteOpen(false);
                }
              }}
              placeholder="Search software by name, vendor, category, or workload (e.g. Photoshop, Unreal, Docker, AI, 4K)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-main border border-border-subtle text-sm text-content-strong placeholder:text-content-muted focus:outline-none focus:border-brand-primary transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsAutocompleteOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-content-muted hover:text-content-strong transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Popular Software Searches */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 text-[10px]">
            <span className="text-content-muted font-mono font-bold flex items-center gap-1 shrink-0">
              <Sparkles className="w-3 h-3 text-brand-primary" />
              Popular:
            </span>
            {[
              { label: "Blender 4.2", query: "Blender" },
              { label: "Unreal Engine 5", query: "Unreal" },
              { label: "Premiere Pro", query: "Premiere" },
              { label: "DaVinci Resolve", query: "DaVinci" },
              { label: "Ollama / LLMs", query: "Ollama" },
              { label: "Stable Diffusion", query: "Diffusion" },
              { label: "Docker", query: "Docker" },
              { label: "AutoCAD", query: "AutoCAD" },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setSearchQuery(item.query);
                  setIsAutocompleteOpen(false);
                }}
                className="px-2.5 py-0.5 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-content-body hover:text-content-strong border border-border-subtle hover:border-brand-primary/40 font-mono transition-all shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Wide Autocomplete Suggestions Dropdown Panel */}
          {isAutocompleteOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-card border border-border-strong rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 max-h-[420px] overflow-y-auto">
              {/* If no match */}
              {autocompleteSuggestions.apps.length === 0 &&
              autocompleteSuggestions.categories.length === 0 &&
              autocompleteSuggestions.workloads.length === 0 ? (
                <div className="p-6 text-center text-xs text-content-muted space-y-1">
                  <p className="font-semibold text-content-strong">No direct matches for &ldquo;{searchQuery}&rdquo;</p>
                  <p>Try searching by category (e.g. 3D, Video, AI) or broad application name.</p>
                </div>
              ) : (
                <div className="p-2 space-y-3 divide-y divide-border-subtle/50 text-xs">
                  {/* Matching Software Apps */}
                  {autocompleteSuggestions.apps.length > 0 && (
                    <div className="space-y-1 pt-1 first:pt-0">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-content-muted font-mono block">
                        Matching Applications ({autocompleteSuggestions.apps.length})
                      </span>
                      <div className="space-y-0.5">
                        {autocompleteSuggestions.apps.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              setSearchQuery(app.name);
                              setIsAutocompleteOpen(false);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-subtle text-left transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="h-7 w-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs shrink-0 border border-brand-primary/20">
                                {app.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-content-strong block truncate group-hover:text-brand-primary transition-colors">
                                  {app.name}
                                </span>
                                <span className="text-[11px] text-content-muted truncate block">
                                  {app.vendor} • {app.category}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                              {app.minimumRequirements?.minimumRamGb && (
                                <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-border-subtle text-content-secondary">
                                  Min: {app.minimumRequirements.minimumRamGb}GB
                                </span>
                              )}
                              <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Categories */}
                  {autocompleteSuggestions.categories.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-content-muted font-mono block">
                        Filter by Category
                      </span>
                      <div className="flex flex-wrap gap-1.5 px-2">
                        {autocompleteSuggestions.categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setSearchQuery("");
                              setIsAutocompleteOpen(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-elevated text-content-strong border border-border-subtle text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <span>Jump to {cat}</span>
                            <ArrowRight className="h-3 w-3 text-brand-primary" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Workload Tasks */}
                  {autocompleteSuggestions.workloads.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-content-muted font-mono block">
                        Matching Workload Tasks
                      </span>
                      <div className="space-y-0.5">
                        {autocompleteSuggestions.workloads.map((w, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchQuery(w.name);
                              setIsAutocompleteOpen(false);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-subtle text-left transition-colors text-xs"
                          >
                            <span className="text-content-strong font-medium">
                              ⚙️ {w.name} <span className="text-content-muted font-normal">in {w.appName}</span>
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-content-muted" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Toolbar: Row 1 - Category Chips */}
        <div className="pt-1">
          <HorizontalScrollContainer scrollStep={260} buttonSize="sm">
            <span className="text-content-muted font-mono font-bold uppercase text-[10px] mr-2 shrink-0 flex items-center gap-1">
              <Layers className="w-3 h-3 text-brand-primary" />
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all capitalize whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? "bg-brand-primary text-white font-bold shadow-xs scale-[1.02]"
                    : "bg-surface-subtle hover:bg-surface-elevated text-content-secondary border border-border-subtle hover:border-brand-primary/30"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </HorizontalScrollContainer>
        </div>

        {/* Filter Toolbar: Row 2 - Color-Differentiated Platform & Verification States */}
        <div className="pt-3 border-t border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-surface-subtle/30 -mx-4 -mb-4 p-3.5 rounded-b-2xl">
          <div className="flex flex-wrap items-center gap-4">
            {/* Platform Filter (Distinct Purple / Indigo Color Palette) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1 shrink-0">
                <Laptop className="w-3 h-3 text-indigo-400" />
                Platform:
              </span>
              <div className="inline-flex rounded-xl p-0.5 bg-surface-main border border-indigo-500/20 shadow-2xs">
                {[
                  { value: "all", label: "All" },
                  { value: "windows", label: "Windows" },
                  { value: "macos", label: "macOS" },
                  { value: "linux", label: "Linux" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedPlatform(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedPlatform === opt.value
                        ? "bg-indigo-600 text-white font-bold shadow-xs"
                        : "text-content-muted hover:text-indigo-400 hover:bg-indigo-500/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification State Filter (Distinct Emerald / Green / Amber Palette) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Verification:
              </span>
              <div className="inline-flex rounded-xl p-0.5 bg-surface-main border border-emerald-500/20 shadow-2xs">
                {[
                  { value: "all", label: "All States" },
                  { value: "verified", label: "✓ Verified Only" },
                  { value: "partial", label: "⚠ Partial" },
                  { value: "stale", label: "Stale" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedQuality(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      selectedQuality === opt.value
                        ? opt.value === "verified"
                          ? "bg-emerald-600 text-white font-bold shadow-xs"
                          : opt.value === "partial"
                          ? "bg-amber-600 text-white font-bold shadow-xs"
                          : "bg-emerald-700 text-white font-bold shadow-xs"
                        : "text-content-muted hover:text-emerald-500 hover:bg-emerald-500/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Active count & Quick Reset */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span className="text-[11px] font-mono text-content-muted">
              {filteredSoftware.length} {filteredSoftware.length === 1 ? "app" : "apps"}
            </span>

            {(selectedCategory !== "all" ||
              selectedPlatform !== "all" ||
              selectedQuality !== "all" ||
              Boolean(searchQuery.trim())) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedPlatform("all");
                  setSelectedQuality("all");
                  setSearchQuery("");
                }}
                className="px-2 py-1 rounded-lg bg-surface-elevated hover:bg-rose-500/10 text-content-muted hover:text-rose-500 border border-border-subtle hover:border-rose-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count & Empty State */}
      {filteredSoftware.length === 0 ? (
        <div className="surface-card p-12 rounded-3xl border border-border-subtle text-center space-y-3">
          <Database className="h-8 w-8 text-content-muted mx-auto" />
          <h3 className="text-base font-bold text-content-strong">No software matched your filter criteria</h3>
          <p className="text-xs text-content-body max-w-md mx-auto">
            Try resetting your search query or suggest this application for catalog addition.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedPlatform("all");
                setSelectedQuality("all");
              }}
              className="touch-target px-4 py-2 rounded-xl bg-surface-subtle border border-border-subtle text-content-strong text-xs font-mono font-bold hover:bg-surface-elevated"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setIsSuggestOpen(true)}
              className="touch-target px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-mono font-bold inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Suggest Missing App</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSoftware.map((sw) => {
            const minReq = sw.minimumRequirements;
            const recReq = sw.recommendedRequirements;

            // Strict formatting: NEVER default to 8 / 16 / 10 if missing
            const minRamText = minReq?.minimumRamGb ? `${minReq.minimumRamGb} GB` : "Not published";
            const recRamText = recReq?.minimumRamGb
              ? `${recReq.minimumRamGb} GB`
              : minReq?.recommendedRamGb
              ? `${minReq.recommendedRamGb} GB`
              : "Not published";

            // GPU description
            const gpuText = recReq?.gpu?.requiresDirectX12 || minReq?.gpu?.requiresDirectX12
              ? "DirectX 12 Required"
              : recReq?.gpu?.requiresMetal
              ? "Metal Accelerated"
              : recReq?.gpu?.requiresCuda
              ? "NVIDIA CUDA Required"
              : minReq?.gpu?.minimumVramGb
              ? `${minReq.gpu.minimumVramGb} GB VRAM min`
              : "Integrated OK";

            // Storage text
            const storageText = minReq?.storage?.installGb
              ? `${minReq.storage.installGb} GB install`
              : "Not published";

            return (
              <div
                key={sw.id}
                className="surface-card p-6 rounded-3xl border border-border-subtle hover:border-border-strong hover:bg-surface-elevated/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  {/* Category & Data Quality Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-primary font-mono">
                      {sw.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-subtle text-content-muted border border-border-subtle font-mono">
                        v{sw.latestVersion}
                      </span>
                      {renderDataQualityBadge(sw.dataQuality)}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-bold text-content-strong hover:text-brand-primary transition-colors">
                      <Link href={`/software/${sw.slug}`}>{sw.name}</Link>
                    </h3>
                    <p className="text-xs text-content-body mt-1 line-clamp-2 leading-relaxed font-sans">
                      {sw.description || `Hardware specifications, system dependencies, and workload scaling for ${sw.name}.`}
                    </p>
                  </div>

                  {/* Multi-Dimensional Requirements Matrix (Honest Data) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border-subtle text-left font-mono">
                    {/* RAM */}
                    <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-0.5">
                      <span className="text-[9px] uppercase font-semibold text-content-muted flex items-center gap-1">
                        <Layers className="h-3 w-3 text-amber-500" />
                        RAM
                      </span>
                      <div className="text-xs font-bold text-content-strong">{minRamText} min</div>
                      <div className="text-[10px] text-brand-primary font-semibold">{recRamText} rec</div>
                    </div>

                    {/* GPU */}
                    <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-0.5">
                      <span className="text-[9px] uppercase font-semibold text-content-muted flex items-center gap-1">
                        <MonitorPlay className="h-3 w-3 text-indigo-500" />
                        GPU / API
                      </span>
                      <div className="text-xs font-bold text-content-strong truncate" title={gpuText}>
                        {gpuText}
                      </div>
                      <div className="text-[10px] text-content-muted">
                        {recReq?.gpu?.recommendedVramGb ? `${recReq.gpu.recommendedVramGb}GB VRAM rec` : "Shader Model"}
                      </div>
                    </div>

                    {/* Platform & Storage */}
                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-surface-subtle border border-border-subtle space-y-0.5">
                      <span className="text-[9px] uppercase font-semibold text-content-muted flex items-center gap-1">
                        <HardDrive className="h-3 w-3 text-blue-500" />
                        Storage & OS
                      </span>
                      <div className="text-xs font-bold text-content-strong">{storageText}</div>
                      <div className="text-[10px] text-content-muted flex items-center gap-1">
                        {sw.supportedPlatforms.windows && <span className="text-brand-primary">Win</span>}
                        {sw.supportedPlatforms.macos && <span className="text-brand-cyan">Mac</span>}
                        {sw.supportedPlatforms.linux && <span className="text-amber-500">Linux</span>}
                      </div>
                    </div>
                  </div>

                  {/* Real-World Workload Profiles */}
                  {sw.workloads.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-content-muted font-mono">
                        Real-World Workload Profiles:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sw.workloads.map((w) => (
                          <span
                            key={w.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-surface-subtle text-content-secondary border border-border-subtle font-mono flex items-center gap-1"
                          >
                            <span>{w.name}</span>
                            {w.estimatedRamTypical && (
                              <span className="text-brand-primary font-bold">({w.estimatedRamTypical}GB)</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Section: Provenance & Conversion CTAs */}
                <div className="space-y-3 pt-3 border-t border-border-subtle">
                  {/* Source Provenance Link */}
                  {renderSourceBadge(sw.primarySource, sw.vendor)}

                  {/* Direct Action Links */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/check`}
                      className="touch-target px-3 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs text-center"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      <span>Check My PC</span>
                    </Link>

                    <Link
                      href={`/software/${sw.slug}`}
                      className="touch-target px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated text-content-strong border border-border-subtle text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 text-center"
                    >
                      <span>Full Spec</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggest Application Banner */}
      <div className="surface-card p-6 sm:p-8 rounded-3xl border border-border-subtle bg-gradient-to-r from-brand-primary/5 via-surface-card to-brand-primary/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-content-strong flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span>Missing a software or creative tool?</span>
          </h4>
          <p className="text-xs text-content-muted">
            Submit official vendor specifications for inclusion in our deterministic benchmark catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsSuggestOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Suggest Application</span>
        </button>
      </div>

      <SuggestCatalogModal
        isOpen={isSuggestOpen}
        onClose={() => setIsSuggestOpen(false)}
        defaultType="software"
        initialItemName={searchQuery}
      />
    </div>
  );
}
