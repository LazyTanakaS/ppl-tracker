import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  shouldRemindBackup,
  unitStep,
} from "../lib/settings.ts";
import {
  MAX_SNAPSHOTS,
  shouldSnapshot,
  snapshotsToDelete,
} from "../lib/snapshots.ts";
import { SCHEDULE_PRESETS, TEMPLATES } from "../data/templates.ts";
import { normalizePlan } from "../lib/normalize.ts";
import { PLAN } from "../data/plan.ts";
import { at, newestFirst, session } from "./helpers.ts";

const NOW = at(2026, 9, 18, 12);
const many = (n: number, startDay = 1) =>
  newestFirst(
    ...Array.from({ length: n }, (_, i) =>
      session(NOW - (i + startDay) * 86_400_000, []),
    ),
  );

describe("normalizeSettings", () => {
  it("returns defaults for junk and never throws", () => {
    for (const raw of [
      null,
      undefined,
      5,
      "x",
      [],
      { unit: 3, theme: {}, restSeconds: "x" },
    ]) {
      const s = normalizeSettings(raw, false);
      assert.equal(s.unit, "kg");
      assert.equal(s.theme, "system");
      assert.equal(s.restSeconds, DEFAULT_SETTINGS.restSeconds);
      assert.equal(s.onboarded, false);
    }
  });
  it("skips onboarding for people who already have data", () => {
    assert.equal(normalizeSettings(null, true).onboarded, true);
    assert.equal(
      normalizeSettings({ onboarded: false }, true).onboarded,
      false,
    );
  });
  it("accepts valid values and rejects arbitrary rest durations and bad dates", () => {
    const s = normalizeSettings(
      {
        unit: "lb",
        theme: "dark",
        restSeconds: 90,
        autoRest: false,
        lastExportAt: "nope",
      },
      false,
    );
    assert.deepEqual(
      [s.unit, s.theme, s.restSeconds, s.autoRest, s.lastExportAt],
      ["lb", "dark", 90, false, null],
    );
    assert.equal(
      normalizeSettings({ restSeconds: 7 }, false).restSeconds,
      DEFAULT_SETTINGS.restSeconds,
    );
  });
  it("steps by plate size", () => {
    assert.equal(unitStep("kg"), 2.5);
    assert.equal(unitStep("lb"), 5);
  });
});

describe("shouldRemindBackup", () => {
  const s = { ...DEFAULT_SETTINGS, onboarded: true };
  it("stays quiet until there is something worth saving", () => {
    assert.equal(shouldRemindBackup(s, many(4), NOW), false);
    assert.equal(shouldRemindBackup(s, [], NOW), false);
  });
  it("asks once there are 5+ sessions and no export yet", () => {
    assert.equal(shouldRemindBackup(s, many(5), NOW), true);
  });
  it("respects a snooze", () => {
    const snoozed = {
      ...s,
      backupSnoozedUntil: new Date(NOW + 86_400_000).toISOString(),
    };
    assert.equal(shouldRemindBackup(snoozed, many(20), NOW), false);
    assert.equal(
      shouldRemindBackup(
        { ...s, backupSnoozedUntil: new Date(NOW - 1000).toISOString() },
        many(20),
        NOW,
      ),
      true,
    );
  });
  it("after an export, waits for 10 new sessions or 3 sessions in a month", () => {
    const exported = {
      ...s,
      lastExportAt: new Date(NOW - 5 * 86_400_000).toISOString(),
    };
    assert.equal(shouldRemindBackup(exported, many(8), NOW), false);
    assert.equal(
      shouldRemindBackup(
        { ...s, lastExportAt: new Date(NOW - 20 * 86_400_000).toISOString() },
        many(30, 1),
        NOW,
      ),
      true,
    );
    assert.equal(
      shouldRemindBackup(
        { ...s, lastExportAt: new Date(NOW - 40 * 86_400_000).toISOString() },
        many(6, 1),
        NOW,
      ),
      true,
    );
    assert.equal(
      shouldRemindBackup(
        { ...s, lastExportAt: new Date(NOW - 40 * 86_400_000).toISOString() },
        [...many(2, 1), ...many(4, 50)],
        NOW,
      ),
      false,
    );
  });
});

describe("snapshot policy", () => {
  it("takes at most one snapshot per local day", () => {
    assert.equal(shouldSnapshot(null, NOW), true);
    assert.equal(
      shouldSnapshot(new Date(at(2026, 9, 18, 1)).toISOString(), NOW),
      false,
    );
    assert.equal(
      shouldSnapshot(new Date(at(2026, 9, 17, 23, 59)).toISOString(), NOW),
      true,
    );
  });
  it("keeps only the newest N", () => {
    const ids = Array.from({ length: MAX_SNAPSHOTS + 3 }, (_, i) => i + 1);
    assert.deepEqual(
      snapshotsToDelete(ids).sort((a, b) => a - b),
      [1, 2, 3],
    );
    assert.deepEqual(snapshotsToDelete([1, 2]), []);
  });
});

describe("templates", () => {
  it("every template survives normalization unchanged and has unique exercise ids", () => {
    for (const template of TEMPLATES) {
      assert.deepEqual(
        normalizePlan(template.plan, PLAN),
        template.plan,
        template.id,
      );
      const ids = Object.values(template.plan)
        .flat()
        .map((e) => e.id);
      assert.equal(new Set(ids).size, ids.length, template.id);
    }
    assert.ok(
      TEMPLATES.some((t) => Object.values(t.plan).every((d) => d.length === 0)),
    );
  });
  it("schedule presets only use valid weekdays", () => {
    for (const preset of SCHEDULE_PRESETS) {
      for (const day of Object.keys(preset.schedule))
        assert.ok(Number(day) >= 0 && Number(day) <= 6);
    }
  });
});
