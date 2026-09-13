"use client";

import { useSyncExternalStore } from "react";
import { HardwareProfile } from "@/lib/domain/hardware";
import { SelectedWorkload } from "@/lib/domain/software";

export type WizardStage = "basic" | "advanced";
export type HardwareInputMethod = "manual" | "paste_specs" | "search_laptop" | "desktop_qr";

export interface DraftWizardState {
  stage: WizardStage;
  activeInputMethod: HardwareInputMethod;
  hardwareDraft: Partial<HardwareProfile>;
  workloadsDraft: SelectedWorkload[];
  lastSavedAt: string | null;
  draftVersion: number;
}

let state: DraftWizardState = {
  stage: "basic",
  activeInputMethod: "manual",
  hardwareDraft: {
    os: { family: "windows", version: "11", architecture: "x86_64" },
    cpu: {
      model: "AMD Ryzen 5 5600H",
      manufacturer: "AMD",
      architecture: "x86_64",
      physicalCores: 6,
      performanceScore: 68,
      laptopVariant: true,
      isVerified: true,
    },
    gpu: {
      model: "NVIDIA GeForce RTX 3050 Laptop GPU",
      manufacturer: "NVIDIA",
      type: "dedicated",
      performanceScore: 55,
      vramGb: 4.0,
      supportsCuda: true,
      supportsDirectX12: true,
      supportsVulkan: true,
      laptopVariant: true,
      isVerified: true,
    },
    ram: { totalGb: 16, type: "DDR4" },
    storage: [{ type: "NVME_SSD", totalGb: 512, freeGb: 180, isSystemDrive: true }],
  },
  workloadsDraft: [
    {
      softwareId: "adobe-photoshop",
      softwareName: "Adobe Photoshop",
      softwareVersionId: "ps_v1",
      versionString: "2024",
      workloadId: "w_ps",
      workloadName: "Standard Photo Editing",
      intensity: "heavy",
      concurrency: "foreground",
      quantity: 1,
    },
  ],
  lastSavedAt: null,
  draftVersion: 1,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => {
    listener();
  });
}

if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem("cbs_wizard_draft_v1");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed) {
        state = { ...state, ...parsed };
      }
    }
  } catch (e) {}
}

function saveState() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cbs_wizard_draft_v1", JSON.stringify(state));
    } catch (e) {}
  }
}

export const draftWizardStore = {
  getState: () => state,

  setStage: (stage: WizardStage) => {
    state = { ...state, stage, lastSavedAt: new Date().toISOString() };
    saveState();
    emitChange();
  },

  setInputMethod: (activeInputMethod: HardwareInputMethod) => {
    state = { ...state, activeInputMethod };
    saveState();
    emitChange();
  },

  updateHardwareDraft: (patch: Partial<HardwareProfile>) => {
    state = {
      ...state,
      hardwareDraft: {
        ...state.hardwareDraft,
        ...patch,
      },
      lastSavedAt: new Date().toISOString(),
    };
    saveState();
    emitChange();
  },

  setWorkloadsDraft: (workloadsDraft: SelectedWorkload[]) => {
    state = { ...state, workloadsDraft, lastSavedAt: new Date().toISOString() };
    saveState();
    emitChange();
  },

  resetDraft: () => {
    state = {
      stage: "basic",
      activeInputMethod: "manual",
      hardwareDraft: {},
      workloadsDraft: [],
      lastSavedAt: new Date().toISOString(),
      draftVersion: 1,
    };
    saveState();
    emitChange();
  },

  promoteDraftToAccount: async (accountId: string) => {
    return { success: true };
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useDraftWizardStore<T = DraftWizardState>(
  selector?: (state: DraftWizardState) => T
): T {
  const current = useSyncExternalStore(
    draftWizardStore.subscribe,
    draftWizardStore.getState,
    draftWizardStore.getState
  );
  return selector ? selector(current) : (current as unknown as T);
}
