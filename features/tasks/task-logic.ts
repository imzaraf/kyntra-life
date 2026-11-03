import type { Priority, Task } from "@/types/domain";

export type TaskView = "today" | "upcoming" | "all" | "completed";
export type DueState = "overdue" | "today" | "upcoming" | "none" | "done";
export type TaskSort = "due" | "priority" | "created";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function dueState(task: Task, todayKey: string): DueState {
  if (task.status === "done") return "done";
  if (!task.dueDate) return "none";
  if (task.dueDate < todayKey) return "overdue";
  if (task.dueDate === todayKey) return "today";
  return "upcoming";
}

const isOpen = (t: Task) => t.status === "todo";

export function filterTasks(tasks: Task[], view: TaskView, todayKey: string): Task[] {
  switch (view) {
    case "today":
      // Today also surfaces overdue work so nothing silently disappears.
      return tasks.filter((t) => isOpen(t) && !!t.dueDate && t.dueDate <= todayKey);
    case "upcoming":
      return tasks.filter((t) => isOpen(t) && !!t.dueDate && t.dueDate > todayKey);
    case "completed":
      return tasks.filter((t) => t.status === "done");
    case "all":
      return tasks.filter(isOpen);
  }
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const copy = [...tasks];
  const byDue = (a: Task, b: Task) =>
    (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
    (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99");
  const byPriority = (a: Task, b: Task) =>
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  const byCreated = (a: Task, b: Task) => b.createdAt.getTime() - a.createdAt.getTime();
  const cmp =
    sort === "due"
      ? (a: Task, b: Task) => byDue(a, b) || byPriority(a, b)
      : sort === "priority"
        ? (a: Task, b: Task) => byPriority(a, b) || byDue(a, b)
        : byCreated;
  return copy.sort(cmp);
}

export function matchesFilters(
  task: Task,
  filters: { priority?: Priority | "all"; tag?: string | null; query?: string },
): boolean {
  if (
    filters.priority &&
    filters.priority !== "all" &&
    task.priority !== filters.priority
  )
    return false;
  if (filters.tag && !task.tags.includes(filters.tag)) return false;
  const q = filters.query?.trim().toLowerCase();
  if (
    q &&
    !`${task.title} ${task.description ?? ""} ${task.tags.join(" ")}`
      .toLowerCase()
      .includes(q)
  )
    return false;
  return true;
}

export function completionPatch(done: boolean, now: Date = new Date()) {
  return done
    ? { status: "done" as const, completedAt: now }
    : { status: "todo" as const, completedAt: null };
}

export function countsForDay(tasks: Task[], todayKey: string) {
  const dueToday = tasks.filter((t) => t.dueDate === todayKey && t.status !== "archived");
  return {
    total: dueToday.length,
    done: dueToday.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => dueState(t, todayKey) === "overdue").length,
  };
}
