"use client";

import { useEffect, useState } from "react";
import type { History, WorkoutSession } from "@/types";
import {
  loadHistory,
  onStorageChange,
  safeSet,
  STORAGE_KEYS,
} from "@/lib/storage";

export function useHistory() {
  const [history, setHistory] = useState<History>(loadHistory);

  useEffect(
    () =>
      onStorageChange(STORAGE_KEYS.history, () => setHistory(loadHistory())),
    [],
  );

  function saveSession(session: WorkoutSession): boolean {
    const updated = [session, ...loadHistory()];
    const ok = safeSet(STORAGE_KEYS.history, updated);
    if (ok) setHistory(updated);
    return ok;
  }

  function deleteSession(session: WorkoutSession): boolean {
    const stored = loadHistory();
    const index = stored.findIndex(
      (item) => item.date === session.date && item.day === session.day,
    );
    if (index === -1) {
      setHistory(stored);
      return true;
    }
    const updated = stored.filter((_, i) => i !== index);
    const ok = safeSet(STORAGE_KEYS.history, updated);
    if (ok) setHistory(updated);
    return ok;
  }

  return { history, saveSession, deleteSession };
}
