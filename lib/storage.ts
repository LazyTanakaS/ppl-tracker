export const STORAGE_KEYS = {
  plan: "ppl_plan",
  workout: "ppl_workout",
  history: "ppl_history",
  schedule: "ppl_schedule",
} as const;

export function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[storage] Failed to read "${key}"`, err);
    return fallback;
  }
}

export function safeSet<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[storage] Failed to write "${key}"`, err);
    return false;
  }
}

type BackupData = {
  version: 1;
  exportedAt: string;
  plan: unknown;
  workout: unknown;
  history: unknown;
  schedule: unknown;
};

export function collectBackup(): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    plan: safeGet(STORAGE_KEYS.plan, null),
    workout: safeGet(STORAGE_KEYS.workout, null),
    history: safeGet(STORAGE_KEYS.history, null),
    schedule: safeGet(STORAGE_KEYS.schedule, null),
  };
}

export function downloadBackup() {
  if (typeof window === "undefined") return;

  const data = collectBackup();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ppl-tracker-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(json: string): boolean {
  try {
    const data = JSON.parse(json) as Partial<BackupData>;
    if (typeof data !== "object" || data === null) return false;

    let wroteSomething = false;
    if (data.plan != null)
      wroteSomething = safeSet(STORAGE_KEYS.plan, data.plan) || wroteSomething;
    if (data.workout != null)
      wroteSomething =
        safeSet(STORAGE_KEYS.workout, data.workout) || wroteSomething;
    if (data.history != null)
      wroteSomething =
        safeSet(STORAGE_KEYS.history, data.history) || wroteSomething;
    if (data.schedule != null)
      wroteSomething =
        safeSet(STORAGE_KEYS.schedule, data.schedule) || wroteSomething;
    return wroteSomething;
  } catch (err) {
    console.error("[storage] Failed to import backup", err);
    return false;
  }
}
