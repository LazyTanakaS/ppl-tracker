"use client";

import { useMemo, useState } from "react";
import type { History, Plan, Schedule } from "@/types";
import { DAYS } from "@/lib/days";
import {
  buildChart,
  collectExercises,
  computeStats,
  getExerciseMetrics,
  getExerciseProgress,
  type DayFilter,
  type ProgressMetric,
  type StatsPeriod,
} from "@/lib/stats";
import {
  adherence,
  computeProgress,
  daysSinceLastSession,
  progressHeadline,
  weeklySessions,
} from "@/lib/progress";
import type { Unit } from "@/lib/settings";
import { sectionPanelId, sectionTabId } from "./MainNav";
import ProgressSection from "./ProgressSection";
import ExerciseDetail from "./ExerciseDetail";
import ConsistencySection from "./ConsistencySection";

interface StatsPanelProps {
  plan: Plan;
  history: History;
  schedule: Schedule;
  unit: Unit;
  onStartWorkout: () => void;
  onOpenSettings: () => void;
}

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "3 months" },
  { value: "all", label: "All time" },
];

const CHART_POINTS = 20;
const parsePeriod = (value: string): StatsPeriod =>
  value === "all" ? "all" : (Number(value) as StatsPeriod);

export default function StatsPanel({
  plan,
  history,
  schedule,
  unit,
  onStartWorkout,
  onOpenSettings,
}: StatsPanelProps) {
  const [now] = useState(() => Date.now());
  const [period, setPeriod] = useState<StatsPeriod>(30);
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [metric, setMetric] = useState<ProgressMetric>("maxKg");

  const stats = useMemo(
    () => computeStats({ plan, history, period, dayFilter, query, now }),
    [plan, history, period, dayFilter, query, now],
  );
  const report = useMemo(
    () => computeProgress({ plan, history, period, dayFilter, now }),
    [plan, history, period, dayFilter, now],
  );
  const options = useMemo(
    () =>
      collectExercises(plan, history).filter(
        (e) => dayFilter === "all" || e.day === dayFilter,
      ),
    [plan, history, dayFilter],
  );
  const withData = new Set(
    report.entries
      .filter((e) => e.trend.sessions > 0)
      .map((e) => e.exercise.id),
  );
  const activeId = options.some((o) => o.id === selectedId)
    ? selectedId
    : ((options.find((o) => withData.has(o.id)) ?? options[0])?.id ?? "");

  const progress = useMemo(
    () =>
      getExerciseProgress(stats.periodChronological, activeId).slice(
        -CHART_POINTS,
      ),
    [stats.periodChronological, activeId],
  );
  const chart = buildChart(progress, metric);
  const best = useMemo(
    () => getExerciseMetrics(stats.periodChronological, activeId),
    [stats.periodChronological, activeId],
  );
  const weeks = useMemo(() => weeklySessions(history, now, 8), [history, now]);
  const adherenceResult = useMemo(
    () => adherence(schedule, history, now),
    [schedule, history, now],
  );

  const panelProps = {
    id: sectionPanelId("stats"),
    role: "tabpanel" as const,
    "aria-labelledby": sectionTabId("stats"),
  };

  if (!stats.hasHistory) {
    return (
      <div {...panelProps} className="empty-state">
        <p>
          Your progress will show up here after you save your first workout.
        </p>
        <button type="button" className="primary-btn" onClick={onStartWorkout}>
          Start a workout
        </button>
      </div>
    );
  }

  function selectExercise(id: string) {
    setSelectedId(id);
    document.getElementById("stats-detail")?.scrollIntoView({ block: "start" });
  }

  return (
    <div {...panelProps} className="stats-panel">
      <div className="stats-toolbar">
        <label className="stats-field">
          <span className="stats-field-label">Period</span>
          <select
            className="stats-period-select"
            value={String(period)}
            onChange={(e) => setPeriod(parsePeriod(e.target.value))}
          >
            {PERIODS.map(({ value, label }) => (
              <option key={value} value={String(value)}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div
          className="stats-filter-row"
          role="group"
          aria-label="Filter by workout type"
        >
          {(["all", ...DAYS] as DayFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`stats-filter-btn ${dayFilter === filter ? "active" : ""}`}
              aria-pressed={dayFilter === filter}
              onClick={() => setDayFilter(filter)}
            >
              {filter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <ProgressSection
        report={report}
        headline={progressHeadline(report)}
        onSelect={selectExercise}
      />

      <ExerciseDetail
        unit={unit}
        options={options}
        activeId={activeId}
        onSelect={setSelectedId}
        metric={metric}
        onMetric={setMetric}
        chart={chart}
        hasSessions={progress.length > 0}
        best={best}
        rows={stats.rows}
        query={query}
        onQuery={setQuery}
        chartPoints={CHART_POINTS}
      />

      <ConsistencySection
        schedule={schedule}
        adherence={adherenceResult}
        weeks={weeks}
        daysSince={daysSinceLastSession(history, now)}
        streak={stats.weekStreak}
        calendar={stats.calendar}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
}
