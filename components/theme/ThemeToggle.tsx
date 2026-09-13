"use client";

import { useTheme, ThemeMode } from "./ThemeProvider";
import { Sun, Moon, Laptop, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ThemeToggle() {
  const { theme, resolvedTheme, isSystemDark, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { id: ThemeMode; label: string; sub: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", sub: "Always light mode", icon: Sun },
    { id: "dark", label: "Dark", sub: "Always dark mode", icon: Moon },
    {
      id: "system",
      label: "System",
      sub: `Auto (OS is ${isSystemDark ? "Dark" : "Light"})`,
      icon: Laptop,
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="touch-target p-2 rounded-xl border border-border-subtle bg-surface-card hover:bg-surface-elevated text-content-body hover:text-content-strong transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/30 relative flex items-center justify-center"
        aria-label="Toggle theme appearance"
        title={
          theme === "system"
            ? `Theme: System Auto (Currently ${resolvedTheme})`
            : `Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`
        }
      >
        {theme === "system" ? (
          <div className="relative">
            <Laptop className="h-4 w-4 text-brand-primary" />
            <span
              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-surface-card ${
                resolvedTheme === "dark" ? "bg-brand-violet" : "bg-day-warning"
              }`}
            />
          </div>
        ) : theme === "dark" ? (
          <Moon className="h-4 w-4 text-night-primary" />
        ) : (
          <Sun className="h-4 w-4 text-day-warning" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-surface-card border border-border-strong shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-content-muted border-b border-border-subtle flex items-center justify-between">
            <span>Appearance</span>
            {theme === "system" && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-sans font-semibold">
                Auto Sync
              </span>
            )}
          </div>
          <div className="p-1 space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                    isSelected
                      ? "bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20"
                      : "text-content-body hover:bg-surface-elevated hover:text-content-strong border border-transparent"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      isSelected ? "text-brand-primary" : "text-content-muted"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold leading-tight flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <span className="text-brand-primary text-[10px] font-mono">✓</span>}
                    </div>
                    <div className="text-[10px] text-content-muted font-normal truncate mt-0.5">
                      {opt.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
