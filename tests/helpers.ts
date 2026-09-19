import type {
  DayType,
  Exercise,
  History,
  WorkoutSession,
} from "../types/index.ts";

export const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

export const iso = (ts: number) => new Date(ts).toISOString();

export const BENCH: Exercise = {
  id: "bench",
  name: "Bench",
  sets: 3,
  reps: "5",
};

type SetInput = [kg: string, reps: string];

export function session(
  ts: number,
  sets: SetInput[],
  { id = "bench", day = "push" as DayType } = {},
): WorkoutSession {
  return {
    date: iso(ts),
    day,
    exercises: [{ ...BENCH, id, name: id }],
    workout: {
      [id]: {
        status: "done",
        notes: "",
        sets: sets.map(([kg, reps]) => ({ kg, reps, note: "", done: false })),
      },
    },
  };
}

export const newestFirst = (...sessions: WorkoutSession[]): History =>
  [...sessions].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
