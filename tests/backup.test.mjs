import test from "node:test";
import assert from "node:assert/strict";
import { readBackup, writeBackup } from "../backup.mjs";
import { samplePlan } from "../model.mjs";

const state = { events: samplePlan("2026-10-19"), selectedDate: "2026-10-19", view: "week", filters: ["work", "family"] };

test("backup round trip keeps every block and the view settings", () => {
  const text = writeBackup(state);
  const restored = readBackup(text);
  assert.equal(restored.events.length, state.events.length);
  assert.deepEqual(restored.events[0], state.events[0]);
  assert.equal(restored.view, "week");
  assert.deepEqual(restored.filters, ["work", "family"]);
});

test("export drops duplicate filters instead of failing", () => {
  const restored = readBackup(writeBackup({ ...state, filters: ["work", "work"] }));
  assert.deepEqual(restored.filters, ["work"]);
});

test("restore rejects damaged, foreign and duplicate data", () => {
  const good = JSON.parse(writeBackup(state));
  assert.throws(() => readBackup("{"), /not valid JSON/);
  assert.throws(() => readBackup(JSON.stringify({ ...good, kind: "other" })), /not a Daybreak backup/);
  assert.throws(() => readBackup(JSON.stringify({ ...good, events: [...good.events, good.events[0]] })), /duplicate/);
  assert.throws(() => readBackup(JSON.stringify({ ...good, events: [{ ...good.events[0], start: "25:00" }] })), /invalid or duplicate/);
  assert.throws(() => readBackup(JSON.stringify({ ...good, filters: ["work", "work"] })), /filters/);
  assert.throws(() => readBackup("x".repeat(2 * 1024 * 1024 + 1)), /smaller than 2 MB/);
});
