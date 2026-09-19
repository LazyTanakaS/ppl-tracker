import type { History, Plan, Schedule } from "@/types";
import {
  addDaysToKey,
  chronological,
  collectExercises,
  type ExerciseEntry,
  keyToDayNumber,
  loggedSets,
  localDateKey,
  periodRange,
  round1,
  sessionsInRange,
  type DayFilter,
  type LoggedSet,
  type StatsPeriod,
  weekStartKey,
} from "./stats.ts";
import { getExerciseState } from "./session.ts";

export const MIN_TREND_SESSIONS = 3;
export const TREND_WINDOW = 6;
export const TREND_THRESHOLD = 0.02;

export type TrendStatus =
  | "improving"
  | "steady"
  | "plateau"
  | "declining"
  | "new";

export type ExerciseTrend = {
  status: TrendStatus;
  sessions: number;
  changePct: number | null;
  scores: number[];
};

export function sessionScore(sets: LoggedSet[]): number {
  return Math.max(
    ...sets.map(({ kg, reps }) => (reps === 1 ? kg : kg * (1 + reps / 30))),
  );
}

const mean = (values: number[]) =>
  values.reduce((a, b) => a + b, 0) / values.length;

export function exerciseTrend(
  chronologicalHistory: History,
  exerciseId: string,
): ExerciseTrend {
  const all: number[] = [];
  for (const session of chronologicalHistory) {
    const sets = loggedSets(getExerciseState(session.workout, exerciseId));
    if (sets.length > 0) all.push(sessionScore(sets));
  }
  const scores = all.slice(-TREND_WINDOW);
  if (scores.length < MIN_TREND_SESSIONS) {
    return { status: "new", sessions: all.length, changePct: null, scores };
  }

  const earlier = scores.slice(0, Math.floor(scores.length / 2));
  const recent = scores.slice(earlier.length);
  const change = mean(recent) / mean(earlier) - 1;
  const changePct = round1(change * 100);

  if (change >= TREND_THRESHOLD)
    return { status: "improving", sessions: all.length, changePct, scores };
  if (change <= -TREND_THRESHOLD)
    return { status: "declining", sessions: all.length, changePct, scores };

  const lastThree = all.slice(-3);
  const before = all.slice(0, -3);
  const plateau =
    all.length >= 4 && Math.max(...lastThree) <= Math.max(...before) * 1.005;
  return {
    status: plateau ? "plateau" : "steady",
    sessions: all.length,
    changePct,
    scores,
  };
}

export type ProgressEntry = { exercise: ExerciseEntry; trend: ExerciseTrend };

const ORDER: Record<TrendStatus, number> = {
  improving: 0,
  plateau: 1,
  declining: 2,
  steady: 3,
  new: 4,
};

export type ProgressReport = {
  entries: ProgressEntry[];
  counts: Record<TrendStatus, number>;
  evaluated: number;
};

export function computeProgress(input: {
  plan: Plan;
  history: History;
  period: StatsPeriod;
  dayFilter: DayFilter;
  now: number;
}): ProgressReport {
  const range = periodRange(input.period, input.now);
  const inPeriod = sessionsInRange(
    chronological(input.history),
    range.from,
    range.to,
  );
  const entries: ProgressEntry[] = collectExercises(input.plan, input.history)
    .filter(
      (exercise) =>
        input.dayFilter === "all" || exercise.day === input.dayFilter,
    )
    .map((exercise) => ({
      exercise,
      trend: exerciseTrend(inPeriod, exercise.id),
    }))
    .filter(({ exercise, trend }) => !exercise.archived || trend.sessions > 0);

  entries.sort(
    (a, b) =>
      ORDER[a.trend.status] - ORDER[b.trend.status] ||
      Math.abs(b.trend.changePct ?? 0) - Math.abs(a.trend.changePct ?? 0),
  );
  const counts: Record<TrendStatus, number> = {
    improving: 0,
    steady: 0,
    plateau: 0,
    declining: 0,
    new: 0,
  };
  for (const { trend } of entries) counts[trend.status] += 1;
  return { entries, counts, evaluated: entries.length - counts.new };
}

export type Headline = { tone: "good" | "neutral" | "warn"; text: string };

export function progressHeadline({
  counts,
  evaluated,
}: ProgressReport): Headline {
  if (evaluated === 0) {
    return {
      tone: "neutral",
      text: `Not enough data yet. Log an exercise in at least ${MIN_TREND_SESSIONS} sessions to see its trend.`,
    };
  }
  if (counts.declining > counts.improving) {
    return {
      tone: "warn",
      text: `${counts.declining} of ${evaluated} exercises are trending down`,
    };
  }
  if (counts.improving > 0) {
    return {
      tone: "good",
      text: `${counts.improving} of ${evaluated} exercises are getting stronger`,
    };
  }
  return {
    tone: "neutral",
    text: `No clear progress yet across ${evaluated} exercises - steady work counts`,
  };
}

export type WeekCount = { weekStart: string; count: number };

export function weeklySessions(
  history: History,
  now: number,
  weeks = 8,
): WeekCount[] {
  const counts = new Map<string, number>();
  for (const session of history) {
    const time = Date.parse(session.date);
    if (Number.isNaN(time)) continue;
    const key = weekStartKey(time);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const current = weekStartKey(now);
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDaysToKey(current, -(weeks - 1 - i) * 7);
    return { weekStart, count: counts.get(weekStart) ?? 0 };
  });
}

export type Adherence = {
  planned: number;
  done: number;
  pct: number | null;
  thisWeekDone: number;
  thisWeekPlanned: number;
};

export function adherence(
  schedule: Schedule,
  history: History,
  now: number,
  weeks = 4,
): Adherence {
  const today = localDateKey(now);
  const currentWeek = weekStartKey(now);
  const weekly = new Map(
    weeklySessions(history, now, weeks).map((w) => [w.weekStart, w.count]),
  );
  const scheduledWeekdays = Object.keys(schedule).map(Number);

  let planned = 0;
  let done = 0;
  for (let i = 0; i < weeks; i += 1) {
    const weekStart = addDaysToKey(currentWeek, -(weeks - 1 - i) * 7);
    const due = scheduledWeekdays.filter(
      (weekday) => addDaysToKey(weekStart, (weekday + 6) % 7) <= today,
    ).length;
    planned += due;
    done += Math.min(weekly.get(weekStart) ?? 0, due);
  }
  return {
    planned,
    done,
    pct: planned > 0 ? Math.round((done / planned) * 100) : null,
    thisWeekDone: weekly.get(currentWeek) ?? 0,
    thisWeekPlanned: scheduledWeekdays.length,
  };
}

export function daysSinceLastSession(
  history: History,
  now: number,
): number | null {
  const times = history
    .map((s) => Date.parse(s.date))
    .filter((t) => Number.isFinite(t));
  if (times.length === 0) return null;
  return Math.max(
    0,
    keyToDayNumber(localDateKey(now)) -
      keyToDayNumber(localDateKey(Math.max(...times))),
  );
}
