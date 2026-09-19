"use client";

import { useEffect, useState } from "react";
import type { Schedule, DayType } from "@/types";
import { loadSchedule, onStorageChange, safeSet, STORAGE_KEYS } from "@/lib/storage";

export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule>(loadSchedule);

  useEffect(
    () => onStorageChange(STORAGE_KEYS.schedule, () => setSchedule(loadSchedule())),
    [],
  );

  function setDay(weekday: number, day: DayType | null) {
    const updated = { ...schedule };
    if (day === null) {
      delete updated[weekday];
    } else {
      updated[weekday] = day;
    }
    const ok = safeSet(STORAGE_KEYS.schedule, updated);
    if (ok) setSchedule(updated);
  }

  function replaceSchedule(next: Schedule) {
    if (safeSet(STORAGE_KEYS.schedule, next)) setSchedule(next);
  }

  return { schedule, setDay, replaceSchedule };
}
