import type { Plan } from "@/types";

export const PLAN: Plan = {
  push: [
    { name: "Жим штанги лежа", sets: 4, reps: "8-10" },
    { name: "Жим гантелей лежа", sets: 3, reps: "10-12" },
    { name: "Брусья", sets: 3, reps: "8-12" },
    { name: "Отведение рук вперед", sets: 3, reps: "12-15" },
    { name: "Поднятие рук в тренажере", sets: 3, reps: "12-15" },
    { name: "Махи гантелей", sets: 3, reps: "12-15" },
    { name: "Махи на наклонной скамье", sets: 3, reps: "12-15" },
    { name: "Французский жим", sets: 3, reps: "10-12" },
    { name: "Французский жим за спиной", sets: 3, reps: "10-12" },
  ],
  pull: [
    { name: "Подтягивания", sets: 4, reps: "8-12" },
    { name: "Тяга штанги", sets: 4, reps: "8-10" },
    { name: "Тяга в блоке", sets: 4, reps: "8-12" },
    { name: "Тяга гантели", sets: 3, reps: "10-12" },
    { name: "Тяга в тренажере", sets: 3, reps: "10-12" },
    { name: "Гиперэкстензия", sets: 3, reps: "12-15" },
    { name: "Подъем штанги на бицепс", sets: 3, reps: "10-12" },
    { name: "Жим гантелей на бицепс", sets: 3, reps: "10-12" },
  ],
  legs: [
    { name: "Приседания", sets: 4, reps: "8-10" },
    { name: "Leg press", sets: 4, reps: "10-12" },
    { name: "Разгибание ног", sets: 3, reps: "12-15" },
    { name: "Жим на икры", sets: 4, reps: "15-20" },
    { name: "Гиперэкстензия", sets: 3, reps: "12-15" },
    { name: "Скручивания на турнике", sets: 3, reps: "12-15" },
  ],
};
