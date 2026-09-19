import type { History } from "@/types";
import { keyToDayNumber, localDateKey } from "./stats.ts";

export type Unit = "kg" | "lb";
export type ThemePref = "system" | "light" | "dark";

export type Settings = {
  onboarded: boolean;
  unit: Unit;
  theme: ThemePref;
  autoRest: boolean;
  restSeconds: number;
  lastExportAt: string | null;
  backupSnoozedUntil: string | null;
  persistAsked: boolean;
};

export const REST_OPTIONS = [60, 90, 120, 180, 300] as const;

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  unit: "kg",
  theme: "system",
  autoRest: true,
  restSeconds: 120,
  lastExportAt: null,
  backupSnoozedUntil: null,
  persistAsked: false,
};

const isIso = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

export function normalizeSettings(
  raw: unknown,
  hasExistingData: boolean,
): Settings {
  const r =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const restSeconds = REST_OPTIONS.find((s) => s === r.restSeconds);
  return {
    onboarded: typeof r.onboarded === "boolean" ? r.onboarded : hasExistingData,
    unit: r.unit === "lb" ? "lb" : "kg",
    theme: r.theme === "light" || r.theme === "dark" ? r.theme : "system",
    autoRest:
      typeof r.autoRest === "boolean" ? r.autoRest : DEFAULT_SETTINGS.autoRest,
    restSeconds: restSeconds ?? DEFAULT_SETTINGS.restSeconds,
    lastExportAt: isIso(r.lastExportAt) ? r.lastExportAt : null,
    backupSnoozedUntil: isIso(r.backupSnoozedUntil)
      ? r.backupSnoozedUntil
      : null,
    persistAsked: r.persistAsked === true,
  };
}

export const unitStep = (unit: Unit) => (unit === "kg" ? 2.5 : 5);

export function shouldRemindBackup(
  settings: Settings,
  history: History,
  now: number,
): boolean {
  if (history.length < 5) return false;
  if (
    settings.backupSnoozedUntil &&
    now < Date.parse(settings.backupSnoozedUntil)
  )
    return false;
  if (!settings.lastExportAt) return true;
  const exportedAt = Date.parse(settings.lastExportAt);
  const since = history.filter((s) => Date.parse(s.date) > exportedAt).length;
  const daysSinceExport =
    keyToDayNumber(localDateKey(now)) -
    keyToDayNumber(localDateKey(exportedAt));
  return since >= 10 || (since >= 3 && daysSinceExport >= 30);
}
