"use client";

import { useEffect, useRef, useState } from "react";
import type { Plan, DayType, Exercise } from "@/types";
import { PLAN as DEFAULT_PLAN } from "@/data/plan";
import {
  loadPlan,
  onStorageChange,
  safeSet,
  STORAGE_KEYS,
} from "@/lib/storage";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function usePlan() {
  const [plan, setPlan] = useState<Plan>(loadPlan);
  const loadedPlan = useRef(plan);

  useEffect(() => {
    if (plan === loadedPlan.current) return;
    safeSet(STORAGE_KEYS.plan, plan);
  }, [plan]);

  useEffect(
    () =>
      onStorageChange(STORAGE_KEYS.plan, () => {
        const fresh = loadPlan();
        loadedPlan.current = fresh;
        setPlan(fresh);
      }),
    [],
  );

  function addExercise(day: DayType, exercise: Omit<Exercise, "id">) {
    setPlan((prev) => ({
      ...prev,
      [day]: [...prev[day], { ...exercise, id: generateId() }],
    }));
  }

  function removeExercise(day: DayType, id: string) {
    setPlan((prev) => ({
      ...prev,
      [day]: prev[day].filter((ex) => ex.id !== id),
    }));
  }

  function updateExercise(day: DayType, id: string, exercise: Exercise) {
    setPlan((prev) => ({
      ...prev,
      [day]: prev[day].map((ex) => (ex.id === id ? exercise : ex)),
    }));
  }

  function resetDay(day: DayType) {
    setPlan((prev) => ({ ...prev, [day]: DEFAULT_PLAN[day] }));
  }

  function replacePlan(next: Plan) {
    setPlan(next);
  }

  return {
    plan,
    addExercise,
    removeExercise,
    updateExercise,
    resetDay,
    replacePlan,
  };
}
