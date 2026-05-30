import { useState } from "react";
import type {
  History,
  WorkoutSession,
  DayType,
  ExerciseState,
  Exercise,
} from "@/types";

export function useHistory() {
  const [history, setHistory] = useState<History>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("ppl_history");
    return saved ? JSON.parse(saved) : [];
  });

  function saveSession(
    day: DayType,
    exercises: Exercise[],
    workout: Record<number, ExerciseState>,
  ) {
    const session: WorkoutSession = {
      date: new Date().toISOString(),
      day,
      exercises,
      workout,
    };
    const updated = [session, ...history].slice(0, 30);
    setHistory(updated);
    localStorage.setItem("ppl_history", JSON.stringify(updated));
  }

  function deleteSession(index: number) {
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
    localStorage.setItem("ppl_history", JSON.stringify(updated));
  }

  return { history, saveSession, deleteSession };
}
