import { useState } from "react";
import type { Schedule, DayType } from "@/types";

export function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule>(() => {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem("ppl_schedule");
    return saved ? JSON.parse(saved) : {};
  });

  function setDay(weekday: number, day: DayType | null) {
    const updated = { ...schedule };
    if (day === null) {
      delete updated[weekday];
    } else {
      updated[weekday] = day;
    }
    setSchedule(updated);
    localStorage.setItem("ppl_schedule", JSON.stringify(updated));
  }

  function getTodayTab(): DayType | "history" {
    const today = new Date().getDay();
    return schedule[today] ?? "history";
  }

  return { schedule, setDay, getTodayTab };
}
