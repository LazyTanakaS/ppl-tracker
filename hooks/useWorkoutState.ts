"use client";

import { useState, useEffect } from "react";
import type { WorkoutState, DayType, WorkoutSet } from "@/types";

export function useWorkoutState() {
  const [workout, setWorkout] = useState<WorkoutState>(() => {
    if (typeof window === "undefined") return { push: {}, pull: {}, legs: {} };
    const saved = localStorage.getItem("ppl_workout");
    return saved ? JSON.parse(saved) : { push: {}, pull: {}, legs: {} };
  });

  useEffect(() => {
    localStorage.setItem("ppl_workout", JSON.stringify(workout));
  }, [workout]);

  function toggleDone(day: DayType, exIdx: number) {
    setWorkout((prev) => {
      const currentEx = prev[day][exIdx] || {
        done: false,
        sets: [],
        notes: "",
      };
      return {
        ...prev,
        [day]: {
          ...prev[day],
          [exIdx]: {
            ...currentEx,
            done: !currentEx.done,
          },
        },
      };
    });
  }
  function updateSet(
    day: DayType,
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    value: string,
  ) {
    setWorkout((prev) => {
      const currentEx = prev[day][exIdx] || {
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
          [exIdx]: {
            ...currentEx,
            sets: newSets,
          },
        },
      };
    });
  }

  function updateNotes(day: DayType, exIdx: number, value: string) {
    setWorkout((prev) => {
      const currentEx = prev[day][exIdx] || {
        done: false,
        sets: [],
        notes: "",
      };

      return {
        ...prev,
        [day]: {
          ...prev[day],
          [exIdx]: {
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
