import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSession,
  getExerciseState,
  hasSessionData,
  lastPerformance,
  sanitizeSetValue,
} from "../lib/session.ts";
import type { Exercise, ExerciseState } from "../types/index.ts";
import { at, newestFirst, session } from "./helpers.ts";

describe("sanitizeSetValue", () => {
  it("accepts numbers and normalizes the decimal comma", () => {
    assert.equal(sanitizeSetValue("kg", "82.5"), "82.5");
    assert.equal(sanitizeSetValue("kg", "82,5"), "82.5");
    assert.equal(sanitizeSetValue("kg", ""), "");
    assert.equal(sanitizeSetValue("kg", "80."), "80.");
    assert.equal(sanitizeSetValue("reps", "12"), "12");
  });
  it("rejects negatives, exponents, letters and absurd values", () => {
    for (const value of [
      "-5",
      "1e5",
      "abc",
      "1.234",
      "99999",
      "5001",
      "Infinity",
    ]) {
      assert.equal(sanitizeSetValue("kg", value), null, value);
    }
    for (const value of ["-1", "8.5", "1e3", "1001", "12345"]) {
      assert.equal(sanitizeSetValue("reps", value), null, value);
    }
  });
  it("truncates notes", () => {
    assert.equal(sanitizeSetValue("note", "x".repeat(500))?.length, 200);
  });
});

describe("getExerciseState", () => {
  it("ignores prototype keys", () => {
    assert.equal(getExerciseState({}, "constructor"), undefined);
    assert.equal(getExerciseState({}, "__proto__"), undefined);
    assert.equal(getExerciseState(undefined, "x"), undefined);
  });
});

describe("buildSession", () => {
  const exercises: Exercise[] = [{ id: "a", name: "A", sets: 2, reps: "5" }];
  const stale: ExerciseState = {
    status: "done",
    notes: "n",
    sets: [
      { kg: "50", reps: "5", note: "", done: false },
      { kg: "", reps: "", note: "", done: false },
      { kg: "99", reps: "9", note: "", done: false },
    ],
  };

  it("keeps only planned exercises with exactly the planned number of sets", () => {
    const built = buildSession(
      "push",
      exercises,
      { a: stale, removed: stale },
      new Date(2026, 8, 18, 10),
    );
    assert.deepEqual(Object.keys(built.workout), ["a"]);
    assert.equal(built.workout.a.sets.length, 2);
    assert.equal(built.date, new Date(2026, 8, 18, 10).toISOString());
  });

  it("pads missing sets and does not share references with live state", () => {
    const built = buildSession("push", exercises, {});
    assert.deepEqual(built.workout.a.sets, [
      { kg: "", reps: "", note: "", done: false },
      { kg: "", reps: "", note: "", done: false },
    ]);
    const live = { a: stale };
    const copy = buildSession("push", exercises, live);
    copy.workout.a.sets[0].kg = "1";
    copy.exercises[0].name = "changed";
    assert.equal(stale.sets[0].kg, "50");
    assert.equal(exercises[0].name, "A");
  });
});

describe("hasSessionData", () => {
  const empty = () =>
    buildSession("push", [{ id: "a", name: "A", sets: 2, reps: "5" }], {});
  it("is false for an untouched workout", () =>
    assert.equal(hasSessionData(empty()), false));
  it("is true for a set value, a note or a status", () => {
    const withSet = empty();
    withSet.workout.a.sets[1].reps = "5";
    assert.equal(hasSessionData(withSet), true);
    const withNote = empty();
    withNote.workout.a.notes = "felt heavy";
    assert.equal(hasSessionData(withNote), true);
    const withStatus = empty();
    withStatus.workout.a.status = "skipped";
    assert.equal(hasSessionData(withStatus), true);
  });
});

describe("lastPerformance", () => {
  it("returns the most recent session that logged each exercise", () => {
    const history = newestFirst(
      session(at(2026, 9, 10), [["100", "5"]]),
      session(at(2026, 9, 3), [["90", "5"]]),
      session(at(2026, 9, 12), [["", ""]]),
    );
    assert.equal(lastPerformance(history).get("bench")?.[0].kg, "100");
    assert.equal(lastPerformance([]).size, 0);
  });
});
