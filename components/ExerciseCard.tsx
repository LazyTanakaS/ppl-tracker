"use client";

import { useState } from "react";
import type { DayType, Exercise, ExerciseState, WorkoutSet } from "../types";
import { useRestTimer } from "../hooks/useRestTimer";

interface ExerciseCardProps {
  day: DayType;
  exIdx: number;
  exercise: Exercise;
  exState: ExerciseState | undefined;
  onToggleDone: (day: DayType, exIdx: number) => void;
  onUpdateSet: (
    day: DayType,
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    value: string,
  ) => void;
  onUpdateNotes: (day: DayType, exIdx: number, value: string) => void;
}

export default function ExerciseCard({
  day,
  exIdx,
  exercise,
  exState,
  onToggleDone,
  onUpdateNotes,
  onUpdateSet,
}: ExerciseCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDone = exState?.done ?? false;
  const { timeLeft, isRunning, start, stop } = useRestTimer(300);

  return (
    <div className={`exercise-card ${day}-card ${isDone ? "done" : ""}`}>
      <div className="exercise-header" onClick={() => setIsOpen(!isOpen)}>
        <div
          className={`exercise-check ${isDone ? "checked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(day, exIdx);
          }}
        />
        <div className="exercise-name">{exercise.name}</div>
        <div className="exercise-meta">
          {exercise.sets} × {exercise.reps}
        </div>
        <div className={`exercise-toggle ${isOpen ? "open" : ""}`}>▼</div>
      </div>

      <div className={`sets-area ${isOpen ? "open" : ""}`}>
        <div>
          <div className="sets-label">
            <span>#</span>
            <span>KG</span>
            <span>REPS</span>
            <span>NOTE</span>
          </div>

          {isRunning && timeLeft !== null && (
            <div className="timer-display">
              REST {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}

          {Array.from({ length: exercise.sets }, (_, i) => (
            <div key={i} className="set-row">
              <div className="set-num">{i + 1}</div>
              <input
                autoComplete="off"
                type="number"
                className="set-input"
                placeholder="kg"
                value={exState?.sets?.[i]?.kg ?? ""}
                onChange={(e) =>
                  onUpdateSet(day, exIdx, i, "kg", e.target.value)
                }
              />

              <input
                autoComplete="off"
                type="number"
                className="set-input"
                placeholder={exercise.reps}
                value={exState?.sets?.[i]?.reps ?? ""}
                onChange={(e) =>
                  onUpdateSet(day, exIdx, i, "reps", e.target.value)
                }
              />

              <input
                autoComplete="off"
                type="text"
                className="set-input"
                placeholder="-"
                value={exState?.sets?.[i]?.note ?? ""}
                onChange={(e) =>
                  onUpdateSet(day, exIdx, i, "note", e.target.value)
                }
              />
            </div>
          ))}

          <button
            className={`rest-btn ${isRunning ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isRunning) {
                stop();
              } else {
                start();
              }
            }}
          >
            {isRunning ? "STOP" : "REST"}
          </button>

          <textarea
            className="notes-input"
            placeholder="Exercise notes..."
            value={exState?.notes ?? ""}
            onChange={(e) => onUpdateNotes(day, exIdx, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
