import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextDayAfter, pickInitialView } from "../lib/schedule.ts";
import { at, newestFirst, session } from "./helpers.ts";

describe("pickInitialView", () => {
  it("uses the scheduled day", () => {
    assert.deepEqual(pickInitialView({ 3: "legs" }, [], 3), { section: "workout", day: "legs" });
  });
  it("opens history on a scheduled rest day", () => {
    assert.equal(pickInitialView({ 3: "legs" }, [], 4).section, "history");
  });
  it("starts a new user on push instead of an empty history", () => {
    assert.deepEqual(pickInitialView({}, [], 2), { section: "workout", day: "push" });
  });
  it("continues the rotation without a schedule", () => {
    const history = newestFirst(session(at(2026, 9, 10), [], { day: "pull" }));
    assert.deepEqual(pickInitialView({}, history, 2), { section: "workout", day: "legs" });
    assert.equal(nextDayAfter("legs"), "push");
  });
});
