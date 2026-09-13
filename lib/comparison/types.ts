/**
 * Saved Comparison Domain Models & Types
 */

import { HardwareProfile } from "../domain/hardware";
import { SelectedWorkload } from "../domain/software";
import { CompatibilityResult } from "../domain/compatibility";

export interface SavedComparisonHardware {
  cpu: string;
  gpu: string;
  ramGb: number;
  storageGb: number;
  os: string;
  formFactor: "desktop" | "laptop" | "mini_pc" | "unknown";
  rawHardwareProfile: HardwareProfile;
}

export interface SavedComparisonItem {
  schemaVersion: 1;
  id: string;
  name: string;
  hardware: SavedComparisonHardware;
  workloads: SelectedWorkload[];
  isSimultaneous: boolean;
  engineVersion: string;
  catalogVersion: string;
  cachedScore?: number;
  cachedStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonSet {
  schemaVersion: 1;
  items: SavedComparisonItem[];
  sharedWorkloads: SelectedWorkload[];
  sharedIsSimultaneous: boolean;
  updatedAt: string;
}

export interface EvaluatedComparisonItem {
  item: SavedComparisonItem;
  result: CompatibilityResult;
  isRecalculated: boolean;
  recalculationReason?: string;
}

export interface ComparisonDifferenceRow {
  category: string;
  label: string;
  isMeaningfulDiff: boolean;
  values: {
    itemId: string;
    text: string;
    status?: "good" | "warning" | "bad" | "neutral";
    subtext?: string;
  }[];
}

export interface ComparisonAnalysis {
  evaluatedItems: EvaluatedComparisonItem[];
  rows: ComparisonDifferenceRow[];
  bestMatchItemId: string | null;
  tradeOffs: {
    itemId: string;
    headline: string;
    pros: string[];
    cons: string[];
    bestFor: string;
    upgradeability: "High" | "Limited" | "Not upgradeable" | "Unknown";
  }[];
}
