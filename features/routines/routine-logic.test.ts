import { describe, expect, it } from "vitest";
import type { Routine } from "@/types/domain";
import { consistency, currentRun, isScheduledOn } from "./routine-logic";

const r = (marks: Routine["marks"], over: Partial<Routine> = {}): Routine =>
  ({
    id: "r",
    title: "Read",
    frequency: "daily",
    days: [],
    marks,
    archived: false,
    ...over,
  }) as Routine;

describe("routine logic", () => {
  it("schedules weekly routines by weekday", () => {
    expect(isScheduledOn({ frequency: "weekly", days: [1] }, "2026-03-09")).toBe(true); // Monday
    expect(isScheduledOn({ frequency: "weekly", days: [1] }, "2026-03-10")).toBe(false);
  });
  it("treats rest and skipped days as neutral in consistency", () => {
    const routine = r({
      "2026-03-08": "done",
      "2026-03-09": "rest",
      "2026-03-10": "skipped",
    });
    expect(consistency(routine, "2026-03-10", 3)).toEqual({ done: 1, scheduled: 1 });
  });
  it("keeps the run alive through rest days and an unfinished today", () => {
    const routine = r({ "2026-03-08": "done", "2026-03-09": "rest" });
    expect(currentRun(routine, "2026-03-10")).toBe(1);
  });
  it("breaks the run on a missed earlier day", () => {
    const routine = r({ "2026-03-10": "done" });
    expect(currentRun(routine, "2026-03-10")).toBe(1);
    expect(
      currentRun(r({ "2026-03-08": "done", "2026-03-10": "done" }), "2026-03-10"),
    ).toBe(1);
  });
});
