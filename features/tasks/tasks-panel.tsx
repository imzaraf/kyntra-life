"use client";

import { CheckCircle2, ListTodo, Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorNotice, ListSkeleton } from "@/components/shared/empty-state";
import { SectionTabs } from "@/components/shared/section-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useNow } from "@/hooks/use-now";
import { todayKey } from "@/lib/date-time";
import type { Priority, Task } from "@/types/domain";
import {
  filterTasks,
  matchesFilters,
  sortTasks,
  type TaskSort,
  type TaskView,
} from "./task-logic";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskRow } from "./task-row";
import { useCompletedTasks, useOpenTasks } from "./use-tasks";
import { useTaskActions } from "./use-task-actions";

const VIEWS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
] as const;

export function TasksPanel() {
  const now = useNow(60_000);
  const today = todayKey(now);
  const highlight = useSearchParams().get("task");
  const open = useOpenTasks();
  const completed = useCompletedTasks();
  const actions = useTaskActions();

  const [view, setView] = useState<TaskView>("today");
  const [sort, setSort] = useState<TaskSort>("due");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const source = view === "completed" ? completed : open;
  const tasks = useMemo(() => {
    const filtered = filterTasks(source.data, view, today).filter((t) =>
      matchesFilters(t, { priority, query }),
    );
    return view === "completed" ? filtered : sortTasks(filtered, sort);
  }, [source.data, view, today, priority, query, sort]);

  const counts = {
    today: filterTasks(open.data, "today", today).length,
    upcoming: filterTasks(open.data, "upcoming", today).length,
    all: open.data.length,
  };

  return (
    <section aria-label="Tasks" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTabs
          label="Task views"
          value={view}
          onChange={setView}
          tabs={VIEWS.map((v) => ({
            ...v,
            count: v.key === "completed" ? undefined : counts[v.key],
          }))}
        />
        <Button onClick={() => setCreating(true)}>
          <Plus /> New task
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search tasks"
            placeholder="Search tasks"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-36">
          <NativeSelect
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority | "all")}
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </NativeSelect>
        </div>
        {view !== "completed" && (
          <div className="w-36">
            <NativeSelect
              aria-label="Sort tasks"
              value={sort}
              onChange={(e) => setSort(e.target.value as TaskSort)}
            >
              <option value="due">Sort: Due date</option>
              <option value="priority">Sort: Priority</option>
              <option value="created">Sort: Newest</option>
            </NativeSelect>
          </div>
        )}
      </div>

      {source.error ? (
        <ErrorNotice error={source.error} />
      ) : source.loading ? (
        <ListSkeleton />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={view === "completed" ? CheckCircle2 : ListTodo}
          title={
            view === "completed"
              ? "Nothing completed yet"
              : query || priority !== "all"
                ? "No matching tasks"
                : "A clear slate"
          }
          description={
            view === "completed"
              ? "Finished tasks will rest here."
              : "Add a task to start shaping your day."
          }
          action={
            view !== "completed" && (
              <Button onClick={() => setCreating(true)}>
                <Plus /> Add a task
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              todayKey={today}
              highlighted={highlight === t.id}
              onToggle={() => void actions.toggle(t)}
              onEdit={() => setEditing(t)}
              onPostpone={() => void actions.postpone(t)}
              onArchive={() => void actions.archive(t)}
              onDelete={() => setDeleting(t)}
            />
          ))}
        </ul>
      )}

      <TaskFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaults={{ dueDate: view === "today" ? today : "" }}
        onSubmit={(i) => void actions.create(i)}
      />
      <TaskFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        task={editing}
        onSubmit={(i) => editing && void actions.update(editing.id, i)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this task?"
        description={`“${deleting?.title ?? ""}” will be permanently removed.`}
        onConfirm={() => deleting && void actions.remove(deleting)}
      />
    </section>
  );
}
