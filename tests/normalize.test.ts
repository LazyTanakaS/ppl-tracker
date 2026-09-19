import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampSets,
  normalizeExercise,
  normalizeExerciseState,
  normalizeHistory,
  normalizePlan,
  normalizeSchedule,
  normalizeWorkout,
  parseBackup,
} from "../lib/normalize.ts";
import type { Plan } from "../types/index.ts";

const DEFAULT: Plan = {
  push: [{ id: "a", name: "A", sets: 3, reps: "8-12" }],
  pull: [{ id: "b", name: "B", sets: 3, reps: "8-12" }],
  legs: [{ id: "c", name: "C", sets: 3, reps: "8-12" }],
};

describe("normalizeExerciseState", () => {
  it("turns holes and nulls in sets into empty sets (C1)", () => {
    const state = normalizeExerciseState(
      JSON.parse('{"status":"done","sets":[null,{"kg":"80","reps":"6"}]}'),
    );
    assert.deepEqual(state.sets, [
      { kg: "", reps: "", note: "", done: false },
      { kg: "80", reps: "6", note: "", done: false },
    ]);
    assert.equal(
      normalizeExerciseState({ sets: [, { kg: "5", reps: "5" }] }).sets.length,
      2,
    );
  });

  it("repairs bad values instead of throwing", () => {
    const state = normalizeExerciseState({
      status: "weird",
      sets: [
        { kg: "Infinity", reps: "1e999", note: 5 },
        { kg: -10, reps: -3 },
        { kg: "50,5", reps: "8.7" },
        { kg: "50kg", reps: "abc" },
      ],
      notes: { x: 1 },
    });
    assert.equal(state.status, "pending");
    assert.equal(state.notes, "");
    assert.deepEqual(state.sets[0], {
      kg: "",
      reps: "",
      note: "5",
      done: false,
    });
    assert.deepEqual(state.sets[1], {
      kg: "",
      reps: "",
      note: "",
      done: false,
    });
    assert.deepEqual(state.sets[2], {
      kg: "50.5",
      reps: "8",
      note: "",
      done: false,
    });
    assert.deepEqual(state.sets[3], {
      kg: "50",
      reps: "",
      note: "",
      done: false,
    });
  });

  it("handles non-objects", () => {
    for (const raw of [null, undefined, 5, "x", [], true]) {
      assert.deepEqual(normalizeExerciseState(raw), {
        status: "pending",
        sets: [],
        notes: "",
      });
    }
  });
});

describe("normalizeWorkout", () => {
  it("always returns the three days", () => {
    for (const raw of [null, {}, [], "x", { push: 5 }]) {
      const workout = normalizeWorkout(raw);
      assert.deepEqual(Object.keys(workout).sort(), ["legs", "pull", "push"]);
      assert.deepEqual(workout.push, {});
    }
  });

  it("does not let a __proto__ key pollute anything", () => {
    const raw = JSON.parse('{"push":{"__proto__":{"status":"done"},"ok":{}}}');
    const workout = normalizeWorkout(raw);
    assert.equal(({} as Record<string, unknown>).status, undefined);
    assert.equal(Object.getPrototypeOf(workout.push), Object.prototype);
    assert.ok(Object.hasOwn(workout.push, "ok"));
  });
});

describe("normalizePlan", () => {
  it("falls back per missing day but keeps an intentionally empty day", () => {
    const plan = normalizePlan({ push: [], pull: 5 }, DEFAULT);
    assert.deepEqual(plan.push, []);
    assert.deepEqual(plan.pull, DEFAULT.pull);
    assert.deepEqual(plan.legs, DEFAULT.legs);
  });

  it("falls back completely for junk input", () => {
    for (const raw of [null, 5, "x", [], undefined]) {
      assert.deepEqual(normalizePlan(raw, DEFAULT), DEFAULT);
    }
  });

  it("drops invalid and duplicate exercises and clamps sets", () => {
    const plan = normalizePlan(
      {
        push: [
          { id: "1", name: "  Squat ", sets: 0, reps: "5" },
          { id: "1", name: "dup", sets: 3, reps: "5" },
          { id: "2", name: "", sets: 3, reps: "5" },
          null,
          { id: "3", name: "Huge", sets: 1e9, reps: 7 },
        ],
      },
      DEFAULT,
    );
    assert.deepEqual(plan.push, [
      { id: "1", name: "Squat", sets: 1, reps: "5" },
      { id: "3", name: "Huge", sets: 20, reps: "7" },
    ]);
  });
});

