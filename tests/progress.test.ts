import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adherence,
  computeProgress,
  daysSinceLastSession,
  exerciseTrend,
  progressHeadline,
  sessionScore,
  weeklySessions,
} from "../lib/progress.ts";
import type { Plan } from "../types/index.ts";
import { at, newestFirst, session } from "./helpers.ts";

const NOW = at(2026, 9, 18, 12);
const bench = (day: number, kg: string, reps = "5", id = "bench") =>
  session(at(2026, 9, day), [[kg, reps]], { id });
const PLAN: Plan = {
  push: [{ id: "bench", name: "Bench", sets: 3, reps: "5" }],
  pull: [{ id: "row", name: "Row", sets: 3, reps: "8" }],
  legs: [],
};

describe("sessionScore", () => {
  it("is the best set as an estimated 1RM and counts extra reps", () => {
    assert.equal(sessionScore([{ kg: 100, reps: 1 }]), 100);
    assert.ok(
      sessionScore([{ kg: 80, reps: 10 }]) >
        sessionScore([{ kg: 80, reps: 5 }]),
    );
    assert.equal(
      Math.round(
        sessionScore([
          { kg: 60, reps: 10 },
          { kg: 100, reps: 3 },
        ]),
      ),
      110,
    );
  });
});

describe("exerciseTrend", () => {
  it("needs three sessions", () => {
    assert.equal(
      exerciseTrend([bench(1, "80"), bench(3, "82.5")], "bench").status,
      "new",
    );
    assert.equal(exerciseTrend([], "bench").status, "new");
  });
  it("detects improvement when recent sessions beat earlier ones", () => {
    const t = exerciseTrend(
      [bench(1, "80"), bench(3, "82.5"), bench(5, "85"), bench(7, "87.5")],
      "bench",
    );
    assert.equal(t.status, "improving");
    assert.ok((t.changePct ?? 0) > 2);
    assert.equal(t.scores.length, 4);
  });
  it("counts more reps at the same weight as progress", () => {
    const t = exerciseTrend(
      [
        bench(1, "80", "5"),
        bench(3, "80", "6"),
        bench(5, "80", "8"),
        bench(7, "80", "9"),
      ],
      "bench",
    );
    assert.equal(t.status, "improving");
  });
  it("detects a decline", () => {
    const t = exerciseTrend(
      [bench(1, "100"), bench(3, "97.5"), bench(5, "92.5"), bench(7, "90")],
      "bench",
    );
    assert.equal(t.status, "declining");
    assert.ok((t.changePct ?? 0) < -2);
  });
  it("calls flat results steady, and a plateau once the last three sessions set no new best", () => {
    assert.equal(
      exerciseTrend([bench(1, "80"), bench(3, "80"), bench(5, "80")], "bench")
        .status,
      "steady",
    );
    const p = exerciseTrend(
      [bench(1, "80"), bench(3, "80"), bench(5, "80"), bench(7, "80")],
      "bench",
    );
    assert.equal(p.status, "plateau");
    const notPlateau = exerciseTrend(
      [bench(1, "80"), bench(3, "80"), bench(5, "80"), bench(7, "80.5")],
      "bench",
    );
    assert.equal(notPlateau.status, "steady");
  });
  it("uses only the last six sessions and ignores empty or invalid sets", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      bench(i + 1, String(60 + i * 2)),
    );
    assert.equal(exerciseTrend(many, "bench").scores.length, 6);
    const junk = [
      session(at(2026, 9, 2), [["", ""]]),
      session(at(2026, 9, 3), [["Infinity", "5"]]),
      bench(4, "80"),
      bench(5, "80"),
    ];
    assert.equal(exerciseTrend(junk, "bench").sessions, 2);
  });
});

describe("computeProgress / progressHeadline", () => {
  const rows = [
    ...[1, 4, 8, 12, 15].map((d, i) => bench(d, String(80 + i * 2.5))),
    ...[1, 4, 8, 12, 15].map((d, i) =>
      session(at(2026, 9, d), [[String(60 - i * 3), "8"]], {
        id: "row",
        day: "pull",
      }),
    ),
  ];
  const history = newestFirst(...rows);
  const base = {
    plan: PLAN,
    history,
    period: 30 as const,
    dayFilter: "all" as const,
    now: NOW,
  };

  it("ranks improving first and summarizes counts", () => {
    const report = computeProgress(base);
    assert.equal(report.entries[0].exercise.id, "bench");
    assert.equal(report.entries[0].trend.status, "improving");
    assert.equal(report.counts.improving, 1);
    assert.equal(report.counts.declining, 1);
    assert.equal(report.evaluated, 2);
  });
  it("respects the period and day filter", () => {
    assert.equal(computeProgress({ ...base, period: 7 }).evaluated, 0);
    assert.deepEqual(
      computeProgress({ ...base, dayFilter: "pull" }).entries.map(
        (e) => e.exercise.id,
      ),
      ["row"],
    );
  });
  it("headline reflects the balance and never divides by zero", () => {
    assert.equal(
      progressHeadline(computeProgress({ ...base, dayFilter: "push" })).tone,
      "good",
    );
    assert.equal(
      progressHeadline(computeProgress({ ...base, dayFilter: "pull" })).tone,
      "warn",
    );
    const empty = progressHeadline(computeProgress({ ...base, history: [] }));
    assert.equal(empty.tone, "neutral");
    assert.match(empty.text, /Not enough data/);
  });
  it("keeps removed exercises that still have sessions", () => {
    const gone = newestFirst(
      ...[1, 4, 8].map((d) => bench(d, "50", "5", "gone")),
    );
    const report = computeProgress({ ...base, history: gone, period: "all" });
    assert.ok(
      report.entries.some(
        (e) => e.exercise.id === "gone" && e.exercise.archived,
      ),
    );
  });
});

describe("weeklySessions / adherence / daysSince", () => {
  const history = newestFirst(
    session(at(2026, 9, 16), []),
    session(at(2026, 9, 14), []),
    session(at(2026, 9, 9), []),
    session(at(2026, 8, 20), []),
  );
  it("counts sessions per week, oldest first, current week last", () => {
    const weeks = weeklySessions(history, NOW, 4);
    assert.deepEqual(
      weeks.map((w) => w.count),
      [0, 0, 1, 2],
    );
    assert.equal(weeks[3].weekStart, "2026-09-14");
    assert.equal(weeklySessions([], NOW, 8).length, 8);
  });
  it("measures adherence against the schedule by week, only for days already due", () => {
    const schedule = { 1: "push", 3: "pull", 5: "legs" } as const;
    const a = adherence(schedule, history, NOW, 2);
    assert.equal(a.planned, 6);
    assert.equal(a.done, 3);
    assert.equal(a.pct, 50);
    assert.equal(a.thisWeekDone, 2);
    assert.equal(a.thisWeekPlanned, 3);
  });
  it("does not count a scheduled day that has not happened yet", () => {
    const a = adherence(
      { 1: "push", 6: "legs" },
      history,
      at(2026, 9, 15, 9),
      1,
    );
    assert.equal(a.planned, 1);
  });
  it("has no percentage without a schedule", () => {
    assert.equal(adherence({}, history, NOW).pct, null);
  });
  it("counts days since the last session", () => {
    assert.equal(daysSinceLastSession(history, NOW), 2);
    assert.equal(daysSinceLastSession(history, at(2026, 9, 16, 23)), 0);
    assert.equal(daysSinceLastSession([], NOW), null);
  });
});
