import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDaysToKey,
  buildActivityCalendar,
  buildChart,
  collectExercises,
  computeStats,
  currentWeekStreak,
  estimate1RM,
  getExerciseMetrics,
  getExerciseProgress,
  localDateKey,
  periodRange,
  sessionsInRange,
  weekStartKey,
} from "../lib/stats.ts";
import { formatSignedKg, plural } from "../lib/format.ts";
import type { Plan } from "../types/index.ts";
import { at, iso, newestFirst, session } from "./helpers.ts";

const NOW = at(2026, 9, 18, 12);
const PLAN: Plan = {
  push: [{ id: "bench", name: "Bench press", sets: 3, reps: "5" }],
  pull: [{ id: "row", name: "Cable row", sets: 3, reps: "8" }],
  legs: [],
};

describe("estimate1RM", () => {
  it("uses Epley and returns the weight itself for a single rep", () => {
    assert.equal(estimate1RM(100, 1), 100);
    assert.ok(Math.abs((estimate1RM(100, 5) ?? 0) - 116.667) < 0.01);
    assert.ok(Math.abs((estimate1RM(80, 12) ?? 0) - 112) < 1e-9);
  });
  it("does not extrapolate high-rep sets or accept junk", () => {
    assert.equal(estimate1RM(100, 13), null);
    assert.equal(estimate1RM(100, 30), null);
    assert.equal(estimate1RM(0, 5), null);
    assert.equal(estimate1RM(100, 0), null);
  });
});

describe("getExerciseMetrics", () => {
  it("dates the PR by the set that made it, not by another metric (H5)", () => {
    const history = [
      session(at(2026, 8, 27), [["100", "3"]]),
      session(at(2026, 9, 3), [["80", "12"]]),
      session(at(2026, 9, 10), [["100", "3"]]),
    ];
    const m = getExerciseMetrics(history, "bench");
    assert.equal(m?.maxKg, 100);
    assert.equal(m?.maxKgReps, 3);
    assert.equal(localDateKey(Date.parse(m?.maxKgDate ?? "")), "2026-08-27");
    assert.equal(m?.estimated1RM, 112);
    assert.equal(
      localDateKey(Date.parse(m?.estimated1RMDate ?? "")),
      "2026-09-03",
    );
  });

  it("prefers more reps at the same weight", () => {
    const history = [
      session(at(2026, 9, 3), [["100", "8"]]),
      session(at(2026, 9, 10), [["100", "3"]]),
    ];
    assert.equal(getExerciseMetrics(history, "bench")?.maxKgReps, 8);
  });

  it("ignores invalid sets and never yields NaN/Infinity/negatives", () => {
    const history = [
      session(at(2026, 9, 3), [
        ["Infinity", "5"],
        ["-50", "5"],
        ["50", "0"],
        ["", ""],
        ["abc", "5"],
        ["60", "5"],
      ]),
    ];
    const m = getExerciseMetrics(history, "bench");
    assert.equal(m?.maxKg, 60);
    assert.ok(Number.isFinite(m?.estimated1RM ?? NaN));
  });

  it("returns null 1RM but keeps the best set when every set is above 12 reps", () => {
    const m = getExerciseMetrics(
      [session(at(2026, 9, 3), [["20", "15"]])],
      "bench",
    );
    assert.equal(m?.maxKg, 20);
    assert.equal(m?.estimated1RM, null);
  });

  it("is null without data and safe on malformed sessions", () => {
    assert.equal(getExerciseMetrics([], "bench"), null);
    const broken = [
      {
        date: iso(NOW),
        day: "push",
        exercises: [],
        workout: { bench: { status: "done" } },
      },
      { date: iso(NOW), day: "push", exercises: [], workout: {} },
    ] as unknown as Parameters<typeof getExerciseMetrics>[0];
    assert.equal(getExerciseMetrics(broken, "bench"), null);
    assert.equal(getExerciseMetrics(broken, "constructor"), null);
  });
});

