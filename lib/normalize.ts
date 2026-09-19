import type {
  Exercise,
  ExerciseState,
  History,
  Plan,
  Schedule,
  WorkoutSession,
  WorkoutSet,
  WorkoutState,
} from "@/types";
import { DAYS, isDayType } from "./days.ts";

export const LIMITS = {
  maxSets: 20,
  maxName: 80,
  maxReps: 12,
  maxSetNote: 200,
  maxExerciseNotes: 2000,
  maxKg: 5000,
  maxRepCount: 1000,
  maxWeightKg: 500,
  maxWaistCm: 300,
  maxCalories: 20000,
  maxBodyNote: 500,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number): string {
  if (typeof value === "string") return value.slice(0, max);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function numeric(value: unknown, max: number, integer: boolean): string {
  const source =
    typeof value === "number"
      ? String(value)
      : typeof value === "string"
        ? value.trim().replace(",", ".")
        : "";
  if (source === "") return "";
  const parsed = parseFloat(source);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) return "";
  if (integer) return String(Math.trunc(parsed));
  return Number.isFinite(Number(source)) ? source : String(parsed);
}

export function emptySet(): WorkoutSet {
  return { kg: "", reps: "", note: "", done: false };
}

export function normalizeSet(raw: unknown): WorkoutSet {
  if (!isRecord(raw)) return emptySet();
  return {
    kg: numeric(raw.kg, LIMITS.maxKg, false),
    reps: numeric(raw.reps, LIMITS.maxRepCount, true),
    note: text(raw.note, LIMITS.maxSetNote),
    done: raw.done === true,
  };
}

export function normalizeExerciseState(raw: unknown): ExerciseState {
  const record = isRecord(raw) ? raw : {};
  const status =
    record.status === "done" || record.status === "skipped"
      ? record.status
      : "pending";
  const sets = Array.isArray(record.sets)
    ? Array.from(record.sets.slice(0, LIMITS.maxSets), normalizeSet)
    : [];
  return { status, sets, notes: text(record.notes, LIMITS.maxExerciseNotes) };
}

export function normalizeWorkoutDay(
  raw: unknown,
): Record<string, ExerciseState> {
  if (!isRecord(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([id, state]) => [
      id,
      normalizeExerciseState(state),
    ]),
  );
}

export function normalizeWorkout(raw: unknown): WorkoutState {
  const record = isRecord(raw) ? raw : {};
  return {
    push: normalizeWorkoutDay(record.push),
    pull: normalizeWorkoutDay(record.pull),
    legs: normalizeWorkoutDay(record.legs),
  };
}

export function clampSets(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value), 10);
  if (!Number.isFinite(n)) return 3;
  return Math.min(LIMITS.maxSets, Math.max(1, Math.trunc(n)));
}

export function normalizeExercise(raw: unknown): Exercise | null {
  if (!isRecord(raw)) return null;
  const id = text(raw.id, 100).trim();
  const name = text(raw.name, LIMITS.maxName).trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    sets: clampSets(raw.sets),
    reps: text(raw.reps, LIMITS.maxReps).trim(),
  };
}

function normalizeExerciseList(raw: unknown): Exercise[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: Exercise[] = [];
  for (const item of raw) {
    const exercise = normalizeExercise(item);
    if (!exercise || seen.has(exercise.id)) continue;
    seen.add(exercise.id);
    result.push(exercise);
  }
  return result;
}

export function normalizePlan(raw: unknown, fallback: Plan): Plan {
  const record = isRecord(raw) ? raw : {};
  const plan = { ...fallback };
  for (const day of DAYS) {
    if (Array.isArray(record[day]))
      plan[day] = normalizeExerciseList(record[day]);
  }
  return plan;
}

function normalizeDate(raw: unknown): string | null {
  if (typeof raw === "string" && Number.isFinite(Date.parse(raw))) return raw;
  if (typeof raw === "number" && Number.isFinite(new Date(raw).getTime())) {
    return new Date(raw).toISOString();
  }
  return null;
}

export function normalizeSession(raw: unknown): WorkoutSession | null {
  if (!isRecord(raw)) return null;
  const date = normalizeDate(raw.date);
  if (date === null || !isDayType(raw.day)) return null;
  return {
    date,
    day: raw.day,
    exercises: normalizeExerciseList(raw.exercises),
    workout: normalizeWorkoutDay(raw.workout),
  };
}

export type NormalizedHistory = { history: History; dropped: number };

