import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, parseDateKey, shiftDate, weekDates, validateEvent, overlappingEvents, eventsForDate, dailySummary, safeStoredEvents, findFocusSlot, minutesToTime } from "../model.mjs";

const event = { id: "a", date: "2026-09-24", title: "Design review", start: "09:30", duration: 60, calendar: "work", protected: true };

test("date helpers handle month boundary and Monday week start", () => {
  assert.equal(dateKey(new Date(2026, 8, 30)), "2026-09-30");
  assert.equal(shiftDate("2026-09-30", 1), "2026-10-01");
  assert.deepEqual(weekDates("2026-10-01"), ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
  assert.equal(parseDateKey("2026-02-30"), null);
});

test("event validation prevents empty titles, invalid calendars and midnight overflow", () => {
  assert.equal(validateEvent(event).ok, true);
  assert.equal(validateEvent({ ...event, title: " " }).ok, false);
  assert.equal(validateEvent({ ...event, calendar: "unknown" }).ok, false);
  assert.equal(validateEvent({ ...event, start: "23:30", duration: 60 }).ok, false);
});

test("overlap warnings only compare same date and ignore the edited event", () => {
  const peers = [event, { ...event, id: "b", start: "10:15" }, { ...event, id: "c", date: "2026-09-25" }, { ...event, id: "d", start: "10:30" }];
  assert.deepEqual(overlappingEvents(event, peers).map(item => item.id), ["b"]);
});

test("daily selectors are date-aware and metrics derive from actual blocks", () => {
  const data = [event, { ...event, id: "b", calendar: "family", protected: false }, { ...event, id: "c", date: "2026-09-25" }];
  assert.deepEqual(eventsForDate(data, "2026-09-24", ["work"]).map(item => item.id), ["a"]);
  assert.deepEqual(dailySummary(data, "2026-09-24"), { blocks: 2, plannedMinutes: 120, protectedMinutes: 60 });
});

test("storage recovery drops invalid and duplicate records", () => {
  assert.deepEqual(safeStoredEvents([event, { ...event, title: "Other" }, { ...event, id: "b", date: "bad" }, { ...event, id: "c" }]).map(item => item.id), ["a", "c"]);
});

test("focus search finds the earliest gap and includes hidden calendars", () => {
  const data = [event, { ...event, id: "b", start: "11:00", duration: 45, calendar: "family" }];
  assert.equal(minutesToTime(findFocusSlot(data, event.date, 30, { windowStart: 10 * 60, windowEnd: 12 * 60 })), "10:30");
  assert.equal(findFocusSlot(data, event.date, 60, { windowStart: 10 * 60, windowEnd: 11 * 60 }), null);
  assert.equal(findFocusSlot([], event.date, 25, { windowStart: 9 * 60, windowEnd: 10 * 60, notBefore: 9 * 60 + 8 }), 9 * 60 + 15);
});