describe("getExerciseProgress / buildChart", () => {
  const history = [
    session(at(2026, 9, 1), [
      ["60", "10"],
      ["70", "5"],
    ]),
    session(at(2026, 9, 8), [["80", "5"]]),
    session(at(2026, 9, 15), [["82.5", "5"]]),
  ];

  it("builds per-session points in the given order", () => {
    const points = getExerciseProgress(history, "bench");
    assert.deepEqual(
      points.map((p) => p.maxKg),
      [70, 80, 82.5],
    );
    assert.equal(points[0].volume, 60 * 10 + 70 * 5);
  });

  it("maps a single point to the centre", () => {
    const chart = buildChart(
      getExerciseProgress(history.slice(0, 1), "bench"),
      "maxKg",
    );
    assert.deepEqual(
      chart?.points.map((p) => [p.x, p.y]),
      [[50, 50]],
    );
  });

  it("spaces points by time and scales values", () => {
    const chart = buildChart(getExerciseProgress(history, "bench"), "maxKg");
    assert.deepEqual(
      chart?.points.map((p) => Math.round(p.x)),
      [0, 50, 100],
    );
    assert.equal(chart?.min, 70);
    assert.equal(chart?.max, 82.5);
    const ys = chart?.points.map((p) => p.y) ?? [];
    assert.ok(ys[0] > ys[1] && ys[1] > ys[2]);
    assert.ok(ys.every((y) => y >= 0 && y <= 100));
  });

  it("returns null when the metric has no data", () => {
    const points = getExerciseProgress(
      [session(at(2026, 9, 1), [["20", "15"]])],
      "bench",
    );
    assert.equal(buildChart(points, "estimated1RM"), null);
    assert.ok(buildChart(points, "volume"));
  });
});

describe("dates", () => {
  it("adds days across month, year and leap boundaries", () => {
    assert.equal(addDaysToKey("2026-03-01", -1), "2026-02-28");
    assert.equal(addDaysToKey("2024-03-01", -1), "2024-02-29");
    assert.equal(addDaysToKey("2025-12-31", 1), "2026-01-01");
  });
  it("finds the Monday of a week (Sunday belongs to the previous Monday)", () => {
    assert.equal(weekStartKey(at(2026, 9, 18)), "2026-09-14");
    assert.equal(weekStartKey(at(2026, 9, 14, 0, 1)), "2026-09-14");
    assert.equal(weekStartKey(at(2026, 9, 20, 23, 59)), "2026-09-14");
    assert.equal(weekStartKey(at(2026, 9, 21, 0, 0)), "2026-09-21");
  });
  it("keys a late-evening or early-morning session by the local day (H4)", () => {
    assert.equal(localDateKey(at(2026, 9, 17, 0, 30)), "2026-09-17");
    assert.equal(localDateKey(at(2026, 9, 17, 23, 30)), "2026-09-17");
    assert.equal(localDateKey(NaN), "");
  });
});

describe("periodRange / sessionsInRange", () => {
  it("covers today plus N-1 days and the N days before for comparison", () => {
    assert.deepEqual(periodRange(7, NOW), {
      from: "2026-09-12",
      to: "2026-09-18",
      previousFrom: "2026-09-05",
      previousTo: "2026-09-11",
    });
    assert.deepEqual(periodRange("all", NOW), {
      from: null,
      to: null,
      previousFrom: null,
      previousTo: null,
    });
  });

  it("includes the first and last day and excludes the day outside", () => {
    const history = newestFirst(
      session(at(2026, 9, 11, 23, 30), [["1", "1"]]),
      session(at(2026, 9, 12, 0, 30), [["1", "1"]]),
      session(at(2026, 9, 18, 23, 59), [["1", "1"]]),
      session(at(2026, 9, 19, 0, 1), [["1", "1"]]),
    );
    const r = periodRange(7, NOW);
    assert.equal(sessionsInRange(history, r.from, r.to).length, 2);
  });
});

describe("currentWeekStreak", () => {
  it("counts consecutive weeks including the current one", () => {
    const history = [
      session(at(2026, 9, 16), []),
      session(at(2026, 9, 9), []),
      session(at(2026, 9, 2), []),
    ];
    assert.equal(currentWeekStreak(history, NOW), 3);
  });
  it("is not capped at seven days (H3)", () => {
    const history = Array.from({ length: 21 }, (_, i) =>
      session(at(2026, 9, 18 - i), []),
    );
    assert.equal(currentWeekStreak(history, NOW), 4);
  });
  it("keeps the streak alive while the current week is still empty", () => {
    const history = [session(at(2026, 9, 10), []), session(at(2026, 9, 3), [])];
  });
  it("breaks after a missed week and is zero when data is stale (H2)", () => {
    assert.equal(
      currentWeekStreak(
        [session(at(2026, 9, 16), []), session(at(2026, 9, 2), [])],
        NOW,
      ),
      1,
    );
    assert.equal(currentWeekStreak([session(at(2026, 6, 10), [])], NOW), 0);
    assert.equal(currentWeekStreak([], NOW), 0);
  });
});

describe("buildActivityCalendar", () => {
  it("has 12 Monday-based columns, ends with the current week and flags the future", () => {
    const { cells, activeDays } = buildActivityCalendar(
      [session(at(2026, 9, 17, 1), []), session(at(2026, 9, 17, 20), [])],
      NOW,
    );
    assert.equal(cells.length, 84);
    assert.equal(cells[0].key, addDaysToKey("2026-09-14", -77));
    assert.equal(cells[77].key, "2026-09-14");
    assert.equal(cells[83].key, "2026-09-20");
    assert.equal(cells.find((c) => c.key === "2026-09-17")?.count, 2);
    assert.equal(activeDays, 1);
  });
});

