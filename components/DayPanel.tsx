import type { DayType, Exercise, ExerciseState, WorkoutSet } from "../types";
import ProgressBar from "./ProgressBar";
import ExerciseCard from "./ExerciseCard";
import { useState } from "react";

interface DayPanelProps {
  day: DayType;
  isActive: boolean;
  exercises: Exercise[];
  workout: Record<string, ExerciseState>;
  onToggleDone: (day: DayType, exId: string) => void;
  onUpdateSet: (
    day: DayType,
    exId: string,
    setIdx: number,
    field: keyof WorkoutSet,
    value: string,
  ) => void;
  onUpdateNotes: (day: DayType, exId: string, value: string) => void;
  onReset: (day: DayType) => void;
  onSave: () => boolean;
  onEditPlan: () => void;
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
  onSave,
  onEditPlan,
}: DayPanelProps) {
  const doneCount = exercises.filter((ex) => workout[ex.id]?.done).length;
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  function handleSave() {
    const ok = onSave();

    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveFailed(true);
      setTimeout(() => setSaveFailed(false), 3000);
    }
  }
  const MUSCLES = {
    push: "Chest / Shoulders / Triceps",
    pull: "Back / Biceps",
    legs: "Legs / Abs",
  };

  return (
    <div className={`day-panel ${isActive ? "active" : ""}`}>
      <div className="day-header">
        <div className={`day-title ${day}`}>{day.toUpperCase()}</div>
        <div className="day-muscles">{MUSCLES[day]}</div>
        <button className="plan-edit-open-btn" onClick={onEditPlan}>
          ✎ PLAN
        </button>
      </div>

      <ProgressBar day={day} done={doneCount} total={exercises.length} />

      {exercises.map((ex) => (
        <ExerciseCard
          key={ex.id}
          day={day}
          exId={ex.id}
          exercise={ex}
          exState={workout[ex.id]}
          onToggleDone={onToggleDone}
          onUpdateSet={onUpdateSet}
          onUpdateNotes={onUpdateNotes}
        />
      ))}

      <button className="reset-btn" onClick={() => onReset(day)}>
        ↺ Reset day
      </button>

      <button
        className={`save-btn ${saved ? "saved" : ""}`}
        onClick={handleSave}
      >
        {saved ? "✓ Saved" : "↓ Save session"}
      </button>

      {saveFailed && (
        <div style={{ color: "#e05555", fontSize: "12px", marginTop: "8px" }}>
          Save failed - storage is full. Try exporting/clearing old history.
        </div>
      )}
    </div>
  );
}
