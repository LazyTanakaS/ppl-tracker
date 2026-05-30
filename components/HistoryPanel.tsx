"use client";

import { useState } from "react";
import type { History, DayType } from "@/types";

interface HistoryPanelProps {
  history: History;
  onDelete: (index: number) => void;
}

const DAY_COLORS: Record<DayType, string> = {
  push: "var(--accent-push)",
  pull: "var(--accent-pull)",
  legs: "var(--accent-legs)",
};

export default function HistoryPanel({ history, onDelete }: HistoryPanelProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (history.length === 0) {
    return <div className="history-empty">No saved sessions</div>;
  }

  return (
    <div className="history-list">
      {history.map((session, i) => {
        const date = new Date(session.date);
        const exercises = session.exercises ?? [];
        const doneCount = exercises.filter(
          (_, idx) => session.workout[idx]?.done,
        ).length;
        const isOpen = openIdx === i;

        return (
          <div key={i} className="history-card">
            <div
              className="history-card-header"
              onClick={() => setOpenIdx(isOpen ? null : i)}
            >
              <span
                className="history-day"
                style={{ color: DAY_COLORS[session.day] }}
              >
                {session.day.toUpperCase()}
              </span>

              <span className="history-date">
                {date.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>

              <span className="history-progress">
                {doneCount}/{exercises.length}
              </span>

              <button
                className="history-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(i);
                }}
              >
                ✕
              </button>
            </div>

            {isOpen && (
              <div className="history-exercises">
                {exercises.map((ex, idx) => {
                  const exState = session.workout[idx];
                  const sets = exState?.sets ?? [];
                  const hasData = sets.some((s) => s.kg);

                  return (
                    <div key={idx} className="history-exercise-row">
                      <span className="history-exercise-name">{ex.name}</span>
                      <span className="history-exercise-sets">
                        {hasData
                          ? sets
                              .filter((s) => s.kg)
                              .map((s) => `${s.kg}kgx${s.reps || "?"}`)
                              .join("/")
                          : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
