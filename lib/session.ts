import type {
  DayType,
  SetField,
  Exercise,
  ExerciseState,
  History,
  WorkoutSession,
  WorkoutSet,
} from "@/types";
import { LIMITS, emptySet, normalizeExerciseState } from "./normalize.ts";

export function getExerciseState(
  workout: Record<string, ExerciseState> | undefined,
  exerciseId: string,
): ExerciseState | undefined {
  if (!workout || !Object.hasOwn(workout, exerciseId)) return undefined;
  return workout[exerciseId];
}

export function sanitizeSetValue(
  field: SetField,
  value: string,
): string | null {
  if (field === "note") return value.slice(0, LIMITS.maxSetNote);

  const normalized = value.replace(",", ".");
  if (normalized === "") return "";

  if (field === "reps") {
    if (!/^\d{1,4}$/.test(normalized)) return null;
    return Number(normalized) <= LIMITS.maxRepCount ? normalized : null;
  }

  if (!/^\d{0,4}\.?\d{0,2}$/.test(normalized)) return null;
  return Number(normalized) <= LIMITS.maxKg ? normalized : null;
}

export function buildSession(
  day: DayType,
  exercises: Exercise[],
  workout: Record<string, ExerciseState>,
  date: Date = new Date(),
): WorkoutSession {
  const snapshot = exercises.map((exercise) => ({ ...exercise }));
  const saved = Object.fromEntries(
    snapshot.map((exercise) => {
      const state = normalizeExerciseState(
        getExerciseState(workout, exercise.id),
      );
      const sets = Array.from(
        { length: exercise.sets },
        (_, i) => state.sets[i] ?? emptySet(),
      );
      return [exercise.id, { ...state, sets }];
    }),
  );
  return { date: date.toISOString(), day, exercises: snapshot, workout: saved };
}

function setHasData(set: WorkoutSet): boolean {
  return set.kg !== "" || set.reps !== "" || set.note !== "";
}

export function hasSessionData(session: WorkoutSession): boolean {
  return Object.values(session.workout).some(
    (state) =>
      state.status !== "pending" ||
      state.notes !== "" ||
      state.sets.some(setHasData),
  );
}

export function lastPerformance(history: History): Map<string, WorkoutSet[]> {
  const last = new Map<string, WorkoutSet[]>();
  for (const session of history) {
    for (const [id, state] of Object.entries(session.workout)) {
      if (
        last.has(id) ||
        !state.sets.some((s) => s.kg !== "" || s.reps !== "")
      ) {
        continue;
      }
      last.set(id, state.sets);
    }
  }
  return last;
}
