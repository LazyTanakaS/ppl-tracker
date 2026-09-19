"use client";

import { useId, useRef, useState } from "react";
import type {
  DayType,
  Exercise,
  ExerciseState,
  SetField,
  WorkoutSet,
} from "../types";
import type { SetOutcome } from "@/lib/workout";
import type { Unit } from "@/lib/settings";
import { unitStep } from "@/lib/settings";

interface ExerciseCardProps {
  day: DayType;
  exercise: Exercise;
  exState: ExerciseState | undefined;
  lastSets?: WorkoutSet[];
  unit: Unit;
  isOpen: boolean;
  isCurrent: boolean;
  onToggleOpen: () => void;
  onSetStatus: (status: ExerciseState["status"]) => void;
  onUpdateSet: (setIdx: number, field: SetField, value: string) => void;
  onToggleSet: (setIdx: number) => SetOutcome;
  onStepKg: (setIdx: number, delta: number) => void;
  onUpdateNotes: (value: string) => void;
  onStartRest: () => void;
}

const STATUS_LABEL = {
  pending: "not done",
  done: "done",
  skipped: "skipped",
} as const;

export default function ExerciseCard({
  day,
  exercise,
  exState,
  lastSets,
  unit,
  isOpen,
  isCurrent,
  onToggleOpen,
  onSetStatus,
  onUpdateSet,
  onToggleSet,
  onStepKg,
  onUpdateNotes,
  onStartRest,
}: ExerciseCardProps) {
  const setsId = useId();
  const status = exState?.status ?? "pending";
  const sets = exState?.sets ?? [];
  const doneSets = sets.slice(0, exercise.sets).filter((s) => s.done).length;
  const firstUndone = Math.max(
    0,
    Array.from(
      { length: exercise.sets },
      (_, i) => sets[i]?.done ?? false,
    ).indexOf(false),
  );
  const [focused, setFocused] = useState<number | null>(null);
  const activeSet = Math.min(focused ?? firstUndone, exercise.sets - 1);
  const step = unitStep(unit);
  const kgInputs = useRef<(HTMLInputElement | null)[]>([]);
  const repsInputs = useRef<(HTMLInputElement | null)[]>([]);

  function onKeyDown(
    event: React.KeyboardEvent,
    index: number,
    field: "kg" | "reps",
  ) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (field === "kg") {
      repsInputs.current[index]?.focus();
      return;
    }
    const outcome = onToggleSet(index);
    if (outcome === "done") {
      setFocused(index + 1 < exercise.sets ? index + 1 : null);
      kgInputs.current[index + 1]?.focus();
    }
  }

  return (
    <div
      className={`exercise-card ${day}-card ${status === "done" ? "done" : ""} ${status === "skipped" ? "skipped" : ""} ${isCurrent ? "current" : ""}`}
    >
      <div className="exercise-header">
        <button
          type="button"
          className="exercise-status-btn"
          aria-label={`${exercise.name}: ${STATUS_LABEL[status]}. ${status === "done" ? "Mark as not done" : "Mark as done"}`}
          onClick={() => onSetStatus(status === "done" ? "pending" : "done")}
        >
          <span
            className={`exercise-check ${status === "done" ? "checked" : ""} ${status === "skipped" ? "skipped" : ""}`}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          className="exercise-toggle-btn"
          aria-expanded={isOpen}
          aria-controls={setsId}
          onClick={onToggleOpen}
        >
          <span className="exercise-name">{exercise.name}</span>
          <span className="exercise-meta">
            {doneSets > 0 && status !== "done"
              ? `${doneSets}/${exercise.sets} · `
              : ""}
            {exercise.sets} × {exercise.reps}
          </span>
          <span
            className={`exercise-toggle ${isOpen ? "open" : ""}`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>
      </div>

      <div
        id={setsId}
        className={`sets-area ${isOpen ? "open" : ""}`}
        inert={!isOpen}
      >
        <div>
          <div className="sets-label" aria-hidden="true">
            <span>#</span>
            <span>{unit.toUpperCase()}</span>
            <span>REPS</span>
            <span />
          </div>

          {Array.from({ length: exercise.sets }, (_, i) => {
            const set = sets[i];
            return (
              <div key={i} className={`set-row ${set?.done ? "is-done" : ""}`}>
                <div className="set-num">{i + 1}</div>
                <input
                  ref={(el) => {
                    kgInputs.current[i] = el;
                  }}
                  autoComplete="off"
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="next"
                  className="set-input"
                  aria-label={`Set ${i + 1} weight (${unit})`}
                  placeholder={lastSets?.[i]?.kg || unit}
                  value={set?.kg ?? ""}
                  onFocus={() => setFocused(i)}
                  onChange={(e) => onUpdateSet(i, "kg", e.target.value)}
                  onKeyDown={(e) => onKeyDown(e, i, "kg")}
                />
                <input
                  ref={(el) => {
                    repsInputs.current[i] = el;
                  }}
                  autoComplete="off"
                  type="text"
                  inputMode="numeric"
                  enterKeyHint="done"
                  className="set-input"
                  aria-label={`Set ${i + 1} repetitions`}
                  placeholder={lastSets?.[i]?.reps || exercise.reps}
                  value={set?.reps ?? ""}
                  onFocus={() => setFocused(i)}
                  onChange={(e) => onUpdateSet(i, "reps", e.target.value)}
                  onKeyDown={(e) => onKeyDown(e, i, "reps")}
                />
                <button
                  type="button"
                  className={`set-check ${set?.done ? "checked" : ""}`}
                  aria-pressed={set?.done ?? false}
                  aria-label={
                    set?.done
                      ? `Set ${i + 1} done. Tap to undo`
                      : `Log set ${i + 1}${lastSets?.[i] || i > 0 ? " (fills empty fields with the previous values)" : ""}`
                  }
                  onClick={() => {
                    const outcome = onToggleSet(i);
                    if (outcome === "needs-input") kgInputs.current[i]?.focus();
                    else setFocused(null);
                  }}
                >
                  <span aria-hidden="true">✓</span>
                </button>
              </div>
            );
          })}

          <div
            className="stepper"
            role="group"
            aria-label={`Adjust weight of set ${activeSet + 1}`}
          >
            <span className="stepper-label">Set {activeSet + 1} weight</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => onStepKg(activeSet, -step)}
              aria-label={`Decrease by ${step} ${unit}`}
            >
              −{step}
            </button>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => onStepKg(activeSet, step)}
              aria-label={`Increase by ${step} ${unit}`}
            >
              +{step}
            </button>
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="rest-btn"
              onClick={onStartRest}
              aria-label={`Start rest timer after ${exercise.name}`}
            >
              REST
            </button>
            <button
              type="button"
              className="rest-btn"
              onClick={() =>
                onSetStatus(status === "skipped" ? "pending" : "skipped")
              }
            >
              {status === "skipped" ? "UNDO SKIP" : "SKIP"}
            </button>
          </div>

          <textarea
            className="notes-input"
            aria-label={`${exercise.name} notes`}
            placeholder="Notes: how did it feel?"
            value={exState?.notes ?? ""}
            onChange={(e) => onUpdateNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
