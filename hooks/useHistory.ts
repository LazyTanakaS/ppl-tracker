import { useState } from "react";
import type { History, WorkoutSession, DayType, ExerciseState } from "@/types";

export function useHistory() {
  const [history, setHistory] = useState<History>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("ppl_history");
    return saved ? JSON.parse(saved) : [];
  });

  function saveSession(day: DayType, workout: Record<number, ExerciseState>) {
    const session: WorkoutSession = {
      date: new Date().toISOString(),
      day,
      workout,
    };
    const updated = [session, ...history];
    setHistory(updated);
    localStorage.setItem("ppl_history", JSON.stringify(updated));
  }

  return { history, saveSession };
}
