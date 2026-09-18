"use client";

import { useState } from "react";
import type { Plan, History, DayType, Exercise } from "@/types";
import {
  findPersonalRecord,
  calculateWeeklyVolume,
  getExerciseProgress,
} from "@/lib/stats";

interface StatsPanelProps {
  plan: Plan;
  history: History;
}

type ExerciseWithDay = Exercise & { day: DayType };

const DAY_COLORS: Record<DayType, string> = {
  push: "var(--accent-push)",
  pull: "var(--accent-pull)",
  legs: "var(--accent-legs)",
};

export default function StatsPanel({ plan, history }: StatsPanelProps) {
  const allExercises: ExerciseWithDay[] = (
    ["push", "pull", "legs"] as DayType[]
  ).flatMap((day) => plan[day].map((ex) => ({ ...ex, day })));

  const [selectedId, setSelectedId] = useState<string>(
    allExercises[0]?.id ?? "",
  );

  const WeeklyVolume = calculateWeeklyVolume(history).slice(-8);
  const maxVolume = Math.max(1, ...WeeklyVolume.map((w) => w.volume));

  const progress = getExerciseProgress(history, selectedId);
  const maxProgressKg = Math.max(1, ...progress.map((p) => p.maxKg));

  if (history.length === 0) {
    return (
      <div className="history-empty"> No data yet - save a session first</div>
    );
  }

  return (
    <div className="stats-panel">
      <section className="stats-section">
        <h3 className="stats-heading">Personal Records</h3>
        <div className="stats-pr-list">
          {allExercises.map((ex) => {
            const pr = findPersonalRecord(history, ex.id);
            return (
              <div key={ex.id} className="stats-pr-row">
                <span
                  className="stats-pr-day-dot"
                  style={{ background: DAY_COLORS[ex.day] }}
                />
                <span className="stats-pr-name">{ex.name}</span>
                <span className="stats-pr-value">
                  {pr ? `${pr.kg}kg × ${pr.reps}` : "-"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Weekly Volume</h3>
        <div className="stats-bar-list">
          {WeeklyVolume.length === 0 && (
            <div className="stats-empty">Not enough data yet</div>
          )}
          {WeeklyVolume.map((w) => (
            <div key={w.weekStart} className="stats-bar-row">
              <span className="stats-bar-label">{w.weekStart}</span>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{ width: `${(w.volume / maxVolume) * 100}% ` }}
                ></div>
              </div>
              <span className="stats-bar-value">
                {Math.round(w.volume).toLocaleString()} kg
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-section">
        <h3 className="stats-heading">Exercise Progress</h3>
        <select
          className="stats-select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {allExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>

        <div className="stats-bar-list">
          {progress.length === 0 && (
            <div className="stats-empty">
              No sets logged for this exercise yet
            </div>
          )}
          {progress.map((p) => (
            <div key={p.date} className="stats-bar-row">
              <span className="stats-bar-label">
                {new Date(p.date).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill"
                  style={{ width: `${(p.maxKg / maxProgressKg) * 100}%` }}
                ></div>
              </div>
              <span className="stats-bar-value">
                {p.maxKg}kg (~{p.estimated1RM} 1RM)
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
