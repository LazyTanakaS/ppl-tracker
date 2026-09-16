import type { Plan } from "@/types";

export const PLAN: Plan = {
  push: [
    { id: "smith-bench-press", name: "Жим в Смите", sets: 4, reps: "6-10" },
    {
      id: "smith-incline-press",
      name: "Наклонный жим в Смите",
      sets: 3,
      reps: "8-12",
    },
    {
      id: "smith-shoulder-press",
      name: "Жим вверх в Смите",
      sets: 3,
      reps: "8-12",
    },
    {
      id: "lateral-raise",
      name: "Махи гантелей в стороны",
      sets: 3,
      reps: "12-20",
    },
    {
      id: "triceps-pushdown",
      name: "Разгибание на блоке",
      sets: 3,
      reps: "10-15",
    },
    {
      id: "overhead-triceps-extension",
      name: "Французский жим из-за головы",
      sets: 3,
      reps: "10-15",
    },
  ],
  pull: [
    { id: "pull-ups", name: "Подтягивания", sets: 4, reps: "6-10" },
    {
      id: "seated-cable-row",
      name: "Тяга горизонтального блока",
      sets: 3,
      reps: "8-12",
    },
    { id: "lat-pulldown", name: "Тяга верхнего блока", sets: 3, reps: "8-12" },
    {
      id: "single-arm-cable-row",
      name: "Тяга нижнего блока одной рукой",
      sets: 3,
      reps: "10-12",
    },
    {
      id: "reverse-pec-deck",
      name: "Обратный пек-дек",
      sets: 3,
      reps: "12-20",
    },
    { id: "hammer-curl", name: "Молотки", sets: 3, reps: "10-12" },
    {
      id: "single-arm-cable-curl",
      name: "Сгибания одной рукой в блоке",
      sets: 3,
      reps: "10-15",
    },
  ],
  legs: [
    {
      id: "barbell-squat",
      name: "Приседания со штангой",
      sets: 4,
      reps: "6-10",
    },
    { id: "leg-press", name: "Жим ногами", sets: 3, reps: "10-15" },
    { id: "leg-curl", name: "Сгибание ног", sets: 4, reps: "10-15" },
    { id: "leg-extension", name: "Разгибание ног", sets: 3, reps: "12-15" },
    { id: "hip-thrust", name: "Ягодичный мост", sets: 3, reps: "8-12" },
    { id: "calf-raise", name: "Подъём на носки", sets: 4, reps: "12-20" },
    { id: "crunches", name: "Скручивания", sets: 3, reps: "12-20" },
    {
      id: "hanging-knee-raise",
      name: "Подъём коленей на турнике",
      sets: 3,
      reps: "10-15",
    },
  ],
};
