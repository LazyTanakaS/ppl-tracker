import type {
  History,
  Plan,
  Schedule,
  WorkoutState,
  BodyLog,
  BodyPhoto,
} from "@/types";
import { normalizeSettings, type Settings } from "./settings.ts";
import { normalizeBodyLog, normalizeBodyPhotos } from "./normalize.ts";
import { PLAN as DEFAULT_PLAN } from "@/data/plan";
import {
  BACKUP_VERSION,
  normalizeHistory,
  normalizePlan,
  normalizeSchedule,
  normalizeWorkout,
  parseBackup,
} from "./normalize.ts";
import { localDateKey } from "./stats.ts";

export const STORAGE_KEYS = {
  plan: "ppl_plan",
  workout: "ppl_workout",
  history: "ppl_history",
  schedule: "ppl_schedule",
  settings: "ppl_settings",
  body: "ppl_body",
  bodyPhoto: "ppl_body_photos",
} as const;

const DATA_KEYS = [
  STORAGE_KEYS.plan,
  STORAGE_KEYS.workout,
  STORAGE_KEYS.history,
  STORAGE_KEYS.schedule,
  STORAGE_KEYS.body,
  STORAGE_KEYS.bodyPhoto,
];

export const STORAGE_ERROR_EVENT = "ppl:storage-error";

const CORRUPT_SUFFIX = "__corrupt";

function hasStorage(): boolean {
  return typeof window !== "undefined";
}

function readJson(key: string): { value: unknown; raw: string | null } {
  if (!hasStorage()) return { value: null, raw: null };
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === "") return { value: null, raw: null };
    try {
      return { value: JSON.parse(raw), raw };
    } catch (err) {
      console.error(`[storage] "${key}" is not valid JSON`, err);
      quarantine(key, raw);
      return { value: null, raw };
    }
  } catch (err) {
    console.error(`[storage] Failed to read "${key}"`, err);
    return { value: null, raw: null };
  }
}

function quarantine(key: string, raw: string) {
  try {
    if (localStorage.getItem(key + CORRUPT_SUFFIX) === null) {
      localStorage.setItem(key + CORRUPT_SUFFIX, raw);
    }
  } catch {}
}

export function safeSet(key: string, value: unknown): boolean {
  if (!hasStorage()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[storage] Failed to write "${key}"`, err);
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT));
    return false;
  }
}

export function loadPlan(): Plan {
  return normalizePlan(readJson(STORAGE_KEYS.plan).value, DEFAULT_PLAN);
}

export function loadWorkout(): WorkoutState {
  return normalizeWorkout(readJson(STORAGE_KEYS.workout).value);
}

export function loadSchedule(): Schedule {
  return normalizeSchedule(readJson(STORAGE_KEYS.schedule).value);
}

export function hasAppData(): boolean {
  if (!hasStorage()) return false;
  try {
    return DATA_KEYS.some((key) => localStorage.getItem(key) !== null);
  } catch {
    return false;
  }
}

export function loadSettings(): Settings {
  return normalizeSettings(readJson(STORAGE_KEYS.settings).value, hasAppData());
}

export function saveSettings(settings: Settings): boolean {
  return safeSet(STORAGE_KEYS.settings, settings);
}

export function loadHistory(): History {
  const { value, raw } = readJson(STORAGE_KEYS.history);
  const { history, dropped } = normalizeHistory(value);
  if (dropped > 0 && raw !== null) quarantine(STORAGE_KEYS.history, raw);
  return history;
}

export function onStorageChange(key: string, callback: () => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key === key || event.key === null) callback();
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

export type BackupData = {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  plan: Plan;
  workout: WorkoutState;
  history: History;
  schedule: Schedule;
  body: BodyLog;
  bodyPhoto: BodyPhoto[];
};

export function collectBackup(): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    plan: loadPlan(),
    workout: loadWorkout(),
    history: loadHistory(),
    schedule: loadSchedule(),
    body: loadBodyLog(),
    bodyPhoto: loadBodyPhotos(),
  };
}

function saveFile(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadBackup() {
  if (!hasStorage()) return;
  saveFile(
    `ppl-tracker-backup-${localDateKey(Date.now())}.json`,
    JSON.stringify(collectBackup(), null, 2),
  );
}

export function downloadRawData() {
  if (!hasStorage()) return;
  const dump: Record<string, string | null> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    for (const name of [key, key + CORRUPT_SUFFIX]) {
      const raw = localStorage.getItem(name);
      if (raw !== null) dump[name] = raw;
    }
  }
  saveFile(
    `ppl-tracker-raw-${localDateKey(Date.now())}.json`,
    JSON.stringify(dump, null, 2),
  );
}

export function clearAppData() {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
    localStorage.removeItem(key + CORRUPT_SUFFIX);
  }
}

export type ImportResult =
  | { ok: true; dropped: number }
  | { ok: false; reason: string };

export const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

export function importBackup(json: string): ImportResult {
  if (!hasStorage()) return { ok: false, reason: "Storage is unavailable." };
  const parsed = parseBackup(json, DEFAULT_PLAN);
  if (!parsed.ok) return parsed;

  const { data } = parsed;
  const entries: [string, unknown][] = [];
  if (data.plan) entries.push([STORAGE_KEYS.plan, data.plan]);
  if (data.workout) entries.push([STORAGE_KEYS.workout, data.workout]);
  if (data.history) entries.push([STORAGE_KEYS.history, data.history]);
  if (data.schedule) entries.push([STORAGE_KEYS.schedule, data.schedule]);
  if (data.body) entries.push([STORAGE_KEYS.body, data.body]);
  if (data.bodyPhotos) entries.push([STORAGE_KEYS.bodyPhoto, data.bodyPhotos]);

  try {
    const previous = entries.map(
      ([key]) => [key, localStorage.getItem(key)] as const,
    );
    try {
      for (const [key, value] of entries) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (err) {
      console.error("[storage] Import failed, restoring previous data", err);
      for (const [key, raw] of previous) {
        if (raw === null) localStorage.removeItem(key);
        else localStorage.setItem(key, raw);
      }
      return {
        ok: false,
        reason: "Not enough storage space. Nothing was changed.",
      };
    }
  } catch (err) {
    console.error("[storage] Import failed", err);
    return {
      ok: false,
      reason: "Storage is unavailable. Nothing was changed.",
    };
  }
  return { ok: true, dropped: data.dropped };
}

export function loadBodyLog(): BodyLog {
  return normalizeBodyLog(readJson(STORAGE_KEYS.body).value);
}

export function loadBodyPhotos(): BodyPhoto[] {
  return normalizeBodyPhotos(readJson(STORAGE_KEYS.bodyPhoto).value);
}
