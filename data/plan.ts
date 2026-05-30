import type { Plan } from "@/types";

export const PLAN: Plan = {
  push: [
    { name: "Barbell Bench Press", sets: 4, reps: "8-10" },
    { name: "Dumbbell Bench Press", sets: 3, reps: "10-12" },
    { name: "Dips", sets: 3, reps: "8-12" },
    { name: "Front Raise", sets: 3, reps: "12-15" },
    { name: "Machine Shoulder Raise", sets: 3, reps: "12-15" },
    { name: "Dumbbell Lateral Raise", sets: 3, reps: "12-15" },
    { name: "Incline Rear Delt Raise", sets: 3, reps: "12-15" },
    { name: "Skull Crusher", sets: 3, reps: "10-12" },
    { name: "Overhead Triceps Extension", sets: 3, reps: "10-12" },
  ],
  pull: [
    { name: "Pull-ups", sets: 4, reps: "8-12" },
    { name: "Barbell Row", sets: 4, reps: "8-10" },
    { name: "Cable Row", sets: 4, reps: "8-12" },
    { name: "Dumbbell Row", sets: 3, reps: "10-12" },
    { name: "Machine Row", sets: 3, reps: "10-12" },
    { name: "Hyperextensions", sets: 3, reps: "12-15" },
    { name: "Barbell Curl", sets: 3, reps: "10-12" },
    { name: "Dumbbell Curl", sets: 3, reps: "10-12" },
  ],
  legs: [
    { name: "Squats", sets: 4, reps: "8-10" },
    { name: "Leg press", sets: 4, reps: "10-12" },
    { name: "Leg Extension", sets: 3, reps: "12-15" },
    { name: "Calf Press", sets: 4, reps: "15-20" },
    { name: "Hyperextensions", sets: 3, reps: "12-15" },
    { name: "Hanging Crunches", sets: 3, reps: "12-15" },
  ],
};
