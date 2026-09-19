"use client";

import { useMemo, useState } from "react";
import type { History, WorkoutSession, WorkoutSet } from "@/types";
import { DAY_COLORS } from "@/lib/days";
import { formatFullDate } from "@/lib/format";
import { getExerciseState } from "@/lib/session";
import type { Unit } from "@/lib/settings";
import { sectionPanelId, sectionTabId } from "./MainNav";

interface HistoryPanelProps {
  history: History;
  unit: Unit;
  onDelete: (session: WorkoutSession) => boolean;
  onStartWorkout: () => void;
}

const PAGE_SIZE = 50;

const hasValues = (set: WorkoutSet) => set.kg !== "" || set.reps !== "";

const formatSet = (set: WorkoutSet, unit: Unit) =>
  `${set.kg || "?"} ${unit} × ${set.reps || "?"}`;

function sessionKeys(history: History): string[] {
  const seen = new Map<string, number>();
  return history.map((session) => {
    const base = `${session.date}|${session.day}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return `${base}|${n}`;
  });
}

export default function HistoryPanel({
  history,
  unit,
  onDelete,
  onStartWorkout,
}: HistoryPanelProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [error, setError] = useState<string | null>(null);
  const keys = useMemo(() => sessionKeys(history), [history]);

  function handleDelete(session: WorkoutSession, label: string) {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    setError(
      onDelete(session)
        ? null
        : "Could not delete the session - storage is unavailable.",
    );
  }

  return (
    <div
      id={sectionPanelId("history")}
      role="tabpanel"
      aria-labelledby={sectionTabId("history")}
      className="history-list"
    >
      {history.length === 0 ? (
        <div className="empty-state">
          <p>
            No workouts yet. Finish your first one and it will show up here.
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={onStartWorkout}
          >
            Start a workout
          </button>
        </div>
      ) : (
        <ul className="history-cards">
          {history.slice(0, visible).map((session, i) => {
            const key = keys[i];
            const isOpen = openKey === key;
            const done = session.exercises.filter(
              (ex) =>
                getExerciseState(session.workout, ex.id)?.status === "done",
            ).length;
            const dateLabel = formatFullDate(session.date);
            const label = `${session.day.toUpperCase()} workout from ${dateLabel}`;

            return (
              <li key={key} className="history-card">
                <div className="history-card-header">
                  <button
                    type="button"
                    className="history-toggle"
                    aria-expanded={isOpen}
                    aria-controls={`history-${i}`}
                    onClick={() => setOpenKey(isOpen ? null : key)}
                  >
                    <span
                      className="history-day"
                      style={{ color: DAY_COLORS[session.day] }}
                    >
                      {session.day.toUpperCase()}
                    </span>
                    <span className="history-date">{dateLabel}</span>
                    <span className="history-progress">
                      <span className="sr-only">Exercises done: </span>
                      {done}/{session.exercises.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="history-delete-btn"
                    aria-label={`Delete ${label}`}
                    onClick={() => handleDelete(session, label)}
                  >
                    ✕
                  </button>
                </div>

                {isOpen && (
                  <ul id={`history-${i}`} className="history-exercises">
                    {session.exercises.map((ex) => {
                      const state = getExerciseState(session.workout, ex.id);
                      const sets = state?.sets.filter(hasValues) ?? [];
                      return (
                        <li key={ex.id} className="history-exercise-row">
                          <span className="history-exercise-name">
                            {ex.name}
                          </span>
                          <span className="history-exercise-sets">
                            {sets.length > 0
                              ? sets
                                  .map((set) => formatSet(set, unit))
                                  .join(" · ")
                              : "-"}
                          </span>
                          {state?.notes && (
                            <p className="history-notes">{state.notes}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {history.length > visible && (
        <button
          type="button"
          className="history-more-btn"
          onClick={() => setVisible((n) => n + PAGE_SIZE)}
        >
          Show more ({history.length - visible} left)
        </button>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
