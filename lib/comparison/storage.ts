import { ComparisonSet, SavedComparisonItem, SavedComparisonHardware } from "./types";
import { ComparisonSetSchema, CurrentDraftSchema } from "./schema";
import { HardwareProfile } from "../domain/hardware";
import { SelectedWorkload } from "../domain/software";

const COMPARISON_STORAGE_KEY = "cbs_comparison_set_v1";
const DRAFT_STORAGE_KEY = "cbs_current_draft_v1";
export const MAX_COMPARISON_ITEMS = 3;

type StorageListener = (set: ComparisonSet) => void;
const listeners = new Set<StorageListener>();

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === COMPARISON_STORAGE_KEY) {
      const set = getComparisonSet();
      listeners.forEach((fn) => fn(set));
    }
  });
}

let inMemoryComparisonSet: ComparisonSet = {
  schemaVersion: 1,
  items: [],
  sharedWorkloads: [],
  sharedIsSimultaneous: true,
  updatedAt: new Date().toISOString(),
};

let inMemoryDraft: any = null;

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Retrieves the current comparison set from localStorage (or in-memory for tests/SSR).
 * Validates with Zod and safely repairs if corrupted.
 */
export function getComparisonSet(): ComparisonSet {
  if (!hasLocalStorage()) {
    return inMemoryComparisonSet;
  }

  try {
    const raw = localStorage.getItem(COMPARISON_STORAGE_KEY);
    if (!raw) {
      return inMemoryComparisonSet;
    }

    const parsed = JSON.parse(raw);
    const result = ComparisonSetSchema.safeParse(parsed);
    if (result.success) {
      return result.data as ComparisonSet;
    } else {
      console.warn("Invalid comparison set schema found, resetting corrupted entries:", result.error);
      return inMemoryComparisonSet;
    }
  } catch {
    return inMemoryComparisonSet;
  }
}

/**
 * Saves comparison set to localStorage and notifies active listeners.
 */
function saveComparisonSet(set: ComparisonSet): void {
  // Enforce 3-item limit in domain logic
  const sanitizedItems = set.items.slice(0, MAX_COMPARISON_ITEMS);
  const payload: ComparisonSet = {
    ...set,
    items: sanitizedItems,
    updatedAt: new Date().toISOString(),
  };

  inMemoryComparisonSet = payload;

  if (hasLocalStorage()) {
    try {
      localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to write comparison set to localStorage:", e);
    }
  }

  listeners.forEach((fn) => fn(payload));
}

/**
 * Adds an item to the comparison set.
 * Returns { success: boolean, reason?: string }
 */
