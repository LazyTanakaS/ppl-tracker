import { useState } from "react";
import type {
  History,
  WorkoutSession,
  DayType,
  ExerciseState,
  Exercise,
} from "@/types";
import { safeGet, safeSet, STORAGE_KEYS } from "@/lib/storage";

export function useHistory() {
  const [history, setHistory] = useState<History>(() =>
    safeGet<History>(STORAGE_KEYS.history, []),
  );

  const MAX_HISTORY = 500;

  function saveSession(
    day: DayType,
    exercises: Exercise[],
    workout: Record<string, ExerciseState>,
  ): boolean {
    const session: WorkoutSession = {
      date: new Date().toISOString(),
      day,
      exercises,
      workout,
    };
    const updated = [session, ...history].slice(0, MAX_HISTORY);
    const ok = safeSet(STORAGE_KEYS.history, updated);

    if (ok) setHistory(updated);
    return ok;
  }

  function deleteSession(index: number) {
    const updated = history.filter((_, i) => i !== index);
    const ok = safeSet(STORAGE_KEYS.history, updated);
    if (ok) setHistory(updated);
  }

  return { history, saveSession, deleteSession };
}
