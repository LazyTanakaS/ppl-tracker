import type { Plan, Schedule } from "@/types";
import { PLAN } from "./plan.ts";

export type PlanTemplate = { id: string; label: string; description: string; plan: Plan };

const FREE_WEIGHTS: Plan = {
  push: [
    { id: "fw-bench-press", name: "Жим штанги лёжа", sets: 4, reps: "5-8" },
    { id: "fw-incline-db-press", name: "Жим гантелей на наклонной", sets: 3, reps: "8-12" },
    { id: "fw-overhead-press", name: "Жим штанги стоя", sets: 3, reps: "6-10" },
    { id: "fw-lateral-raise", name: "Махи гантелей в стороны", sets: 3, reps: "12-20" },
    { id: "fw-triceps-pushdown", name: "Разгибание на блоке", sets: 3, reps: "10-15" },
    { id: "fw-overhead-triceps", name: "Французский жим из-за головы", sets: 3, reps: "10-15" },
  ],
  pull: [
    { id: "fw-barbell-row", name: "Тяга штанги в наклоне", sets: 4, reps: "6-10" },
    { id: "fw-pull-ups", name: "Подтягивания", sets: 3, reps: "6-10" },
    { id: "fw-seated-row", name: "Тяга горизонтального блока", sets: 3, reps: "8-12" },
    { id: "fw-face-pull", name: "Тяга к лицу", sets: 3, reps: "12-20" },
    { id: "fw-barbell-curl", name: "Подъём штанги на бицепс", sets: 3, reps: "8-12" },
    { id: "fw-hammer-curl", name: "Молотки", sets: 3, reps: "10-12" },
  ],
  legs: [
    { id: "fw-squat", name: "Приседания со штангой", sets: 4, reps: "5-8" },
    { id: "fw-romanian-deadlift", name: "Румынская тяга", sets: 3, reps: "8-10" },
    { id: "fw-leg-press", name: "Жим ногами", sets: 3, reps: "10-15" },
    { id: "fw-leg-curl", name: "Сгибание ног", sets: 3, reps: "10-15" },
    { id: "fw-calf-raise", name: "Подъём на носки стоя", sets: 4, reps: "10-15" },
    { id: "fw-knee-raise", name: "Подъём коленей на турнике", sets: 3, reps: "10-15" },
  ],
};

export const TEMPLATES: PlanTemplate[] = [
  { id: "ppl-machines", label: "Classic PPL", description: "Smith machine and cables. The app's original plan.", plan: PLAN },
  { id: "ppl-free", label: "PPL with free weights", description: "Barbell and dumbbell basics.", plan: FREE_WEIGHTS },
  { id: "empty", label: "Start empty", description: "Add your own exercises later.", plan: { push: [], pull: [], legs: [] } },
];

export type SchedulePreset = { id: string; label: string; detail: string; schedule: Schedule };

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  { id: "ppl3", label: "3 days a week", detail: "Mon Push · Wed Pull · Fri Legs", schedule: { 1: "push", 3: "pull", 5: "legs" } },
  {
    id: "ppl6",
    label: "6 days a week",
    detail: "Push Pull Legs twice, Sunday off",
    schedule: { 1: "push", 2: "pull", 3: "legs", 4: "push", 5: "pull", 6: "legs" },
  },
  { id: "flex", label: "No fixed days", detail: "The app suggests the next workout in rotation.", schedule: {} },
];