describe("clampSets / normalizeExercise", () => {
  it("clamps to 1..20 and defaults to 3", () => {
    assert.equal(clampSets(0), 1);
    assert.equal(clampSets(-4), 1);
    assert.equal(clampSets("7"), 7);
    assert.equal(clampSets(99), 20);
    assert.equal(clampSets("abc"), 3);
    assert.equal(clampSets(2.9), 2);
  });
  it("requires id and name", () => {
    assert.equal(normalizeExercise({ name: "x" }), null);
    assert.equal(normalizeExercise({ id: "x", name: "   " }), null);
  });
});

describe("normalizeHistory", () => {
  const good = {
    date: "2026-09-10T10:00:00.000Z",
    day: "push",
    exercises: [],
    workout: {},
  };

  it("survives every malformed shape from the audit", () => {
    for (const raw of [
      null,
      {},
      "x",
      5,
      [null],
      [5],
      [{}],
      [{ date: "garbage", day: "push" }],
    ]) {
      const { history } = normalizeHistory(raw);
      assert.ok(Array.isArray(history));
      assert.equal(history.length, 0);
    }
  });

  it("repairs missing workout/exercises rather than dropping the session", () => {
    const { history, dropped } = normalizeHistory([
      { date: good.date, day: "pull" },
    ]);
    assert.equal(dropped, 0);
    assert.deepEqual(history[0], {
      date: good.date,
      day: "pull",
      exercises: [],
      workout: {},
    });
  });

  it("counts dropped entries and sorts newest first", () => {
    const older = { ...good, date: "2026-09-01T10:00:00.000Z" };
    const { history, dropped } = normalizeHistory([
      older,
      { day: "cardio", date: good.date },
      good,
    ]);
    assert.equal(dropped, 1);
    assert.deepEqual(
      history.map((s) => s.date),
      [good.date, older.date],
    );
  });

  it("accepts numeric timestamps", () => {
    const { history } = normalizeHistory([
      { ...good, date: Date.UTC(2026, 8, 10) },
    ]);
    assert.equal(history[0].date, "2026-09-10T00:00:00.000Z");
  });
});

describe("normalizeSchedule", () => {
  it("keeps only weekdays 0-6 with a valid day type", () => {
    assert.deepEqual(
      normalizeSchedule({ 1: "push", 2: "hack", 9: "legs", 0: "pull" }),
      {
        0: "pull",
        1: "push",
      },
    );
    for (const raw of [null, [], "x", 5])
      assert.deepEqual(normalizeSchedule(raw), {});
  });
});

describe("parseBackup", () => {
  const reason = (text: string) => {
    const result = parseBackup(text, DEFAULT);
    assert.equal(result.ok, false, text);
    return result.ok ? "" : result.reason;
  };

  it("rejects files that would have bricked the app before (C2)", () => {
    reason("{oops");
    reason("[]");
    reason("5");
    reason("null");
    reason('{"plan":5}');
    reason('{"plan":{"push":"x"}}');
    reason('{"history":{"a":1}}');
    reason('{"workout":[]}');
    reason('{"schedule":"x"}');
    reason('{"version":99,"plan":{"push":[]}}');
    reason('{"unrelated":true}');
  });

  it("normalizes a valid backup and reports dropped sessions", () => {
    const text = JSON.stringify({
      version: 1,
      plan: { push: [{ id: "x", name: "X", sets: 3, reps: "5" }] },
      history: [{ date: "nope", day: "push" }],
      schedule: { 1: "push" },
    });
    const result = parseBackup(text, DEFAULT);
    assert.ok(result.ok);
    if (!result.ok) return;
    assert.equal(result.data.plan?.push[0].id, "x");
    assert.deepEqual(result.data.plan?.pull, DEFAULT.pull);
    assert.equal(result.data.dropped, 1);
    assert.deepEqual(result.data.history, []);
    assert.equal(result.data.workout, undefined);
  });

  it("accepts a backup without a version (older exports)", () => {
    assert.ok(parseBackup('{"history":[]}', DEFAULT).ok);
  });
});
