import { describe, it, expect, beforeEach } from "vitest";
import { preferencesStore } from "@/lib/stores/preferences-store";
import { draftWizardStore } from "@/lib/stores/draft-wizard-store";

describe("Adaptive Experience & Display Preferences Store", () => {
  beforeEach(() => {
    preferencesStore.setTheme("system");
    preferencesStore.setMotion("standard");
    preferencesStore.setDensity("comfortable");
    preferencesStore.setDetailLevel("simple");
  });

  it("updates theme preference and initializes properly", () => {
    expect(preferencesStore.getState().theme).toBe("system");

    preferencesStore.setTheme("dark");
    expect(preferencesStore.getState().theme).toBe("dark");

    preferencesStore.setTheme("light");
    expect(preferencesStore.getState().theme).toBe("light");
  });

  it("updates motion preferences for reduced motion safety", () => {
    expect(preferencesStore.getState().motion).toBe("standard");

    preferencesStore.setMotion("reduced");
    expect(preferencesStore.getState().motion).toBe("reduced");
  });

  it("updates information layout density", () => {
    expect(preferencesStore.getState().density).toBe("comfortable");

    preferencesStore.setDensity("compact");
    expect(preferencesStore.getState().density).toBe("compact");
  });

  it("updates data detail depth between simple and technical", () => {
    expect(preferencesStore.getState().detailLevel).toBe("simple");

    preferencesStore.setDetailLevel("technical");
    expect(preferencesStore.getState().detailLevel).toBe("technical");
  });
});

describe("Hardware Draft Wizard Store & Resilience", () => {
  beforeEach(() => {
    draftWizardStore.resetDraft();
  });

  it("initializes draft with defaults and updates stages", () => {
    expect(draftWizardStore.getState().stage).toBe("basic");

    draftWizardStore.setStage("advanced");
    expect(draftWizardStore.getState().stage).toBe("advanced");
  });

  it("persists hardware draft updates without losing state", () => {
    draftWizardStore.updateHardwareDraft({
      cpu: { model: "AMD Ryzen 9 7900X", architecture: "x86_64", physicalCores: 12, performanceScore: 92, isVerified: true },
    });

    const updated = draftWizardStore.getState();
    expect(updated.hardwareDraft.cpu?.model).toBe("AMD Ryzen 9 7900X");
    expect(updated.lastSavedAt).not.toBeNull();
  });

  it("promotes anonymous local draft to user account", async () => {
    draftWizardStore.updateHardwareDraft({
      ram: { totalGb: 64, type: "DDR5" },
    });

    const res = await draftWizardStore.promoteDraftToAccount("user_123");
    expect(res.success).toBe(true);
  });
});
