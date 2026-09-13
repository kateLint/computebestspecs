"use client";

import { useSyncExternalStore } from "react";

export const DISPLAY_PREFERENCES_STORAGE_KEY = "cbs_display_preferences_v1";

export type ThemePreference = "light" | "dark" | "system";
export type MotionPreference = "standard" | "reduced";
export type DensityPreference = "comfortable" | "compact";
export type DetailLevelPreference = "simple" | "technical";

export interface DisplayPreferencesState {
  theme: ThemePreference;
  motion: MotionPreference;
  density: DensityPreference;
  detailLevel: DetailLevelPreference;
}

export function resolveEffectiveTheme(
  theme: ThemePreference,
  systemPrefersDark: boolean
): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return systemPrefersDark ? "dark" : "light";
}

let state: DisplayPreferencesState = {
  theme: "system",
  motion: "standard",
  density: "comfortable",
  detailLevel: "simple",
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => {
    listener();
  });
}

// Client-side initialization from localStorage with strict runtime validation
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(DISPLAY_PREFERENCES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed) {
        if (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system") {
          state.theme = parsed.theme;
        }
        if (parsed.motion === "standard" || parsed.motion === "reduced") {
          state.motion = parsed.motion;
        }
        if (parsed.density === "comfortable" || parsed.density === "compact") {
          state.density = parsed.density;
        }
        if (parsed.detailLevel === "simple" || parsed.detailLevel === "technical") {
          state.detailLevel = parsed.detailLevel;
        }
      }
    }
  } catch (e) {}
}

export const preferencesStore = {
  getState: () => state,
  
  setTheme: (theme: ThemePreference) => {
    state = { ...state, theme };
    saveState();
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      const isDark = resolveEffectiveTheme(
        theme,
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) === "dark";

      root.dataset.theme = isDark ? "dark" : "light";
      root.style.colorScheme = isDark ? "dark" : "light";
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", isDark ? "#0B0F17" : "#FFFFFF");
      }
    }
    emitChange();
  },

  setMotion: (motion: MotionPreference) => {
    state = { ...state, motion };
    saveState();
    if (typeof window !== "undefined") {
      if (motion === "reduced") {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
    }
    emitChange();
  },

  setDensity: (density: DensityPreference) => {
    state = { ...state, density };
    saveState();
    if (typeof window !== "undefined") {
      if (density === "compact") {
        document.documentElement.classList.add("density-compact");
      } else {
        document.documentElement.classList.remove("density-compact");
      }
    }
    emitChange();
  },

  setDetailLevel: (detailLevel: DetailLevelPreference) => {
    state = { ...state, detailLevel };
    saveState();
    emitChange();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

function saveState() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(DISPLAY_PREFERENCES_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }
}

export function usePreferencesStore<T = DisplayPreferencesState>(
  selector?: (state: DisplayPreferencesState) => T
): T {
  const current = useSyncExternalStore(
    preferencesStore.subscribe,
    preferencesStore.getState,
    preferencesStore.getState
  );
  return selector ? selector(current) : (current as unknown as T);
}
