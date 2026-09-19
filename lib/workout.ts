import type { ExerciseState, WorkoutSet } from "@/types";
import { emptySet, LIMITS } from "./normalize.ts";
import { sanitizeSetValue } from "./session.ts";

export type Suggestion = { kg: string; reps: string } | null;
export type SetOutcome = "done" | "undone" | "needs-input";

const complete = (set: WorkoutSet | undefined): set is WorkoutSet =>
  !!set && set.kg !== "" && set.reps !== "";

export function suggestSet(
  index: number,
  sets: WorkoutSet[],
  lastSets: WorkoutSet[] | undefined,
): Suggestion {
  const previous = sets[index - 1];
  if (complete(previous)) return { kg: previous.kg, reps: previous.reps };
  const sameIndex = lastSets?.[index];
  if (complete(sameIndex)) return { kg: sameIndex.kg, reps: sameIndex.reps };
  const lastLogged = lastSets?.filter(complete).at(-1);
  return lastLogged ? { kg: lastLogged.kg, reps: lastLogged.reps } : null;
}

function withSets(state: ExerciseState, length: number): WorkoutSet[] {
  return Array.from(
    { length: Math.max(state.sets.length, length) },
    (_, i) => state.sets[i] ?? emptySet(),
  );
}

function allPlannedDone(sets: WorkoutSet[], planned: number): boolean {
  return (
    planned > 0 &&
    Array.from({ length: planned }, (_, i) => sets[i]?.done === true).every(
      Boolean,
    )
  );
}

export function toggleSetDone(
  state: ExerciseState,
  index: number,
  plannedSets: number,
  suggestion: Suggestion,
): { state: ExerciseState; outcome: SetOutcome } {
  if (!Number.isInteger(index) || index < 0 || index >= LIMITS.maxSets) {
    return { state, outcome: "needs-input" };
  }
  const sets = withSets(state, index + 1);
  const target = sets[index];

  if (target.done) {
    sets[index] = { ...target, done: false };
    const status = state.status === "done" ? "pending" : state.status;
    return { state: { ...state, sets, status }, outcome: "undone" };
  }

  const kg = target.kg !== "" ? target.kg : (suggestion?.kg ?? "");
  const reps = target.reps !== "" ? target.reps : (suggestion?.reps ?? "");
  if (kg === "" || reps === "") return { state, outcome: "needs-input" };

  sets[index] = { ...target, kg, reps, done: true };
  const status =
    state.status === "pending" && allPlannedDone(sets, plannedSets)
      ? "done"
      : state.status;
  return { state: { ...state, sets, status }, outcome: "done" };
}

export function stepSetKg(
  state: ExerciseState,
  index: number,
  delta: number,
  suggestion: Suggestion,
): ExerciseState {
  if (!Number.isInteger(index) || index < 0 || index >= LIMITS.maxSets)
    return state;
  const sets = withSets(state, index + 1);
  const current = Number(sets[index].kg);
  const base =
    current > 0
      ? current
      : Number(suggestion?.kg) > 0
        ? Number(suggestion?.kg)
        : 0;
  const next = Math.max(0, Math.round((base + delta) * 100) / 100);
  const value = sanitizeSetValue("kg", next === 0 ? "" : String(next));
  if (value === null) return state;
  sets[index] = { ...sets[index], kg: value, done: false };
  return { ...state, sets };
}

export function firstPendingExerciseId(
  exercises: { id: string }[],
  states: Record<string, ExerciseState>,
): string | null {
  const pending = exercises.find(
    (ex) =>
      (Object.hasOwn(states, ex.id) ? states[ex.id].status : "pending") ===
      "pending",
  );
  return pending?.id ?? null;
}
