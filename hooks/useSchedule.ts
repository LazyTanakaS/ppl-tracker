import { useState } from "react";
import type { Schedule, DayType } from "@/types";
import { safeSet, safeGet, STORAGE_KEYS } from "@/lib/storage";

export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule>(() =>
    safeGet(STORAGE_KEYS.schedule, {}),
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

  function getTodayTab(): DayType | "history" {
    const today = new Date().getDay();
    return schedule[today] ?? "history";
  }

  return { schedule, setDay, getTodayTab };
}