export function addComputerToComparison(item: Omit<SavedComparisonItem, "id" | "schemaVersion" | "createdAt" | "updatedAt">): {
  success: boolean;
  item?: SavedComparisonItem;
  reason?: string;
} {
  const current = getComparisonSet();

  if (current.items.length >= MAX_COMPARISON_ITEMS) {
    return {
      success: false,
      reason: "You can compare up to three computers. Remove or replace one to continue.",
    };
  }

  // Deduplication check: check if same CPU, GPU and RAM already exists
  const isDuplicate = current.items.some(
    (existing) =>
      existing.hardware.cpu.toLowerCase() === item.hardware.cpu.toLowerCase() &&
      existing.hardware.gpu.toLowerCase() === item.hardware.gpu.toLowerCase() &&
      existing.hardware.ramGb === item.hardware.ramGb &&
      existing.hardware.os.toLowerCase() === item.hardware.os.toLowerCase()
  );

  if (isDuplicate) {
    return {
      success: false,
      reason: "This exact computer specification is already in your comparison set.",
    };
  }

  const newItem: SavedComparisonItem = {
    ...item,
    id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedItems = [...current.items, newItem];
  const updatedSet: ComparisonSet = {
    ...current,
    items: updatedItems,
    // If shared workloads not set yet, use the added item's workloads
    sharedWorkloads: current.sharedWorkloads.length > 0 ? current.sharedWorkloads : newItem.workloads,
    sharedIsSimultaneous: current.sharedWorkloads.length > 0 ? current.sharedIsSimultaneous : newItem.isSimultaneous,
    updatedAt: new Date().toISOString(),
  };

  saveComparisonSet(updatedSet);
  return { success: true, item: newItem };
}

/**
 * Removes a computer from the comparison set by ID.
 */
export function removeComputerFromComparison(id: string): void {
  const current = getComparisonSet();
  const updatedItems = current.items.filter((i) => i.id !== id);
  saveComparisonSet({
    ...current,
    items: updatedItems,
  });
}

/**
 * Updates shared evaluation workloads for all compared computers.
 */
export function updateComparisonSharedWorkloads(workloads: SelectedWorkload[], isSimultaneous: boolean): void {
  const current = getComparisonSet();
  saveComparisonSet({
    ...current,
    sharedWorkloads: workloads,
    sharedIsSimultaneous: isSimultaneous,
  });
}

/**
 * Replaces a specific slot with a new specification.
 */
export function replaceComputerInComparison(
  idToReplace: string,
  newItemData: Omit<SavedComparisonItem, "id" | "schemaVersion" | "createdAt" | "updatedAt">
): boolean {
  const current = getComparisonSet();
  const index = current.items.findIndex((i) => i.id === idToReplace);
  if (index === -1) return false;

  const newItem: SavedComparisonItem = {
    ...newItemData,
    id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedItems = [...current.items];
  updatedItems[index] = newItem;

  saveComparisonSet({
    ...current,
    items: updatedItems,
  });
  return true;
}

/**
 * Clears all saved computers.
 */
export function clearSavedComparisons(): void {
  inMemoryComparisonSet = {
    schemaVersion: 1,
    items: [],
    sharedWorkloads: [],
    sharedIsSimultaneous: true,
    updatedAt: new Date().toISOString(),
  };

  if (hasLocalStorage()) {
    try {
      localStorage.removeItem(COMPARISON_STORAGE_KEY);
    } catch {}
  }

  listeners.forEach((fn) => fn(inMemoryComparisonSet));
}

/**
 * Subscribes to comparison set changes.
 */
export function renameSavedComputer(id: string, newName: string): boolean {
  const current = getComparisonSet();
  const index = current.items.findIndex((i) => i.id === id);
  if (index === -1) return false;

  const updatedItems = [...current.items];
  updatedItems[index] = {
    ...updatedItems[index],
    name: newName.trim().slice(0, 100) || updatedItems[index].name,
    updatedAt: new Date().toISOString(),
  };

  saveComparisonSet({
    ...current,
    items: updatedItems,
  });
  return true;
}

/**
 * Duplicates a saved computer in the comparison set.
 */
export function duplicateSavedComputer(id: string): {
  success: boolean;
  item?: SavedComparisonItem;
  reason?: string;
} {
  const current = getComparisonSet();
  if (current.items.length >= MAX_COMPARISON_ITEMS) {
    return {
      success: false,
      reason: "You can compare up to three computers. Remove or replace one to continue.",
    };
  }

  const target = current.items.find((i) => i.id === id);
  if (!target) {
    return {
      success: false,
      reason: "Target computer specification not found.",
    };
  }

  const duplicatedItem: SavedComparisonItem = {
    ...target,
    id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${target.name} (Copy)`.slice(0, 100),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedItems = [...current.items, duplicatedItem];
  saveComparisonSet({
    ...current,
    items: updatedItems,
  });

  return { success: true, item: duplicatedItem };
}

/**
 * Exports a comparison item or set as a portable normalized JSON string.
 */
export function exportComparisonItemToJson(item: SavedComparisonItem): string {
  return JSON.stringify(item, null, 2);
}

export function exportComparisonSetToJson(): string {
  const current = getComparisonSet();
  return JSON.stringify(current, null, 2);
}

/**
 * Validates and imports a JSON string containing a SavedComparisonItem.
 */
export function importComparisonItemFromJson(jsonString: string): {
  success: boolean;
  item?: SavedComparisonItem;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Invalid file format: JSON object expected." };
    }

    // Check if it has hardware profile
    if (!parsed.hardware || !parsed.hardware.cpu) {
      return { success: false, error: "Missing essential hardware fields in specification." };
    }

    const hw = parsed.hardware;
    const cpuStr = typeof hw.cpu === "string" ? hw.cpu : hw.cpu?.model || "Standard Processor";
    const gpuStr = typeof hw.gpu === "string" ? hw.gpu : hw.gpu?.model || "Integrated Graphics";
    const ramNum = typeof hw.ramGb === "number" ? hw.ramGb : hw.ram?.totalGb || 16;
    const storageNum = typeof hw.storageGb === "number" ? hw.storageGb : (hw.storage?.[0]?.totalGb || 512);
    const osStr = typeof hw.os === "string" ? hw.os : hw.os?.family || "windows";

    const normalizedHardware: SavedComparisonHardware = {
      cpu: cpuStr,
      gpu: gpuStr,
      ramGb: ramNum,
      storageGb: storageNum,
      os: osStr,
      formFactor: hw.formFactor || (hw.deviceType === "laptop" ? "laptop" : "desktop"),
      rawHardwareProfile: hw.rawHardwareProfile || {
        cpu: { model: cpuStr, manufacturer: "Intel", architecture: "x86_64", physicalCores: 8 },
        gpu: { model: gpuStr, manufacturer: "NVIDIA", type: "dedicated", vramGb: 8 },
        ram: { totalGb: ramNum, type: "DDR5" },
        storage: [{ type: "NVME_SSD", totalGb: storageNum, isSystemDrive: true }],
        os: { family: osStr as any, architecture: "x86_64" },
        architecture: "x86_64",
        deviceType: hw.formFactor === "laptop" ? "laptop" : "desktop",
      },
    };

    const res = addComputerToComparison({
      name: (parsed.name || "Imported Computer Profile").slice(0, 100),
      hardware: normalizedHardware,
      workloads: parsed.workloads || [],
      isSimultaneous: parsed.isSimultaneous ?? true,
      engineVersion: parsed.engineVersion || "1.0.0",
      catalogVersion: parsed.catalogVersion || "1.0.0",
    });



    if (!res.success) {
      return { success: false, error: res.reason || "Failed to add imported computer to comparison set." };
    }

    return { success: true, item: res.item };
  } catch (e: any) {
    return { success: false, error: `JSON Parse error: ${e.message}` };
  }
}

/**
 * Subscribes to comparison set changes.
 */
export function subscribeToComparisonSet(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Current Draft Management (auto-preserves unfinished form on /check)
 */
export function saveCurrentDraft(hardware: HardwareProfile, workloads: SelectedWorkload[], isSimultaneous: boolean): void {
  const payload = {
    schemaVersion: 1,
    hardware,
    workloads,
    isSimultaneous,
    updatedAt: new Date().toISOString(),
  };

  inMemoryDraft = payload;

  if (hasLocalStorage()) {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }
}

export function getCurrentDraft(): { hardware: HardwareProfile; workloads: SelectedWorkload[]; isSimultaneous: boolean } | null {
  if (!hasLocalStorage()) {
    return inMemoryDraft;
  }

  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return inMemoryDraft;
    const parsed = JSON.parse(raw);
    const res = CurrentDraftSchema.safeParse(parsed);
    if (res.success && res.data.hardware) {
      return {
        hardware: res.data.hardware as HardwareProfile,
        workloads: (res.data.workloads || []) as SelectedWorkload[],
        isSimultaneous: res.data.isSimultaneous ?? true,
      };
    }
    return inMemoryDraft;
  } catch {
    return inMemoryDraft;
  }
}


