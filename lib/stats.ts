import type { DayType, ExerciseState, History, Plan } from "@/types";
import { DAYS } from "./days.ts";
import { getExerciseState } from "./session.ts";

export const MAX_1RM_REPS = 12;

export type StatsPeriod = 7 | 30 | 90 | "all";
export type DayFilter = "all" | DayType;

const pad = (n: number) => String(n).padStart(2, "0");

export function localDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function keyToDayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekStartKey(timestamp: number): string {
  const weekday = new Date(timestamp).getDay();
  return addDaysToKey(localDateKey(timestamp), -((weekday + 6) % 7));
}

const sessionKey = (session: { date: string }) =>
  localDateKey(Date.parse(session.date));

export function chronological(history: History): History {
  return [...history].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export type PeriodRange = {
  from: string | null;
  to: string | null;
  previousFrom: string | null;
  previousTo: string | null;
};

export function periodRange(period: StatsPeriod, now: number): PeriodRange {
  if (period === "all") {
    return { from: null, to: null, previousFrom: null, previousTo: null };
  }
  const to = localDateKey(now);
  const from = addDaysToKey(to, -(period - 1));
  const previousTo = addDaysToKey(from, -1);
  return {
    from,
    to,
    previousFrom: addDaysToKey(previousTo, -(period - 1)),
    previousTo,
  };
}

export function sessionsInRange(
  history: History,
  from: string | null,
  to: string | null,
): History {
  if (from === null && to === null) return history;
  return history.filter((session) => {
    const key = sessionKey(session);
    return (
      key !== "" && (from === null || key >= from) && (to === null || key <= to)
    );
  });
}

export type LoggedSet = { kg: number; reps: number };

export function loggedSets(state: ExerciseState | undefined): LoggedSet[] {
  if (!state || !Array.isArray(state.sets)) return [];
  const result: LoggedSet[] = [];
  for (const set of state.sets) {
    if (!set) continue;
    const kg = Number(set.kg);
    const reps = Number(set.reps);
    if (set.kg === "" || set.reps === "") continue;
    if (!Number.isFinite(kg) || !Number.isFinite(reps) || kg <= 0 || reps < 1)
      continue;
    result.push({ kg, reps: Math.trunc(reps) });
  }
  return result;
}

export const round1 = (value: number) => Math.round(value * 10) / 10;

export function estimate1RM(kg: number, reps: number): number | null {
  if (!(kg > 0) || !(reps >= 1) || reps > MAX_1RM_REPS) return null;
  return reps === 1 ? kg : kg * (1 + reps / 30);
}

export type ExerciseMetrics = {
  maxKg: number;
  maxKgReps: number;
  maxKgDate: string;
  estimated1RM: number | null;
  estimated1RMDate: string | null;
};

export function getExerciseMetrics(
  chronologicalHistory: History,
  exerciseId: string,
): ExerciseMetrics | null {
  let best: { kg: number; reps: number; date: string } | null = null;
  let best1RM: { value: number; date: string } | null = null;

  for (const session of chronologicalHistory) {
    for (const { kg, reps } of loggedSets(
      getExerciseState(session.workout, exerciseId),
    )) {
      if (!best || kg > best.kg || (kg === best.kg && reps > best.reps)) {
        best = { kg, reps, date: session.date };
      }
      const estimate = estimate1RM(kg, reps);
      if (estimate !== null && (!best1RM || estimate > best1RM.value)) {
        best1RM = { value: estimate, date: session.date };
      }
    }
  }

  if (!best) return null;
  return {
    maxKg: best.kg,
    maxKgReps: best.reps,
    maxKgDate: best.date,
    estimated1RM: best1RM ? round1(best1RM.value) : null,
    estimated1RMDate: best1RM ? best1RM.date : null,
  };
}

export type ProgressMetric = "estimated1RM" | "maxKg" | "volume";

export type ExerciseProgressPoint = {
  date: string;
  maxKg: number;
  estimated1RM: number | null;
  volume: number;
};

export function getExerciseProgress(
  chronologicalHistory: History,
  exerciseId: string,
): ExerciseProgressPoint[] {
  const points: ExerciseProgressPoint[] = [];
  for (const session of chronologicalHistory) {
    const sets = loggedSets(getExerciseState(session.workout, exerciseId));
    if (sets.length === 0) continue;
    let maxKg = 0;
    let best1RM: number | null = null;
    let volume = 0;
    for (const { kg, reps } of sets) {
      maxKg = Math.max(maxKg, kg);
      const estimate = estimate1RM(kg, reps);
      if (estimate !== null) best1RM = Math.max(best1RM ?? 0, estimate);
      volume += kg * reps;
    }
    points.push({
      date: session.date,
      maxKg,
      estimated1RM: best1RM === null ? null : round1(best1RM),
      volume: Math.round(volume),
    });
  }
  return points;
}

export type ChartPoint = { date: string; value: number; x: number; y: number };
export type ChartData = { points: ChartPoint[]; min: number; max: number };

export function buildChart(
  progress: ExerciseProgressPoint[],
  metric: ProgressMetric,
): ChartData | null {
  const samples = progress.flatMap((point) => {
    const value = point[metric];
    return value === null
      ? []
      : [{ date: point.date, value, time: Date.parse(point.date) }];
  });
  if (samples.length === 0) return null;

  const values = samples.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const t0 = samples[0].time;
  const span = samples[samples.length - 1].time - t0;

  const points = samples.map((sample, index) => ({
    date: sample.date,
    value: sample.value,
    x:
      samples.length === 1
        ? 50
        : span > 0
          ? ((sample.time - t0) / span) * 100
          : (index / (samples.length - 1)) * 100,
    y: max === min ? 50 : 92 - ((sample.value - min) / (max - min)) * 84,
  }));
  return { points, min, max };
}

export function currentWeekStreak(history: History, now: number): number {
  const weeks = new Set(
    history.flatMap((session) => {
      const time = Date.parse(session.date);
      return Number.isNaN(time) ? [] : [weekStartKey(time)];
    }),
  );
  let cursor = weekStartKey(now);
  if (!weeks.has(cursor)) cursor = addDaysToKey(cursor, -7);
  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor = addDaysToKey(cursor, -7);
  }
  return streak;
}

