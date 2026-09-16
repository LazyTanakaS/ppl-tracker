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
  id: string;
  name: string;
  sets: number;
  reps: string;
};

export type WorkoutSession = {
  date: string;
  day: DayType;
  exercises: Exercise[];
  workout: Record<string, ExerciseState>;
};

export type History = WorkoutSession[];

export type Plan = Record<DayType, Exercise[]>;

export type WorkoutState = Record<DayType, Record<string, ExerciseState>>;

export type Schedule = Partial<Record<number, DayType>>;
