"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { Settings } from "@/lib/settings";

type SettingsContextValue = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const loaded = useRef(settings);

  useEffect(() => {
    if (settings !== loaded.current) saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        update: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value)
    throw new Error("useSettings must be used inside <SettingsProvider>");
  return value;
}
