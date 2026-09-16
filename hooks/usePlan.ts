import { useState } from "react";
import type { Plan, DayType, Exercise } from "@/types";
import { PLAN as DEFAULT_PLAN } from "@/data/plan";
import { safeGet, safeSet, STORAGE_KEYS } from "@/lib/storage";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function usePlan() {
  const [plan, setPlan] = useState<Plan>(() =>
    safeGet(STORAGE_KEYS.plan, DEFAULT_PLAN),
  );

  function save(updated: Plan) {
    setPlan(updated);
    safeSet(STORAGE_KEYS.plan, updated);
  }

  function addExercise(day: DayType, exercise: Omit<Exercise, "id">) {
    save({ ...plan, [day]: [...plan[day], { ...exercise, id: generateId() }] });
  }

  function removeExercise(day: DayType, id: string) {
    save({ ...plan, [day]: plan[day].filter((ex) => ex.id !== id) });
  }

  function updateExercise(day: DayType, id: string, exercise: Exercise) {
    save({
      ...plan,
      [day]: plan[day].map((ex) => (ex.id === id ? exercise : ex)),
    });
  }

  function resetDay(day: DayType) {
    save({ ...plan, [day]: DEFAULT_PLAN[day] });
  }

  return { plan, addExercise, removeExercise, updateExercise, resetDay };
}
