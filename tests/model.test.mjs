import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, parseDateKey, shiftDate, weekDates, validateEvent, overlappingEvents, eventsForDate, dailySummary, safeStoredEvents, findFocusSlot, minutesToTime, formatMinutes, formatClock, freeGaps, busyIntervals, recoverStoredPlan, samplePlan, newId } from "../model.mjs";

const event = { id: "a", date: "2026-09-24", title: "Design review", start: "09:30", duration: 60, calendar: "work", protected: true };

test("date helpers handle month boundary and Monday week start", () => {
  assert.equal(dateKey(new Date(2026, 8, 30)), "2026-09-30");
  assert.equal(shiftDate("2026-09-30", 1), "2026-10-01");
  assert.deepEqual(weekDates("2026-10-01"), ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
  assert.equal(parseDateKey("2026-02-30"), null);
});

test("date helpers roll over years, leap days and early years in any time zone", () => {
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDate("2027-01-01", -1), "2026-12-31");
  assert.deepEqual(weekDates("2027-01-01"), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
  assert.equal(shiftDate("2028-02-28", 1), "2028-02-29");
  assert.equal(parseDateKey("2027-02-29"), null);
  assert.equal(shiftDate("0099-12-31", 1), "0100-01-01");
  assert.equal(shiftDate("2026-10-19", -7), "2026-10-12");
  for (let day = 0; day < 400; day++) assert.equal(weekDates(shiftDate("2026-01-01", day)).length, 7);
});

test("event validation prevents empty titles, invalid calendars and blocks past midnight", () => {
  assert.equal(validateEvent(event).ok, true);
  assert.equal(validateEvent({ ...event, title: " " }).ok, false);
  assert.equal(validateEvent({ ...event, calendar: "unknown" }).ok, false);
  assert.equal(validateEvent({ ...event, start: "23:30", duration: 60 }).ok, false);
});

test("a block may end exactly at midnight", () => {
  assert.equal(validateEvent({ ...event, start: "22:00", duration: 120 }).ok, true);
  assert.equal(validateEvent({ ...event, start: "23:45", duration: 15 }).ok, true);
  assert.equal(validateEvent({ ...event, start: "23:00", duration: 120 }).errors.duration, "End the block by midnight.");
  assert.equal(formatMinutes(1440), "12:00 AM");
  assert.equal(formatMinutes(0), "12:00 AM");
  assert.equal(formatMinutes(720), "12:00 PM");
  assert.equal(formatClock("13:05"), "1:05 PM");
  assert.throws(() => formatMinutes(1441));
});

test("overlap warnings only compare same date and ignore the edited event", () => {
  const peers = [event, { ...event, id: "b", start: "10:15" }, { ...event, id: "c", date: "2026-09-25" }, { ...event, id: "d", start: "10:30" }];
  assert.deepEqual(overlappingEvents(event, peers).map(item => item.id), ["b"]);
  const lateNight = { ...event, id: "e", start: "23:00", duration: 60 };
  assert.deepEqual(overlappingEvents({ ...event, id: "f", start: "23:30", duration: 30 }, [lateNight]).map(item => item.id), ["e"]);
});

test("daily selectors are date-aware and metrics derive from actual blocks", () => {
  const data = [event, { ...event, id: "b", calendar: "family", protected: false }, { ...event, id: "c", date: "2026-09-25" }];
  assert.deepEqual(eventsForDate(data, "2026-09-24", ["work"]).map(item => item.id), ["a"]);
  assert.deepEqual(dailySummary(data, "2026-09-24"), { blocks: 2, plannedMinutes: 120, protectedMinutes: 60 });
});

test("storage recovery drops invalid and duplicate records", () => {
  assert.deepEqual(safeStoredEvents([event, { ...event, title: "Other" }, { ...event, id: "b", date: "bad" }, { ...event, id: "c" }]).map(item => item.id), ["a", "c"]);
});

test("a stored plan with one damaged block keeps the good blocks", () => {
  const stored = { schemaVersion: 1, revision: 4, selectedDate: "2026-09-24", view: "week", filters: ["work", "work", "bogus"], events: [event, { id: "bad", date: "nope" }, { ...event, id: "c", start: "13:00" }] };
  const result = recoverStoredPlan(JSON.stringify(stored));
  assert.equal(result.status, "partial");
  assert.equal(result.dropped, 1);
  assert.deepEqual(result.plan.events.map(item => item.id), ["a", "c"]);
  assert.deepEqual(result.plan.filters, ["work"]);
  assert.equal(result.plan.view, "week");
  assert.equal(recoverStoredPlan("{not json").status, "unreadable");
  assert.equal(recoverStoredPlan(JSON.stringify({ schemaVersion: 2, events: [] })).status, "unreadable");
  assert.equal(recoverStoredPlan(JSON.stringify({ ...stored, events: [event] })).status, "ok");
  assert.equal(recoverStoredPlan(JSON.stringify({ ...stored, selectedDate: "2026-13-01" })).plan.selectedDate, null);
});

test("focus search finds the earliest gap and includes hidden calendars", () => {
  const data = [event, { ...event, id: "b", start: "11:00", duration: 45, calendar: "family" }];
  assert.equal(minutesToTime(findFocusSlot(data, event.date, 30, { windowStart: 10 * 60, windowEnd: 12 * 60 })), "10:30");
  assert.equal(findFocusSlot(data, event.date, 60, { windowStart: 10 * 60, windowEnd: 11 * 60 }), null);
  assert.equal(findFocusSlot([], event.date, 25, { windowStart: 9 * 60, windowEnd: 10 * 60, notBefore: 9 * 60 + 8 }), 9 * 60 + 15);
});

test("open gaps merge overlapping blocks and respect the day window", () => {
  const data = [event, { ...event, id: "b", start: "10:00", duration: 60 }, { ...event, id: "c", start: "13:00", duration: 30, calendar: "family" }];
  assert.deepEqual(busyIntervals(data, event.date), [{ start: 570, end: 660 }, { start: 780, end: 810 }]);
  assert.deepEqual(freeGaps(data, event.date, { windowStart: 480, windowEnd: 1080 }), [{ start: 480, end: 570, minutes: 90 }, { start: 660, end: 780, minutes: 120 }, { start: 810, end: 1080, minutes: 270 }]);
  assert.deepEqual(freeGaps(data, event.date, { windowStart: 600, windowEnd: 780, minLength: 150 }), []);
  assert.deepEqual(freeGaps([], event.date, { windowStart: 480, windowEnd: 600 }), [{ start: 480, end: 600, minutes: 120 }]);
});

test("sample week is valid, spans the anchor week and shows one deliberate overlap", () => {
  for (const anchor of ["2026-10-19", "2026-10-25", "2026-12-30"]) {
    const plan = samplePlan(anchor);
    assert.equal(safeStoredEvents(plan).length, plan.length);
    const week = weekDates(anchor);
    assert.ok(week.every(day => plan.some(item => item.date === day)));
    const overlaps = plan.filter(item => overlappingEvents(item, plan).length);
    assert.deepEqual(overlaps.map(item => item.title), ["Pick up Theo from swim class", "Call with the print shop"]);
    assert.equal(overlaps[0].date, week[0]);
  }
});

test("new IDs work without crypto.randomUUID", () => {
  const original = globalThis.crypto;
  Object.defineProperty(globalThis, "crypto", { value: {}, configurable: true });
  try {
    const a = newId(); const b = newId();
    assert.match(a, /^id-/);
    assert.notEqual(a, b);
  } finally {
    Object.defineProperty(globalThis, "crypto", { value: original, configurable: true });
  }
  assert.match(newId(), /^[0-9a-f-]{36}$/);
});
