import type { DayType } from "@/types";

export const DAYS: DayType[] = ["push", "pull", "legs"];

export const DAY_COLORS: Record<DayType, string> = {
  push: "var(--accent-push)",
  pull: "var(--accent-pull)",
  legs: "var(--accent-legs)",
};

export const DAY_MUSCLES: Record<DayType, string> = {
  push: "Chest / Shoulders / Triceps",
  pull: "Back / Biceps",
  legs: "Legs / Abs",
};

export function isDayType(value: unknown): value is DayType {
  return value === "push" || value === "pull" || value === "legs";
}
