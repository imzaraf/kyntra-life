import { describe, expect, it } from "vitest";
import type { Reminder } from "@/types/domain";
import { filterReminders, presetTime, reminderState, snoozeTime } from "./reminder-logic";

const NOW = new Date(2026, 2, 10, 10, 0, 0);
const r = (id: string, scheduledAt: Date, status: Reminder["status"] = "pending") =>
  ({ id, scheduledAt, status }) as Reminder;

describe("reminderState", () => {
  it("derives state from time and status", () => {
    expect(reminderState(r("a", new Date(2026, 2, 10, 11)), NOW)).toBe("upcoming");
    expect(reminderState(r("b", new Date(2026, 2, 10, 9, 45)), NOW)).toBe("due");
    expect(reminderState(r("c", new Date(2026, 2, 10, 8)), NOW)).toBe("past_due");
    expect(reminderState(r("d", new Date(2026, 2, 9), "completed"), NOW)).toBe(
      "completed",
    );
  });
});

describe("filterReminders", () => {
  it("separates views and sorts", () => {
    const all = [
      r("late", new Date(2026, 2, 11)),
      r("soon", new Date(2026, 2, 10, 12)),
      r("old", new Date(2026, 2, 9), "pending"),
    ];
    expect(filterReminders(all, "upcoming", NOW).map((x) => x.id)).toEqual([
      "soon",
      "late",
    ]);
    expect(filterReminders(all, "past_due", NOW).map((x) => x.id)).toEqual(["old"]);
  });
});

describe("presets and snooze", () => {
  it("tomorrow is 9:00 local next day", () => {
    const t = presetTime("tomorrow", NOW);
    expect([t.getDate(), t.getHours(), t.getMinutes()]).toEqual([11, 9, 0]);
  });
  it("next week is the coming Monday 9:00", () => {
    const t = presetTime("next_week", NOW);
    expect(t.getDay()).toBe(1);
    expect(t.getHours()).toBe(9);
    expect(t.getTime()).toBeGreaterThan(NOW.getTime());
  });
  it("snoozes relative to now", () => {
    expect(snoozeTime("10m", NOW).getTime() - NOW.getTime()).toBe(10 * 60_000);
    expect(snoozeTime("1h", NOW).getTime() - NOW.getTime()).toBe(3_600_000);
  });
  it("later today never lands in the past", () => {
    expect(
      presetTime("later_today", new Date(2026, 2, 10, 20, 50)).getTime(),
    ).toBeGreaterThan(new Date(2026, 2, 10, 20, 50).getTime());
  });
});
