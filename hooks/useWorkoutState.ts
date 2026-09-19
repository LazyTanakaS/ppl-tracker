"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DayType,
  Exercise,
  ExerciseState,
  SetField,
  WorkoutSet,
  WorkoutState,
} from "@/types";
import { emptySet, LIMITS } from "@/lib/normalize";
import { getExerciseState, sanitizeSetValue } from "@/lib/session";
import { loadWorkout, safeSet, STORAGE_KEYS } from "@/lib/storage";
import {
  stepSetKg,
  suggestSet,
  toggleSetDone,
  type SetOutcome,
} from "@/lib/workout";

const EMPTY_EXERCISE: ExerciseState = {
  status: "pending",
  sets: [],
  notes: "",
};

function changeExercise(
  state: WorkoutState,
  day: DayType,
  exId: string,
  change: (exercise: ExerciseState) => ExerciseState,
): WorkoutState {
  const current = getExerciseState(state[day], exId) ?? EMPTY_EXERCISE;
  return { ...state, [day]: { ...state[day], [exId]: change(current) } };
}

export function useWorkoutState() {
  const [workout, setWorkout] = useState<WorkoutState>(loadWorkout);
  const loaded = useRef(workout);

  useEffect(() => {
    if (workout !== loaded.current) safeSet(STORAGE_KEYS.workout, workout);
  }, [workout]);

  const current = (day: DayType, exId: string) =>
    getExerciseState(workout[day], exId) ?? EMPTY_EXERCISE;

  function setStatus(
    day: DayType,
    exId: string,
    status: ExerciseState["status"],
  ) {
    setWorkout((prev) =>
      changeExercise(prev, day, exId, (ex) => ({ ...ex, status })),
    );
  }

  function updateSet(
    day: DayType,
    exId: string,
    setIdx: number,
    field: SetField,
    value: string,
  ) {
    if (!Number.isInteger(setIdx) || setIdx < 0 || setIdx >= LIMITS.maxSets)
      return;
    const clean = sanitizeSetValue(field, value);
    if (clean === null) return;

    setWorkout((prev) =>
      changeExercise(prev, day, exId, (ex) => {
        const sets = Array.from(
          { length: Math.max(ex.sets.length, setIdx + 1) },
          (_, i): WorkoutSet => ex.sets[i] ?? emptySet(),
        );
        sets[setIdx] = { ...sets[setIdx], [field]: clean };
        return { ...ex, sets };
      }),
    );
  }

  function toggleSet(
    day: DayType,
    exercise: Exercise,
    setIdx: number,
    lastSets: WorkoutSet[] | undefined,
  ): SetOutcome {
    const state = current(day, exercise.id);
    const suggestion = suggestSet(setIdx, state.sets, lastSets);
    const result = toggleSetDone(state, setIdx, exercise.sets, suggestion);
    if (result.outcome !== "needs-input") {
      setWorkout((prev) =>
        changeExercise(prev, day, exercise.id, () => result.state),
      );
    }
    return result.outcome;
  }

  function stepKg(
    day: DayType,
    exercise: Exercise,
    setIdx: number,
    delta: number,
    lastSets: WorkoutSet[] | undefined,
  ) {
    const state = current(day, exercise.id);
    const next = stepSetKg(
      state,
      setIdx,
      delta,
      suggestSet(setIdx, state.sets, lastSets),
    );
    setWorkout((prev) => changeExercise(prev, day, exercise.id, () => next));
  }

  function updateNotes(day: DayType, exId: string, value: string) {
    setWorkout((prev) =>
      changeExercise(prev, day, exId, (ex) => ({
        ...ex,
        notes: value.slice(0, LIMITS.maxExerciseNotes),
      })),
    );
  }

  function resetDay(day: DayType) {
    setWorkout((prev) => ({ ...prev, [day]: {} }));
  }

  return {
    workout,
    setStatus,
    updateSet,
    toggleSet,
    stepKg,
    updateNotes,
    resetDay,
  };
}
