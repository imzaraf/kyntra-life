import { describe, expect, it } from "vitest";
import type { Task } from "@/types/domain";
import {
  completionPatch,
  countsForDay,
  dueState,
  filterTasks,
  sortTasks,
} from "./task-logic";

const make = (over: Partial<Task>): Task => ({
  id: Math.random().toString(36),
  schemaVersion: 1,
  title: "t",
  priority: "medium",
  status: "todo",
  tags: [],
  subtasks: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...over,
});

const TODAY = "2026-03-10";

describe("task logic", () => {
  const tasks = [
    make({ id: "a", dueDate: "2026-03-09" }),
    make({ id: "b", dueDate: TODAY }),
    make({ id: "c", dueDate: "2026-03-12" }),
    make({ id: "d" }),
    make({ id: "e", dueDate: TODAY, status: "done" }),
  ];

  it("classifies due states", () => {
    expect(dueState(tasks[0], TODAY)).toBe("overdue");
    expect(dueState(tasks[1], TODAY)).toBe("today");
    expect(dueState(tasks[2], TODAY)).toBe("upcoming");
    expect(dueState(tasks[3], TODAY)).toBe("none");
    expect(dueState(tasks[4], TODAY)).toBe("done");
  });

  it("filters views, including overdue in Today", () => {
    expect(filterTasks(tasks, "today", TODAY).map((t) => t.id)).toEqual(["a", "b"]);
    expect(filterTasks(tasks, "upcoming", TODAY).map((t) => t.id)).toEqual(["c"]);
    expect(filterTasks(tasks, "completed", TODAY).map((t) => t.id)).toEqual(["e"]);
    expect(filterTasks(tasks, "all", TODAY).map((t) => t.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("sorts by due date then priority; undated last", () => {
    const sorted = sortTasks(
      [
        make({ id: "x", priority: "low", dueDate: TODAY }),
        make({ id: "y", priority: "high", dueDate: TODAY }),
        make({ id: "z" }),
      ],
      "due",
    );
    expect(sorted.map((t) => t.id)).toEqual(["y", "x", "z"]);
  });

  it("builds completion patches", () => {
    const now = new Date("2026-03-10T10:00:00");
    expect(completionPatch(true, now)).toEqual({ status: "done", completedAt: now });
    expect(completionPatch(false)).toEqual({ status: "todo", completedAt: null });
  });

  it("counts the day", () => {
    expect(countsForDay(tasks, TODAY)).toEqual({ total: 2, done: 1, overdue: 1 });
  });
});
