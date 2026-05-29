import type { DayType, Exercise, ExerciseState, WorkoutSet } from "../types";
import ProgressBar from "./ProgressBar";
import ExerciseCard from "./ExerciseCard";

interface DayPanelProps {
  day: DayType;
  isActive: boolean;
  exercises: Exercise[];
  workout: Record<number, ExerciseState>;
  onToggleDone: (day: DayType, exIdx: number) => void;
  onUpdateSet: (
    day: DayType,
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    value: string,
  ) => void;
  onUpdateNotes: (day: DayType, exIdx: number, value: string) => void;
  onReset: (day: DayType) => void;
}

export default function DayPanel({
  day,
  isActive,
  exercises,
  workout,
  onToggleDone,
  onUpdateSet,
  onUpdateNotes,
  onReset,
}: DayPanelProps) {
  const doneCount = exercises.filter((_, i) => workout[i]?.done).length;

  const MUSCLES = {
    push: "Грудь / Плечи / Трицепс",
    pull: "Спина / Бицепс",
    legs: "Ноги / Пресс",
  };

  return (
    <div className={`day-panel ${isActive ? "active" : ""}`}>
      <div className="day-header">
        <div className={`day-title ${day}`}>{day.toUpperCase()}</div>
        <div className="day-muscles">{MUSCLES[day]}</div>
      </div>

      <ProgressBar day={day} done={doneCount} total={exercises.length} />

      {exercises.map((ex, i) => (
        <ExerciseCard
          key={i}
          day={day}
          exIdx={i}
          exercise={ex}
          exState={workout[i]}
          onToggleDone={onToggleDone}
          onUpdateSet={onUpdateSet}
          onUpdateNotes={onUpdateNotes}
        />
      ))}

      <button className="reset-btn" onClick={() => onReset(day)}>
        ↺ Сбросить день
      </button>
    </div>
  );
}
