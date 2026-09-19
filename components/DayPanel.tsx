"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DayType,
  Exercise,
  ExerciseState,
  SetField,
  WorkoutSet,
} from "../types";
import { DAY_MUSCLES } from "@/lib/days";
import { firstPendingExerciseId, type SetOutcome } from "@/lib/workout";
import type { Unit } from "@/lib/settings";
import ExerciseCard from "./ExerciseCard";
import { dayPanelId, dayTabId } from "./DaySwitcher";

export type SaveResult = "ok" | "empty" | "error";

interface DayPanelProps {
  day: DayType;
  isActive: boolean;
  exercises: Exercise[];
  workout: Record<string, ExerciseState>;
  lastSets: Map<string, WorkoutSet[]>;
  unit: Unit;
  onSetStatus: (
    day: DayType,
    exId: string,
    status: ExerciseState["status"],
  ) => void;
  onUpdateSet: (
    day: DayType,
    exId: string,
    setIdx: number,
    field: SetField,
    value: string,
  ) => void;
  onToggleSet: (day: DayType, exercise: Exercise, setIdx: number) => SetOutcome;
  onStepKg: (
    day: DayType,
    exercise: Exercise,
    setIdx: number,
    delta: number,
  ) => void;
  onUpdateNotes: (day: DayType, exId: string, value: string) => void;
  onStartRest: (exerciseName: string) => void;
  onReset: (day: DayType) => void;
  onSave: () => SaveResult;
  onEditPlan: () => void;
}

const MESSAGE_MS = 3500;

export default function DayPanel({
  day,
  isActive,
  exercises,
  workout,
  lastSets,
  unit,
  onSetStatus,
  onUpdateSet,
  onToggleSet,
  onStepKg,
  onUpdateNotes,
  onStartRest,
  onReset,
  onSave,
  onEditPlan,
}: DayPanelProps) {
  const [result, setResult] = useState<SaveResult | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentId = firstPendingExerciseId(exercises, workout);
  const [manual, setManual] = useState<{
    anchor: string | null;
    id: string | null;
    touched: boolean;
  }>({
    anchor: null,
    id: null,
    touched: false,
  });
  const openId =
    manual.anchor === currentId && manual.touched ? manual.id : currentId;

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  function handleSave() {
    if (result === "ok") return;
    const outcome = onSave();
    setResult(outcome);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setResult(null), MESSAGE_MS);
  }

  function handleReset() {
    if (Object.keys(workout).length === 0) return;
    if (
      window.confirm(
        `Clear everything entered for ${day.toUpperCase()} today? Saved workouts are not affected.`,
      )
    ) {
      onReset(day);
    }
  }

  return (
    <div
      id={dayPanelId(day)}
      role="tabpanel"
      aria-labelledby={dayTabId(day)}
      hidden={!isActive}
      className={`day-panel ${isActive ? "active" : ""}`}
    >
      <div className="day-header">
        <h2 className={`day-title ${day}`}>{day.toUpperCase()}</h2>
        <div className="day-muscles">{DAY_MUSCLES[day]}</div>
        <button className="plan-edit-open-btn" onClick={onEditPlan}>
          ✎ EDIT PLAN
        </button>
      </div>

      {exercises.length === 0 ? (
        <div className="empty-state">
          <p>No exercises in the {day.toUpperCase()} plan yet.</p>
          <button type="button" className="primary-btn" onClick={onEditPlan}>
            + Add your first exercise
          </button>
        </div>
      ) : (
        exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            day={day}
            exercise={ex}
            exState={workout[ex.id]}
            lastSets={lastSets.get(ex.id)}
            unit={unit}
            isOpen={openId === ex.id}
            isCurrent={currentId === ex.id}
            onToggleOpen={() =>
              setManual({
                anchor: currentId,
                id: openId === ex.id ? null : ex.id,
                touched: true,
              })
            }
            onSetStatus={(status) => onSetStatus(day, ex.id, status)}
            onUpdateSet={(i, field, value) =>
              onUpdateSet(day, ex.id, i, field, value)
            }
            onToggleSet={(i) => onToggleSet(day, ex, i)}
            onStepKg={(i, delta) => onStepKg(day, ex, i, delta)}
            onUpdateNotes={(value) => onUpdateNotes(day, ex.id, value)}
            onStartRest={() => onStartRest(ex.name)}
          />
        ))
      )}

      {exercises.length > 0 && (
        <>
          <button
            className={`save-btn ${result === "ok" ? "saved" : ""}`}
            onClick={handleSave}
            disabled={result === "ok"}
          >
            {result === "ok" ? "✓ Workout saved" : "Finish & save workout"}
          </button>

          <div className="save-feedback" aria-live="polite">
            {result === "ok" && (
              <p>Saved to History. The form is clear for next time.</p>
            )}
            {result === "empty" && (
              <p className="form-error">
                Nothing to save yet. Log a set, add a note or mark an exercise
                first.
              </p>
            )}
          </div>
          {result === "error" && (
            <p className="form-error" role="alert">
              Could not save - device storage is full. Export a backup, then
              delete old workouts.
            </p>
          )}

          <button className="reset-btn" onClick={handleReset}>
            Clear today&apos;s entries
          </button>
        </>
      )}
    </div>
  );
}
