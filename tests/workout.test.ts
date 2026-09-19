import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptySet } from "../lib/normalize.ts";
import {
  firstPendingExerciseId,
  stepSetKg,
  suggestSet,
  toggleSetDone,
} from "../lib/workout.ts";
import type { ExerciseState, WorkoutSet } from "../types/index.ts";

const set = (kg: string, reps: string, done = false): WorkoutSet => ({
  kg,
  reps,
  note: "",
  done,
});
const state = (
  sets: WorkoutSet[],
  status: ExerciseState["status"] = "pending",
): ExerciseState => ({ status, sets, notes: "" });

describe("suggestSet", () => {
  const last = [set("80", "8"), set("80", "7"), set("77.5", "6")];
  it("uses the same set from last time for the first set", () => {
    assert.deepEqual(suggestSet(0, [], last), { kg: "80", reps: "8" });
  });
  it("prefers today's previous set once there is one", () => {
    assert.deepEqual(suggestSet(1, [set("82.5", "8")], last), {
      kg: "82.5",
      reps: "8",
    });
  });
  it("falls back to last time's same set, then its last logged set, then nothing", () => {
    assert.deepEqual(suggestSet(2, [emptySet(), emptySet()], last), {
      kg: "77.5",
      reps: "6",
    });
    assert.deepEqual(suggestSet(5, [], last), { kg: "77.5", reps: "6" });
    assert.equal(suggestSet(0, [], undefined), null);
    assert.equal(suggestSet(0, [], [set("", "")]), null);
  });
});

describe("toggleSetDone", () => {
  it("fills empty fields from the suggestion and marks the set done", () => {
    const r = toggleSetDone(state([]), 0, 3, { kg: "80", reps: "8" });
    assert.equal(r.outcome, "done");
    assert.deepEqual(r.state.sets[0], set("80", "8", true));
    assert.equal(r.state.status, "pending");
  });
  it("keeps what the user typed and fills only the missing field", () => {
    const r = toggleSetDone(state([set("85", "")]), 0, 3, {
      kg: "80",
      reps: "8",
    });
    assert.deepEqual(r.state.sets[0], set("85", "8", true));
  });
  it("asks for input instead of inventing values", () => {
    const s = state([]);
    const r = toggleSetDone(s, 0, 3, null);
    assert.equal(r.outcome, "needs-input");
    assert.equal(r.state, s);
    assert.equal(
      toggleSetDone(state([set("50", "")]), 0, 3, null).outcome,
      "needs-input",
    );
  });
  it("creates no holes when checking a later set first", () => {
    const r = toggleSetDone(state([]), 2, 3, { kg: "50", reps: "5" });
    assert.equal(r.state.sets.length, 3);
    assert.ok(r.state.sets.every((x) => x && typeof x.kg === "string"));
    assert.equal(r.state.sets[2].done, true);
    assert.equal(r.state.sets[0].done, false);
  });
  it("marks the exercise done after the last planned set, and reopens it on undo", () => {
    let s = state([set("80", "8", true), set("80", "8", true)]);
    const finished = toggleSetDone(s, 2, 3, { kg: "80", reps: "8" });
    assert.equal(finished.state.status, "done");
    s = finished.state;
    const undone = toggleSetDone(s, 2, 3, null);
    assert.equal(undone.outcome, "undone");
    assert.equal(undone.state.status, "pending");
    assert.equal(undone.state.sets[2].done, false);
    assert.equal(undone.state.sets[2].kg, "80");
  });
  it("does not override a deliberate 'skipped'", () => {
    const r = toggleSetDone(
      state([set("1", "1", true), set("1", "1", true)], "skipped"),
      2,
      3,
      { kg: "1", reps: "1" },
    );
    assert.equal(r.state.status, "skipped");
  });
  it("ignores impossible indexes", () => {
    assert.equal(
      toggleSetDone(state([]), -1, 3, { kg: "1", reps: "1" }).outcome,
      "needs-input",
    );
    assert.equal(
      toggleSetDone(state([]), 99, 3, { kg: "1", reps: "1" }).outcome,
      "needs-input",
    );
  });
  it("does not mutate its input", () => {
    const s = state([set("80", "8")]);
    const snapshot = JSON.stringify(s);
    toggleSetDone(s, 0, 3, null);
    assert.equal(JSON.stringify(s), snapshot);
  });
});

describe("stepSetKg", () => {
  it("adds and subtracts from the current value without float noise", () => {
    assert.equal(
      stepSetKg(state([set("80", "8")]), 0, 2.5, null).sets[0].kg,
      "82.5",
    );
    assert.equal(
      stepSetKg(state([set("82.5", "8")]), 0, -2.5, null).sets[0].kg,
      "80",
    );
    assert.equal(
      stepSetKg(state([set("0.1", "8")]), 0, 0.2, null).sets[0].kg,
      "0.3",
    );
  });
  it("starts from the suggestion when the field is empty", () => {
    assert.equal(
      stepSetKg(state([]), 1, 2.5, { kg: "80", reps: "8" }).sets[1].kg,
      "82.5",
    );
  });
  it("never goes below zero and clears the field at zero", () => {
    assert.equal(stepSetKg(state([set("2", "8")]), 0, -5, null).sets[0].kg, "");
    assert.equal(stepSetKg(state([]), 0, -2.5, null).sets[0].kg, "");
  });
  it("stops at the maximum weight and reopens a checked set", () => {
    const capped = stepSetKg(state([set("5000", "1")]), 0, 5, null);
    assert.equal(capped.sets[0].kg, "5000");
    assert.equal(
      stepSetKg(state([set("80", "8", true)]), 0, 2.5, null).sets[0].done,
      false,
    );
  });
});

describe("firstPendingExerciseId", () => {
  const exercises = [{ id: "a" }, { id: "b" }, { id: "c" }];
  it("finds the first exercise that is not done or skipped", () => {
    const states = { a: state([], "done"), b: state([], "skipped") };
    assert.equal(firstPendingExerciseId(exercises, states), "c");
    assert.equal(firstPendingExerciseId(exercises, {}), "a");
  });
  it("is null when everything is handled", () => {
    const done = state([], "done");
    assert.equal(
      firstPendingExerciseId(exercises, { a: done, b: done, c: done }),
      null,
    );
    assert.equal(firstPendingExerciseId([], {}), null);
  });
});
