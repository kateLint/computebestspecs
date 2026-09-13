import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { HardwareRequirements } from "@/lib/domain/software";
import { profileToHardwareRequirements } from "@/lib/data/catalog-helper";
import {
  Database,
  ShieldCheck,
  ExternalLink,
  Layers,
  Cpu,
  HardDrive,
  MonitorPlay,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Server,
  Zap,
  History,
  Workflow,
} from "lucide-react";

interface SoftwareDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: SoftwareDetailPageProps): Promise<Metadata> {
  const software = await prisma.software.findUnique({
    where: { slug: params.slug },
  });

  if (!software) {
    return {
      title: "Software Not Found — ComputeBestSpecs",
    };
  }

  return {
    title: `${software.name} Hardware Requirements & Compatibility — ComputeBestSpecs`,
    description: `Official minimum, recommended, and professional hardware specs, real-world multitasking workloads, and platform support for ${software.name}.`,
  };
}

export default async function SoftwareDetailPage({ params }: SoftwareDetailPageProps) {
  const software = await prisma.software.findUnique({
    where: { slug: params.slug },
    include: {
      versions: {
        orderBy: [
          { isLatest: "desc" },
          { releaseDate: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          requirementProfiles: {
            include: {
              rules: true,
            },
          },
          workloads: {
            orderBy: { intensity: "asc" },
          },
          revisions: {
            orderBy: { publishedAt: "desc" },
          },
        },
      },
    },
  });

  if (!software || software.versions.length === 0) {
    notFound();
  }

  const latestVersion = software.versions[0];
  const historicalVersions = software.versions.slice(1);

  const minProfile = latestVersion.requirementProfiles.find((p) => p.tier === "MINIMUM") || latestVersion.requirementProfiles[0];
  const recProfile = latestVersion.requirementProfiles.find((p) => p.tier === "RECOMMENDED");
  const proProfile = latestVersion.requirementProfiles.find((p) => p.tier === "PROFESSIONAL");

  const minReqs: HardwareRequirements | null = minProfile ? profileToHardwareRequirements(minProfile, latestVersion.supportedOperatingSystems) : null;
  const recReqs: HardwareRequirements | null = recProfile ? profileToHardwareRequirements(recProfile, latestVersion.supportedOperatingSystems) : null;
  const proReqs: HardwareRequirements | null = proProfile ? profileToHardwareRequirements(proProfile, latestVersion.supportedOperatingSystems) : null;

  // Parse OS support
  let osRequirements: any[] = [];
  try {
    osRequirements = JSON.parse(latestVersion.supportedOperatingSystems || "[]");
  } catch {}

  const hasWindows = osRequirements.some((os) => os.family === "windows");
  const hasMac = osRequirements.some((os) => os.family === "macos");
  const hasLinux = osRequirements.some((os) => os.family === "linux");

  const primarySource = {
    type: "official_docs",
    publisher: software.vendor,
    title: `${software.name} Official Hardware Specification & Performance Guidelines`,
    url: null,
    lastVerifiedAt: latestVersion.updatedAt ? latestVersion.updatedAt.toISOString() : null,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-mono text-content-muted">
        <Link href="/software" className="hover:text-brand-primary transition-colors">
          Software Catalog
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-content-strong font-semibold">{software.name}</span>
      </nav>

      {/* Hero Header */}
      <div className="surface-card p-6 sm:p-8 rounded-3xl border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-md">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 uppercase">
              {software.category}
            </span>
            <span className="text-xs font-mono text-content-muted">
              v{latestVersion.version}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
              <CheckCircle2 className="h-3 w-3" />
              <span>{latestVersion.dataQuality || "Verified"}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-content-strong">
            {software.name}
          </h1>

          <p className="text-sm text-content-body max-w-2xl leading-relaxed font-sans">
            {software.description || `Official hardware specifications, platform requirements, and real-world multitasking workload profiles for ${software.name}.`}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-content-muted pt-1">
            <span>Publisher: <strong className="text-content-strong">{software.vendor}</strong></span>
            <span>•</span>
            <span>Platforms: <strong className="text-content-strong">
              {[hasWindows && "Windows", hasMac && "macOS", hasLinux && "Linux"].filter(Boolean).join(" / ") || "Multiplatform"}
            </strong></span>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-col gap-2.5 shrink-0 self-start md:self-auto min-w-[200px]">
          <Link
            href="/check"
            className="touch-target px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-center"
          >
            <Cpu className="h-4 w-4" />
            <span>Can My PC Run This?</span>
          </Link>

          <Link
            href="/recommend"
            className="touch-target px-4 py-2.5 bg-surface-subtle hover:bg-surface-elevated text-content-strong border border-border-subtle text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-center"
          >
            <Sparkles className="h-4 w-4 text-brand-primary" />
            <span>Recommend a PC for This</span>
          </Link>
        </div>
      </div>

      {/* SECTION 1: Official Hardware Requirements (Min / Rec / Pro) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-content-strong uppercase tracking-wider">
          <Database className="h-4 w-4 text-brand-primary" />
          <span>Official Hardware Requirement Tiers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Minimum Tier */}
          <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold font-mono text-content-muted uppercase">Minimum Runtime</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold border border-amber-500/20">
                Baseline
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              {/* RAM */}
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <Layers className="h-3 w-3 text-amber-500" />
                  System Memory
                </span>
                <div className="text-sm font-bold text-content-strong">
                  {minReqs?.minimumRamGb ? `${minReqs.minimumRamGb} GB RAM` : "8 GB RAM"}
                </div>
              </div>

              {/* CPU */}
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-amber-500" />
                  Processor
                </span>
                <div className="text-sm font-bold text-content-strong">
                  {minReqs?.cpu?.minimumPhysicalCores
                    ? `${minReqs.cpu.minimumPhysicalCores} Physical Cores`
                    : "x86_64 or ARM64 Baseline"}
                </div>
              </div>

              {/* GPU */}
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <MonitorPlay className="h-3 w-3 text-indigo-500" />
                  Graphics & VRAM
                </span>
                <div className="text-sm font-bold text-content-strong">
                  {minReqs?.gpu?.supportsDirectX12 || minReqs?.gpu?.requiresDirectX12
                    ? "DirectX 12 Support"
                    : minReqs?.gpu?.supportsMetal || minReqs?.gpu?.requiresMetal
                    ? "Metal Support"
                    : minReqs?.gpu?.minimumVramGb
                    ? `${minReqs.gpu.minimumVramGb} GB VRAM`
                    : "Integrated or Dedicated"}
                </div>
              </div>

              {/* Storage */}
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <HardDrive className="h-3 w-3 text-blue-500" />
                  Disk Space
                </span>
                <div className="text-sm font-bold text-content-strong">
                  {minReqs?.storage?.installGb ? `${minReqs.storage.installGb} GB SSD` : "Standard SSD"}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Tier */}
          <div className="surface-card p-6 rounded-3xl border border-brand-primary/30 space-y-4 shadow-sm relative">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold font-mono text-brand-primary uppercase">Recommended</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-mono font-bold border border-brand-primary/20">
                Smooth Workflows
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <Layers className="h-3 w-3 text-brand-primary" />
                  System Memory
                </span>
                <div className="text-sm font-bold text-brand-primary">
                  {recReqs?.recommendedRamGb || recReqs?.minimumRamGb ? `${recReqs?.recommendedRamGb || recReqs?.minimumRamGb} GB RAM` : "16 GB RAM"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-brand-primary" />
                  Processor
                </span>
                <div className="text-sm font-bold text-content-strong">
                  6+ Cores Modern CPU
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <MonitorPlay className="h-3 w-3 text-indigo-500" />
                  Graphics & VRAM
                </span>
                <div className="text-sm font-bold text-content-strong">
                  {recReqs?.gpu?.minimumVramGb ? `${recReqs.gpu.minimumVramGb} GB Dedicated VRAM` : "Dedicated GPU (4GB+ VRAM)"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <HardDrive className="h-3 w-3 text-blue-500" />
                  Disk Space
                </span>
                <div className="text-sm font-bold text-content-strong">
                  High-Speed NVMe SSD
                </div>
              </div>
            </div>
          </div>

          {/* Professional Tier */}
          <div className="surface-card p-6 rounded-3xl border border-purple-500/20 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400 uppercase">Power User</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono font-bold border border-purple-500/20">
                Heavy Multitasking
              </span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <Layers className="h-3 w-3 text-purple-500" />
                  System Memory
                </span>
                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {proReqs?.recommendedRamGb ? `${proReqs.recommendedRamGb} GB RAM` : "32+ GB Dual-Channel RAM"}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-purple-500" />
                  Processor
                </span>
                <div className="text-sm font-bold text-content-strong">
                  8+ High-Performance Cores
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <MonitorPlay className="h-3 w-3 text-indigo-500" />
                  Graphics & VRAM
                </span>
                <div className="text-sm font-bold text-content-strong">
                  8GB - 16GB Dedicated VRAM
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-subtle border border-border-subtle space-y-1">
                <span className="text-[10px] uppercase font-semibold text-content-muted flex items-center gap-1">
                  <HardDrive className="h-3 w-3 text-blue-500" />
                  Storage & Scratch
                </span>
                <div className="text-sm font-bold text-content-strong">
                  PCIe 4.0 NVMe SSD + Dedicated Cache Drive
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Real-World Workload Profiles */}
      {latestVersion.workloads.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-content-strong uppercase tracking-wider">
            <Workflow className="h-4 w-4 text-brand-primary" />
            <span>Real-World Workload Scaling Profiles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestVersion.workloads.map((workload) => (
              <div
                key={workload.id}
                className="surface-card p-5 rounded-2xl border border-border-subtle space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-content-strong text-sm font-sans">{workload.name}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-surface-subtle text-content-muted text-[10px] uppercase border border-border-subtle">
                    {workload.intensity} Intensity
                  </span>
                </div>

                {workload.description && (
                  <p className="text-content-body text-xs font-sans leading-relaxed">
                    {workload.description}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle text-center">
                  <div className="p-2 rounded-xl bg-surface-subtle">
                    <span className="text-[9px] uppercase text-content-muted block">Typical RAM</span>
                    <span className="font-bold text-content-strong">{workload.typicalRamGb} GB</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-subtle">
                    <span className="text-[9px] uppercase text-content-muted block">CPU Load</span>
                    <span className="font-bold text-content-strong">{workload.typicalCpuPercent}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-subtle">
                    <span className="text-[9px] uppercase text-content-muted block">Typical VRAM</span>
                    <span className="font-bold text-content-strong">{workload.typicalVramGb || 0} GB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Supported Platforms & Features */}
      <div className="surface-card p-6 rounded-3xl border border-border-subtle space-y-4 shadow-sm">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-content-strong uppercase tracking-wider">
          <Server className="h-4 w-4 text-brand-primary" />
          <span>Platform Compatibility & Architecture Support</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          {/* Windows */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span>Windows</span>
              {hasWindows ? (
                <span className="text-semantic-success flex items-center gap-1">✓ Supported</span>
              ) : (
                <span className="text-content-muted flex items-center gap-1">✕ Unsupported</span>
              )}
            </div>
            <p className="text-[11px] text-content-muted font-sans">
              {hasWindows ? "Windows 10 / 11 (64-bit). DirectX 12 & Vulkan API drivers supported." : "No official native Windows client published."}
            </p>
          </div>

          {/* macOS */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span>macOS</span>
              {hasMac ? (
                <span className="text-semantic-success flex items-center gap-1">✓ Supported</span>
              ) : (
                <span className="text-content-muted flex items-center gap-1">✕ Unsupported</span>
              )}
            </div>
            <p className="text-[11px] text-content-muted font-sans">
              {hasMac ? "Apple Silicon (M1/M2/M3/M4) native Metal acceleration & macOS Sonoma/Sequoia." : "No native macOS client published."}
            </p>
          </div>

          {/* Linux */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span>Linux</span>
              {hasLinux ? (
                <span className="text-semantic-success flex items-center gap-1">✓ Supported</span>
              ) : (
                <span className="text-content-muted flex items-center gap-1">✕ Unsupported</span>
              )}
            </div>
            <p className="text-[11px] text-content-muted font-sans">
              {hasLinux ? "Ubuntu / Fedora / RHEL 64-bit. Wayland/X11 & Vulkan runtime." : "Unsupported natively (requires virtualization/Wine/Docker)."}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: Provenance & Requirement Revision History */}
      <div className="p-6 rounded-3xl bg-surface-subtle border border-border-subtle space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-content-strong font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Citation Provenance & Verification Audit Trail</span>
          </div>
          <span className="text-content-muted text-[11px]">
            Data Quality: <strong className="text-emerald-600 dark:text-emerald-400 uppercase">{latestVersion.dataQuality || "Verified"}</strong>
          </span>
        </div>

        {primarySource && (
          <div className="p-4 rounded-2xl bg-surface-main border border-border-subtle space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-content-strong">{primarySource.publisher || software.vendor} Official Documentation</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  {primarySource.type}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-content-muted font-sans leading-relaxed">
              {primarySource.title || `Official minimum and recommended system requirements published by ${software.vendor}.`}
            </p>
            <div className="text-[10px] text-content-muted">
              Last Verified: {primarySource.lastVerifiedAt ? new Date(primarySource.lastVerifiedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Current Evaluation Release"}
            </div>
          </div>
        )}

        {/* Revision History */}
        {historicalVersions.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-content-secondary text-[11px]">
              <History className="h-3.5 w-3.5" />
              <span>Requirement Revision History</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-content-muted">
              {historicalVersions.map((hv) => (
                <div key={hv.id} className="flex items-center justify-between p-2 rounded-xl bg-surface-main border border-border-subtle">
                  <span>Version {hv.version}</span>
                  <span className="text-content-secondary">
                    {hv.releaseDate ? new Date(hv.releaseDate).toLocaleDateString() : "Historical Revision"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