describe("computeStats", () => {
  const history = newestFirst(
    session(at(2026, 9, 17), [["62.6", "5"]]),
    session(at(2026, 9, 10), [["60.2", "5"]]),
    session(at(2026, 8, 1), [["100", "3"]]),
    session(at(2026, 9, 16), [["50", "8"]], { id: "row", day: "pull" }),
    session(at(2026, 9, 5), [["40", "8"]], { id: "gone", day: "push" }),
  );
  const base = {
    plan: PLAN,
    history,
    period: 7 as const,
    dayFilter: "all" as const,
    query: "",
    now: NOW,
  };
  const row = (r: ReturnType<typeof computeStats>, id: string) =>
    r.rows.find((x) => x.exercise.id === id);

  it("computes change versus the previous period without float noise", () => {
    const stats = computeStats(base);
    assert.equal(row(stats, "bench")?.best?.maxKg, 62.6);
    assert.equal(formatSignedKg(2.4), "+2.4");
    assert.equal(formatSignedKg(-0.5), "-0.5");
  });

  it("marks a PR only when the all-time best falls inside the period", () => {
    assert.equal(row(computeStats(base), "row")?.isAllTimePr, true);
    assert.equal(
      row(computeStats({ ...base, period: "all" }), "bench")?.isAllTimePr,
      false,
    );
  });

  it("has no previous data for 'all' and no NaN anywhere", () => {
    const all = computeStats({ ...base, period: "all" });
    assert.equal(row(all, "bench")?.change, null);
    assert.equal(row(all, "bench")?.best?.maxKg, 100);
    assert.ok(Number.isFinite(all.weekStreak) && all.weekStreak >= 0);
  });

  it("applies the period to best sets", () => {
    const week = computeStats(base);
    assert.equal(row(week, "bench")?.best?.maxKg, 62.6);
    assert.equal(row(week, "gone")?.best, null);
    assert.equal(
      row(computeStats({ ...base, period: 30 }), "gone")?.best?.maxKg,
      40,
    );
  });

  it("applies the day filter to sessions and exercises", () => {
    const pull = computeStats({ ...base, period: 30, dayFilter: "pull" });
    assert.deepEqual(
      pull.rows.map((r) => r.exercise.id),
      ["row"],
    );
  });

  it("filters by name", () => {
    const found = computeStats({ ...base, period: 30, query: " CABLE " });
    assert.deepEqual(
      found.rows.map((r) => r.exercise.id),
      ["row"],
    );
  });

  it("keeps exercises that were removed from the plan reachable (M3)", () => {
    const gone = collectExercises(PLAN, history).find((e) => e.id === "gone");
    assert.equal(gone?.archived, true);
    assert.equal(gone?.day, "push");
    assert.equal(
      row(computeStats({ ...base, period: "all" }), "gone")?.best?.maxKg,
      40,
    );
  });

  it("reads only saved history, so an empty history gives an empty result", () => {
    const stats = computeStats({ ...base, history: [], period: 30 });
    assert.equal(stats.hasHistory, false);
    assert.equal(row(stats, "bench")?.best, null);
  });

  it("uses today, not the last session, as the reference (H2)", () => {
    const stale = computeStats({
      ...base,
      history: newestFirst(session(at(2026, 6, 10), [["60", "5"]])),
      period: 30,
    });
    assert.equal(stale.weekStreak, 0);
    assert.equal(row(stale, "bench")?.best, null);
  });

  it("handles a single session", () => {
    const one = computeStats({
      ...base,
      history: [session(at(2026, 9, 17), [["60", "5"]])],
      period: 30,
    });
    assert.equal(one.weekStreak, 1);
    assert.equal(row(one, "bench")?.change, null);
  });
});

describe("format helpers", () => {
  it("pluralizes", () => {
    assert.equal(plural(1, "day"), "1 day");
    assert.equal(plural(2, "day"), "2 days");
    assert.equal(plural(0, "week"), "0 weeks");
  });
});

describe("performance", () => {
  it("computes stats for 500 sessions and 40 exercises quickly", () => {
    const plan: Plan = {
      push: Array.from({ length: 40 }, (_, i) => ({
        id: `e${i}`,
        name: `E${i}`,
        sets: 3,
        reps: "5",
      })),
      pull: [],
      legs: [],
    };
    const history = newestFirst(
      ...Array.from({ length: 500 }, (_, i) =>
        session(NOW - i * 36 * 3600 * 1000, [["60", "5"]], {
          id: `e${i % 40}`,
        }),
      ),
    );
    const start = performance.now();
    computeStats({
      plan,
      history,
      period: "all",
      dayFilter: "all",
      query: "",
      now: NOW,
    });
    assert.ok(performance.now() - start < 250);
  });
});
