"use client";

import type {
  ChartData,
  ExerciseEntry,
  ExerciseMetrics,
  ExerciseRow,
  ProgressMetric,
} from "@/lib/stats";
import type { Unit } from "@/lib/settings";
import { DAYS, DAY_COLORS } from "@/lib/days";
import {
  formatKg,
  formatShortDate,
  formatSignedKg,
  plural,
} from "@/lib/format";

interface ExerciseDetailProps {
  unit: Unit;
  options: ExerciseEntry[];
  activeId: string;
  onSelect: (id: string) => void;
  metric: ProgressMetric;
  onMetric: (metric: ProgressMetric) => void;
  chart: ChartData | null;
  hasSessions: boolean;
  best: ExerciseMetrics | null;
  rows: ExerciseRow[];
  query: string;
  onQuery: (query: string) => void;
  chartPoints: number;
}

const METRICS: { value: ProgressMetric; label: string }[] = [
  { value: "maxKg", label: "Max weight" },
  { value: "estimated1RM", label: "Est. 1RM" },
  { value: "volume", label: "Volume" },
];

export default function ExerciseDetail({
  unit,
  options,
  activeId,
  onSelect,
  metric,
  onMetric,
  chart,
  hasSessions,
  best,
  rows,
  query,
  onQuery,
  chartPoints,
}: ExerciseDetailProps) {
  const active = options.find((o) => o.id === activeId);
  const info = METRICS.find((m) => m.value === metric) ?? METRICS[0];
  const unitLabel = metric === "volume" ? `${unit} × reps` : unit;
  const fmt = (value: number) =>
    metric === "volume" ? String(Math.round(value)) : formatKg(value);
  const groups = DAYS.map((day) => ({
    day,
    items: options.filter((o) => o.day === day),
  })).filter((g) => g.items.length > 0);

  return (
    <section
      className="stats-section"
      id="stats-detail"
      aria-labelledby="detail-heading"
    >
      <h3 className="stats-heading" id="detail-heading">
        Exercise detail
      </h3>

      <label className="stats-field">
        <span className="stats-field-label">Exercise</span>
        <select
          className="stats-select"
          value={activeId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {groups.map(({ day, items }) => (
            <optgroup key={day} label={day.toUpperCase()}>
              {items.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                  {exercise.archived ? " (removed)" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="stats-filter-row" role="group" aria-label="Chart metric">
        {METRICS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`stats-filter-btn ${metric === value ? "active" : ""}`}
            aria-pressed={metric === value}
            onClick={() => onMetric(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {best && (
        <p className="best-line">
          Best set in this period:{" "}
          <strong>
            {formatKg(best.maxKg)} {unit} × {best.maxKgReps}
          </strong>{" "}
          on {formatShortDate(best.maxKgDate)}
          {best.estimated1RM !== null && (
            <>
              {" "}
              · est. 1RM{" "}
              <strong>
                {formatKg(best.estimated1RM)} {unit}
              </strong>
            </>
          )}
        </p>
      )}

      {active && chart ? (
        <figure className="stats-chart-figure">
          <div className="chart-frame">
            <div className="chart-y" aria-hidden="true">
              <span>{fmt(chart.max)}</span>
              <span>{fmt(chart.min)}</span>
            </div>
            <div
              className="chart-plot"
              role="img"
              aria-label={`${active.name}, ${info.label}: ${plural(chart.points.length, "workout")}, from ${fmt(chart.points[0].value)} to ${fmt(chart.points[chart.points.length - 1].value)} ${unitLabel}`}
            >
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <line x1="0" y1="8" x2="100" y2="8" className="chart-grid" />
                <line x1="0" y1="92" x2="100" y2="92" className="chart-grid" />
                <polyline
                  className="chart-line"
                  points={chart.points.map((p) => `${p.x},${p.y}`).join(" ")}
                />
              </svg>
              {chart.points.map((p) => (
                <span
                  key={p.date}
                  className="chart-point"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  title={`${formatShortDate(p.date)}: ${fmt(p.value)} ${unitLabel}`}
                />
              ))}
            </div>
          </div>
          <div className="chart-x" aria-hidden="true">
            <span>{formatShortDate(chart.points[0].date)}</span>
            <span>
              {formatShortDate(chart.points[chart.points.length - 1].date)}
            </span>
          </div>
          <figcaption className="stats-note">
            {info.label} ({unitLabel}) per workout, latest{" "}
            <b>{fmt(chart.points[chart.points.length - 1].value)}</b>. Up to the
            last {chartPoints} workouts in the selected period.
          </figcaption>
          <div className="sr-only">
            <table>
              <caption>
                {active.name}: {info.label}
              </caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>{unitLabel}</th>
                </tr>
              </thead>
              <tbody>
                {chart.points.map((p) => (
                  <tr key={p.date}>
                    <td>{formatShortDate(p.date)}</td>
                    <td>{fmt(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      ) : (
        <p className="stats-empty">
          {hasSessions
            ? "This metric has no data for the exercise (Est. 1RM needs sets of up to 12 reps)."
            : "No sets logged for this exercise in the selected period."}
        </p>
      )}

      <details className="all-bests">
        <summary>All best sets</summary>
        <p className="stats-note">
          Heaviest set per exercise in the selected period.{" "}
          <b className="pr-badge">PR</b> marks an all-time best set in this
          period. Est. 1RM = weight × (1 + reps ÷ 30), only for sets of up to 12
          reps.
        </p>
        <label className="stats-field stats-search">
          <span className="stats-field-label">Find exercise</span>
          <input
            type="search"
            className="stats-search-input"
            value={query}
            placeholder="Search by name"
            autoComplete="off"
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        <div className="stats-pr-header" aria-hidden="true">
          <span />
          <span>EXERCISE</span>
          <span>BEST SET</span>
          <span>EST. 1RM</span>
          <span>VS PREV. PERIOD</span>
        </div>
        <ul className="stats-pr-list">
          {rows.length === 0 && (
            <li className="stats-empty">No exercises match.</li>
          )}
          {rows.map(({ exercise, best: rowBest, change, isAllTimePr }) => (
            <li key={exercise.id} className="stats-pr-row">
              <span
                className="stats-pr-day-dot"
                style={{ background: DAY_COLORS[exercise.day] }}
                aria-hidden="true"
              />
              <span className="stats-pr-name">
                <span className="sr-only">{exercise.day}: </span>
                {exercise.name}
                {exercise.archived && (
                  <em className="stats-archived"> · removed from plan</em>
                )}
              </span>
              <span className="stats-pr-best">
                {rowBest ? (
                  <>
                    <strong>
                      {formatKg(rowBest.maxKg)} {unit} × {rowBest.maxKgReps}
                    </strong>
                    {isAllTimePr && <b className="pr-badge">PR</b>}
                    <small>{formatShortDate(rowBest.maxKgDate)}</small>
                  </>
                ) : (
                  <span className="stats-muted">No sets in this period</span>
                )}
              </span>
              <span className="stats-pr-1rm">
                {rowBest && (
                  <>
                    <span className="cell-label">Est. 1RM </span>
                    {rowBest.estimated1RM === null ? (
                      <span
                        className="stats-muted"
                        title="Sets above 12 reps are not used for 1RM"
                      >
                        -
                      </span>
                    ) : (
                      `${formatKg(rowBest.estimated1RM)} ${unit}`
                    )}
                  </>
                )}
              </span>
              <span
                className={`stats-change ${change === null || change === 0 ? "neutral" : change > 0 ? "positive" : "negative"}`}
              >
                {change === null ? (
                  <>
                    <span aria-hidden="true">-</span>
                    <span className="sr-only">
                      No previous period to compare
                    </span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">
                      {change > 0 ? "▲ " : change < 0 ? "▼ " : ""}
                    </span>
                    {change === 0
                      ? "no change"
                      : `${formatSignedKg(change)} ${unit}`}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
