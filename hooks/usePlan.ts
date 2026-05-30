import { useState } from "react";
import type { Plan, DayType, Exercise } from "@/types";
import { PLAN as DEFAULT_PLAN } from "@/data/plan";

export function usePlan() {
  const [plan, setPlan] = useState<Plan>(() => {
    if (typeof window === "undefined") return DEFAULT_PLAN;
    const saved = localStorage.getItem("ppl_plan");
    return saved ? JSON.parse(saved) : DEFAULT_PLAN;
  });

  function save(updated: Plan) {
    setPlan(updated);
    localStorage.setItem("ppl_plan", JSON.stringify(updated));
  }

  function addExercise(day: DayType, exercise: Exercise) {
    save({ ...plan, [day]: [...plan[day], exercise] });
  }

  function removeExercise(day: DayType, idx: number) {
    save({ ...plan, [day]: plan[day].filter((_, i) => i !== idx) });
  }

  function updateExercise(day: DayType, idx: number, exercise: Exercise) {
    const updated = [...plan[day]];
    updated[idx] = exercise;
    save({ ...plan, [day]: updated });
  }

  function resetDay(day: DayType) {
    save({ ...plan, [day]: DEFAULT_PLAN[day] });
  }

  return { plan, addExercise, removeExercise, updateExercise, resetDay };
}
