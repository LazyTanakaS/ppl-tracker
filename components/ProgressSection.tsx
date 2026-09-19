"use client";

import { useState } from "react";
import type { Headline, ProgressReport, TrendStatus } from "@/lib/progress";
import Sparkline from "./Sparkline";

interface ProgressSectionProps {
  report: ProgressReport;
  headline: Headline;
  onSelect: (exerciseId: string) => void;
}

const VISIBLE = 6;

const STATUS: Record<TrendStatus, { icon: string; label: string; tone: "good" | "warn" | "bad" | "flat" | "muted" }> = {
  improving: { icon: "▲", label: "Stronger", tone: "good" },
  plateau: { icon: "▬", label: "Plateau", tone: "warn" },
  declining: { icon: "▼", label: "Slipping", tone: "bad" },
  steady: { icon: "●", label: "Steady", tone: "flat" },
  new: { icon: "○", label: "Needs 3 workouts", tone: "muted" },
};

const HEADLINE_ICON = { good: "▲", warn: "▼", neutral: "●" } as const;

export default function ProgressSection({ report, headline, onSelect }: ProgressSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const evaluated = report.entries.filter((e) => e.trend.status !== "new");
  const visible = showAll ? report.entries : evaluated.slice(0, VISIBLE);
  const hidden = report.entries.length - visible.length;

  return (
    <section className={`stats-section progress-hero tone-${headline.tone}`} aria-labelledby="progress-heading">
      <h3 className="stats-heading" id="progress-heading">
        Am I progressing?
      </h3>
      <p className="progress-headline">
        <span className="headline-icon" aria-hidden="true">
          {HEADLINE_ICON[headline.tone]}
        </span>
        {headline.text}
      </p>

      {report.evaluated > 0 && (
        <ul className="trend-chips" aria-label="Summary">
          {(["improving", "plateau", "steady", "declining"] as const).map((status) => (
            <li key={status} className={`chip ${STATUS[status].tone}`}>
              <span aria-hidden="true">{STATUS[status].icon}</span> {report.counts[status]} {STATUS[status].label.toLowerCase()}
            </li>
          ))}
        </ul>
      )}

      {visible.length > 0 && (
        <ul className="trend-list">
          {visible.map(({ exercise, trend }) => {
            const s = STATUS[trend.status];
            const pct = trend.changePct;
            return (
              <li key={exercise.id}>
                <button type="button" className="trend-row" onClick={() => onSelect(exercise.id)}>
                  <span className={`trend-status ${s.tone}`}>
                    <span aria-hidden="true">{s.icon}</span> {s.label}
                  </span>
                  <span className="trend-name">
                    {exercise.name}
                    {exercise.archived && <em className="stats-archived"> · removed</em>}
                  </span>
                  <span className={`trend-pct ${s.tone}`}>
                    {pct === null ? `${trend.sessions}/3` : `${pct > 0 ? "+" : ""}${pct}%`}
                  </span>
                  <Sparkline values={trend.scores} tone={s.tone === "good" ? "good" : s.tone === "bad" ? "bad" : "flat"} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(hidden > 0 || showAll) && (
        <button type="button" className="link-btn" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show all (${report.entries.length})`}
        </button>
      )}

      <p className="stats-note">
        Compares your recent workouts with earlier ones for each exercise, using estimated 1RM - so more reps at the same weight counts as progress. Tap an
        exercise for its chart.
        {report.counts.plateau > 0 &&
          " Plateau = no new best in the last 3 workouts; a small weight jump, an extra rep or a lighter week usually breaks it."}
      </p>
    </section>
  );
}
