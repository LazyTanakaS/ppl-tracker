"use client";

import { useState, useEffect } from "react";
import type { WorkoutState, DayType, WorkoutSet } from "@/types";
import { safeGet, safeSet, STORAGE_KEYS } from "@/lib/storage";

export function useWorkoutState() {
  const [workout, setWorkout] = useState<WorkoutState>(() =>
    safeGet(STORAGE_KEYS.workout, { push: {}, pull: {}, legs: {} }),
  );

  useEffect(() => {
    safeSet(STORAGE_KEYS.workout, workout);
  }, [workout]);

  function toggleDone(day: DayType, exId: string) {
    setWorkout((prev) => {
      const currentEx = prev[day][exId] || {
        done: false,
        sets: [],
        notes: "",
      };
      return {
        ...prev,
        [day]: {
          ...prev[day],
          [exId]: {
            ...currentEx,
            done: !currentEx.done,
          },
        },
      };
    });
  }
  function updateSet(
    day: DayType,
    exId: string,
    setIdx: number,
    field: keyof WorkoutSet,
    value: string,
  ) {
    setWorkout((prev) => {
      const currentEx = prev[day][exId] || {
        done: false,
        sets: [],
        notes: "",
      };
      const newSets = [...currentEx.sets];
      newSets[setIdx] = { ...newSets[setIdx], [field]: value };

      return {
        ...prev,
        [day]: {
          ...prev[day],
          [exId]: {
            ...currentEx,
            sets: newSets,
          },
        },
      };
    });
  }

  function updateNotes(day: DayType, exId: string, value: string) {
    setWorkout((prev) => {
      const currentEx = prev[day][exId] || {
        done: false,
        sets: [],
        notes: "",
      };

      return {
        ...prev,
        [day]: {
          ...prev[day],
          [exId]: {
            ...currentEx,
            notes: value,
          },
        },
      };
    });
  }
  function resetDay(day: DayType) {
    setWorkout((prev) => ({
      ...prev,
      [day]: {},
    }));
  }

  return { workout, toggleDone, updateNotes, updateSet, resetDay };
}