export function normalizeHistory(raw: unknown): NormalizedHistory {
  if (!Array.isArray(raw)) return { history: [], dropped: raw == null ? 0 : 1 };
  const history: History = [];
  let dropped = 0;
  for (const item of raw) {
    const session = normalizeSession(item);
    if (session) history.push(session);
    else dropped += 1;
  }
  history.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return { history, dropped };
}

export function normalizeSchedule(raw: unknown): Schedule {
  if (!isRecord(raw)) return {};
  const schedule: Schedule = {};
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const day = raw[String(weekday)];
    if (isDayType(day)) schedule[weekday] = day;
  }
  return schedule;
}

import type { BodyEntry, BodyLog, BodyPhoto } from "@/types";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function emptyBodyEntry(date: string): BodyEntry {
  return { date, weightKg: "", waistCm: "", calories: "", note: "" };
}

export function normalizeBodyEntry(
  raw: unknown,
  fallbackDate: string,
): BodyEntry {
  if (!isRecord(raw)) return emptyBodyEntry(fallbackDate);
  const date =
    typeof raw.date === "string" && DATE_KEY_RE.test(raw.date)
      ? raw.date
      : fallbackDate;
  return {
    date,
    weightKg: numeric(raw.weightKg, LIMITS.maxWeightKg, false),
    waistCm: numeric(raw.waistCm, LIMITS.maxWaistCm, false),
    calories: numeric(raw.calories, LIMITS.maxCalories, false),
    note: text(raw.note, LIMITS.maxBodyNote),
  };
}

export function normalizeBodyLog(raw: unknown): BodyLog {
  if (!isRecord(raw)) return {};
  const result: BodyLog = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!DATE_KEY_RE.test(key)) continue;
    result[key] = normalizeBodyEntry(value, key);
  }
  return result;
}

export function normalizeBodyPhotos(raw: unknown): BodyPhoto[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: BodyPhoto[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = typeof item.id === "string" && item.id ? item.id : null;
    const date =
      typeof item.date === "string" && DATE_KEY_RE.test(item.date)
        ? item.date
        : null;
    if (!id || !date || !seen.has(id)) continue;
    seen.add(id);
    result.push({ id, date });
  }

  return result;
}

export type ParsedBackup = {
  plan?: Plan;
  workout?: WorkoutState;
  history?: History;
  schedule?: Schedule;
  dropped: number;
  body?: BodyLog;
  bodyPhotos?: BodyPhoto[];
};

export type BackupResult =
  | { ok: true; data: ParsedBackup }
  | { ok: false; reason: string };

export const BACKUP_VERSION = 1;

export function parseBackup(json: string, defaultPlan: Plan): BackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, reason: "The file is not valid JSON." };
  }
  if (!isRecord(raw)) return { ok: false, reason: "The file is not a backup." };
  if (raw.version !== undefined && raw.version !== BACKUP_VERSION) {
    return { ok: false, reason: "Unsupported backup version." };
  }

  const data: ParsedBackup = { dropped: 0 };

  if (raw.plan != null) {
    const plan = raw.plan;
    if (!isRecord(plan) || !DAYS.some((day) => Array.isArray(plan[day]))) {
      return { ok: false, reason: "The plan in the file is malformed." };
    }
    data.plan = normalizePlan(plan, defaultPlan);
  }
  if (raw.workout != null) {
    if (!isRecord(raw.workout)) {
      return {
        ok: false,
        reason: "The current workout in the file is malformed.",
      };
    }
    data.workout = normalizeWorkout(raw.workout);
  }
  if (raw.history != null) {
    if (!Array.isArray(raw.history)) {
      return { ok: false, reason: "The history in the file is malformed." };
    }
    const { history, dropped } = normalizeHistory(raw.history);
    data.history = history;
    data.dropped = dropped;
  }
  if (raw.schedule != null) {
    if (!isRecord(raw.schedule)) {
      return { ok: false, reason: "The schedule in the file is malformed." };
    }
    data.schedule = normalizeSchedule(raw.schedule);
  }
  if (raw.body != null) {
    if (!isRecord(raw.body)) {
      return { ok: false, reason: "The body log in the file is malformed" };
    }
    data.body = normalizeBodyLog(raw.body);
  }
  if (raw.BodyPhotos != null) {
    if (!Array.isArray(raw.BodyPhotos)) {
      return {
        ok: false,
        reason: "The body photo list in the file is malformed",
      };
    }
    data.bodyPhotos = normalizeBodyPhotos(raw.bodyPhotos);
  }

  if (
    data.plan === undefined &&
    data.workout === undefined &&
    data.history === undefined &&
    data.schedule === undefined
  ) {
    return { ok: false, reason: "The file contains no PPL Tracker data." };
  }
  return { ok: true, data };
}