export type CalendarCell = { key: string; count: number; future: boolean };
export type ActivityCalendar = { cells: CalendarCell[]; activeDays: number };

export function buildActivityCalendar(
  history: History,
  now: number,
  weeks = 12,
): ActivityCalendar {
  const counts = new Map<string, number>();
  for (const session of history) {
    const key = sessionKey(session);
    if (key !== "") counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = localDateKey(now);
  const start = addDaysToKey(weekStartKey(now), -(weeks - 1) * 7);
  const cells: CalendarCell[] = [];
  let activeDays = 0;
  for (let i = 0; i < weeks * 7; i += 1) {
    const key = addDaysToKey(start, i);
    const count = counts.get(key) ?? 0;
    const future = key > today;
    if (count > 0 && !future) activeDays += 1;
    cells.push({ key, count: future ? 0 : count, future });
  }
  return { cells, activeDays };
}

export type ExerciseEntry = {
  id: string;
  name: string;
  day: DayType;
  archived: boolean;
};

export function collectExercises(
  plan: Plan,
  history: History,
): ExerciseEntry[] {
  const entries: ExerciseEntry[] = [];
  const seen = new Set<string>();
  for (const day of DAYS) {
    for (const exercise of plan[day]) {
      if (seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      entries.push({
        id: exercise.id,
        name: exercise.name,
        day,
        archived: false,
      });
    }
  }
  for (const session of history) {
    for (const exercise of session.exercises) {
      if (seen.has(exercise.id)) continue;
      seen.add(exercise.id);
      entries.push({
        id: exercise.id,
        name: exercise.name,
        day: session.day,
        archived: true,
      });
    }
  }
  return entries;
}

export type ExerciseRow = {
  exercise: ExerciseEntry;
  best: ExerciseMetrics | null;
  change: number | null;
  isAllTimePr: boolean;
};

export type StatsInput = {
  plan: Plan;
  history: History;
  period: StatsPeriod;
  dayFilter: DayFilter;
  query: string;
  now: number;
};

export type StatsResult = {
  hasHistory: boolean;
  weekStreak: number;
  calendar: ActivityCalendar;
  rows: ExerciseRow[];
  periodChronological: History;
};

export function computeStats({
  plan,
  history,
  period,
  dayFilter,
  query,
  now,
}: StatsInput): StatsResult {
  const range = periodRange(period, now);
  const all = chronological(history);
  const byDay = (sessions: History) =>
    dayFilter === "all"
      ? sessions
      : sessions.filter((s) => s.day === dayFilter);

  const inPeriod = sessionsInRange(all, range.from, range.to);
  const inPrevious =
    range.previousFrom === null
      ? []
      : sessionsInRange(all, range.previousFrom, range.previousTo);

  const needle = query.trim().toLowerCase();
  const rows: ExerciseRow[] = [];
  for (const exercise of collectExercises(plan, history)) {
    if (dayFilter !== "all" && exercise.day !== dayFilter) continue;
    if (needle && !exercise.name.toLowerCase().includes(needle)) continue;

    const best = getExerciseMetrics(inPeriod, exercise.id);
    if (exercise.archived && !best && !getExerciseMetrics(all, exercise.id))
      continue;

    const previous = getExerciseMetrics(inPrevious, exercise.id);
    const allTime =
      period === "all" ? null : getExerciseMetrics(all, exercise.id);
    rows.push({
      exercise,
      best,
      change: best && previous ? round1(best.maxKg - previous.maxKg) : null,
      isAllTimePr:
        best !== null &&
        allTime !== null &&
        best.maxKg === allTime.maxKg &&
        best.maxKgReps === allTime.maxKgReps,
    });
  }

  return {
    hasHistory: history.length > 0,
    weekStreak: currentWeekStreak(byDay(all), now),
    calendar: buildActivityCalendar(byDay(all), now),
    rows,
    periodChronological: inPeriod,
  };
}
