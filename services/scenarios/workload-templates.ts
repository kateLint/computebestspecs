import { SelectedWorkload, SoftwareVersion } from "../../lib/domain/software";
import { HardwareProfile } from "../../lib/domain/hardware";
import { evaluateCompatibility } from "../compatibility/compatibility-engine";
import { CompatibilityResult } from "../../lib/domain/compatibility";

export interface ScenarioTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: "AI & ML" | "Development" | "Content Creation" | "3D & VFX" | "General";
  author: string;
  workloads: SelectedWorkload[];
}

export const POPULAR_SCENARIOS: ScenarioTemplate[] = [
  {
    id: "scen_ai_engineer",
    slug: "ai-engineer-stack",
    title: "AI & Full-Stack Engineer Stack",
    description: "VS Code + Docker containers + Local Ollama / Qwen 14B + Chrome 30 tabs",
    category: "AI & ML",
    author: "ComputeBestSpecs Community",
    workloads: [
      { softwareId: "vs-code", softwareName: "VS Code", softwareVersionId: "v_latest", versionString: "2024", workloadId: "w_code", workloadName: "Large Workspace", intensity: "heavy", concurrency: "foreground" },
      { softwareId: "docker-desktop", softwareName: "Docker Desktop", softwareVersionId: "v_latest", versionString: "2024", workloadId: "w_docker", workloadName: "5+ Containers", intensity: "heavy", concurrency: "background", quantity: 5 },
      { softwareId: "google-chrome", softwareName: "Google Chrome", softwareVersionId: "v_latest", versionString: "2024", workloadId: "w_chrome", workloadName: "30 Tabs", intensity: "heavy", concurrency: "background" },
    ],
  },
  {
    id: "scen_mobile_dev",
    slug: "mobile-developer-stack",
    title: "Mobile App Developer Stack",
    description: "Android Studio + 2 Virtual Device Emulators + Chrome + Slack",
    category: "Development",
    author: "ComputeBestSpecs Community",
    workloads: [
      { softwareId: "android-studio", softwareName: "Android Studio", softwareVersionId: "v_latest", versionString: "2024", workloadId: "w_as", workloadName: "Gradle Build & IDE", intensity: "medium", concurrency: "foreground" },
      { softwareId: "android-emulator", softwareName: "Android Emulator", softwareVersionId: "v_latest", versionString: "2024", workloadId: "w_emu", workloadName: "Virtual Device", intensity: "medium", concurrency: "foreground", quantity: 2 },
      { softwareId: "google-chrome", softwareName: "Google Chrome", softwareVersionId: "v_latest", versionString: "2024", workloadId: "w_chrome", workloadName: "20 Tabs", intensity: "medium", concurrency: "background" },
    ],
  },
  {
    id: "scen_creative_vfx",
    slug: "creative-3d-vfx-artist",
    title: "3D & VFX Creative Artist",
    description: "Blender 4.x + Photoshop 2024 + Premiere Pro 4K timeline",
    category: "3D & VFX",
    author: "ComputeBestSpecs Community",
    workloads: [
      { softwareId: "blender", softwareName: "Blender", softwareVersionId: "v_latest", versionString: "4.x", workloadId: "w_blend", workloadName: "Cycles Viewport & Render", intensity: "heavy", concurrency: "foreground" },
      { softwareId: "photoshop", softwareName: "Photoshop", softwareVersionId: "v_latest", versionString: "2024", workloadId: "w_ps", workloadName: "Hi-Res Texture Editing", intensity: "medium", concurrency: "background" },
    ],
  },
];

export interface MultiPcComparisonResult {
  template: ScenarioTemplate;
  evaluations: {
    computerName: string;
    hardware: HardwareProfile;
    result: CompatibilityResult;
  }[];
  bestPerformingComputer: string;
  mostCostEfficientUpgrade: string;
}

export function compareMultiplePcs(
  pcs: { name: string; hardware: HardwareProfile }[],
  template: ScenarioTemplate,
  softwareVersions: SoftwareVersion[]
): MultiPcComparisonResult {
  const evaluations = pcs.map(pc => {
    const result = evaluateCompatibility(pc.hardware, template.workloads, softwareVersions, true, true);
    return {
      computerName: pc.name,
      hardware: pc.hardware,
      result,
    };
  });

  const sorted = [...evaluations].sort((a, b) => b.result.score - a.result.score);
  const best = sorted[0]?.computerName || "None";

  return {
    template,
    evaluations,
    bestPerformingComputer: best,
    mostCostEfficientUpgrade: sorted[0]?.result.upgradeRecommendations[0]?.to || "None required",
  };
}
