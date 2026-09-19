import type { DayType, History, Schedule } from "@/types";
import { DAYS } from "./days.ts";

export type Section = "workout" | "stats" | "history";
export type View = { section: Section; day: DayType };

export function nextDayAfter(day: DayType): DayType {
  return DAYS[(DAYS.indexOf(day) + 1) % DAYS.length];
}

export function pickInitialView(
  schedule: Schedule,
  history: History,
  weekday: number,
): View {
  const rotation = history.length > 0 ? nextDayAfter(history[0].day) : "push";
  const scheduled = schedule[weekday];
  if (scheduled) return { section: "workout", day: scheduled };
  if (Object.keys(schedule).length > 0)
    return { section: "history", day: rotation };
  return { section: "workout", day: rotation };
}
