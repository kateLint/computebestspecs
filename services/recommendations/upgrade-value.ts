import { BottleneckComponent, UpgradeSensitivityDelta } from "../../lib/domain/compatibility";
import { HardwareProfile } from "../../lib/domain/hardware";

export interface PhysicalConstraints {
  isLaptopSolderedRam: boolean;
  psuWattageSufficient: boolean;
  requiredPsuWatts?: number;
  availablePsuWatts?: number;
  motherboardSocketCompatible: boolean;
  motherboardSocket?: string;
  physicalGpuClearanceMmOk: boolean;
  formFactor: "desktop" | "laptop" | "mini-pc";
}

export interface UpgradeValueCandidate {
  component: BottleneckComponent;
  targetUpgrade: string;
  deltaScore: number;
  estimatedCostUsd: number;
  upgradeValueScore: number; // (deltaScore / estimatedCostUsd) * 100
  isPhysicallyFeasible: boolean;
  feasibilityIssues: string[];
  physicalConstraints: PhysicalConstraints;
}

export function calculateUpgradeValue(
  hardware: HardwareProfile,
  component: BottleneckComponent,
  targetUpgrade: string,
  delta: UpgradeSensitivityDelta,
  estimatedCostUsd: number
): UpgradeValueCandidate {
  const issues: string[] = [];
  let isFeasible = true;

  const isLaptop = hardware.deviceType === "laptop";
  const isSoldered = isLaptop && (hardware.ram.soldered ?? false);

  if (component === "memory" && isSoldered) {
    issues.push("Memory is soldered onto motherboard and cannot be upgraded.");
    isFeasible = false;
  }

  if (component === "gpu" && isLaptop) {
    issues.push("Laptop discrete GPU is BGA soldered to motherboard and cannot be replaced.");
    isFeasible = false;
  }

  // Power constraint check for desktop GPUs
  let psuSufficient = true;
  if (component === "gpu" && !isLaptop && targetUpgrade.includes("4090")) {
    const psuWatts = 650; // hypothetical default PSU
    if (psuWatts < 850) {
      psuSufficient = false;
      issues.push("Target GPU requires at least 850W Power Supply (PSU upgrade required).");
    }
  }

  const physicalConstraints: PhysicalConstraints = {
    isLaptopSolderedRam: isSoldered,
    psuWattageSufficient: psuSufficient,
    requiredPsuWatts: component === "gpu" ? 850 : 500,
    availablePsuWatts: 650,
    motherboardSocketCompatible: true,
    physicalGpuClearanceMmOk: true,
    formFactor: hardware.deviceType === "laptop" ? "laptop" : "desktop",
  };

  const cost = Math.max(10, estimatedCostUsd);
  const upgradeValueScore = Math.round(((delta.deltaScore / cost) * 100) * 10) / 10;

  return {
    component,
    targetUpgrade,
    deltaScore: delta.deltaScore,
    estimatedCostUsd: cost,
    upgradeValueScore: isFeasible ? upgradeValueScore : 0,
    isPhysicallyFeasible: isFeasible,
    feasibilityIssues: issues,
    physicalConstraints,
  };
}
