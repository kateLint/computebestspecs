"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  usePreferencesStore,
  preferencesStore,
  ThemePreference,
  resolveEffectiveTheme,
} from "@/lib/stores/preferences-store";

export type ThemeMode = ThemePreference;

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  isSystemDark: boolean;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  isSystemDark: false,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePreferencesStore((state) => state.theme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isSystemDark, setIsSystemDark] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsSystemDark(mediaQuery.matches);

    const updateTheme = () => {
      const active = resolveEffectiveTheme(theme, mediaQuery.matches);
      setResolvedTheme(active);
      setIsSystemDark(mediaQuery.matches);

      root.dataset.theme = active;
      root.dataset.themePreference = theme;
      root.style.colorScheme = active;
      if (active === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", active === "dark" ? "#0B0F17" : "#FFFEFC");
      }
    };

    updateTheme();

    const handleChange = () => {
      setIsSystemDark(mediaQuery.matches);
      if (theme === "system") {
        updateTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    preferencesStore.setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isSystemDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
