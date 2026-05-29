export type WorkoutSet = {
  kg: string;
  reps: string;
  note: string;
};

export type ExerciseState = {
  done: boolean;
  sets: WorkoutSet[];
  notes: string;
};

export type DayType = "push" | "pull" | "legs";

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
};

export type Plan = Record<DayType, Exercise[]>;

export type WorkoutState = Record<DayType, Record<number, ExerciseState>>;
