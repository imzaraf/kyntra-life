"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  AlarmClock,
  Bell,
  BellRing,
  Check,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorNotice, ListSkeleton } from "@/components/shared/empty-state";
import { SectionTabs } from "@/components/shared/section-tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOpenTasks } from "@/features/tasks/use-tasks";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types/domain";
import { ReminderFormDialog } from "./reminder-form-dialog";
import {
  filterReminders,
  reminderState,
  SNOOZE_LABELS,
  type ReminderView,
  type SnoozeOption,
} from "./reminder-logic";
import {
  useClosedReminders,
  usePendingReminders,
  useReminderActions,
} from "./use-reminders";

export function RemindersPanel() {
  const now = useNow(15_000);
  const highlight = useSearchParams().get("reminder");
  const pending = usePendingReminders();
  const closed = useClosedReminders();
  const tasks = useOpenTasks();
  const actions = useReminderActions();

  const [view, setView] = useState<ReminderView>("upcoming");
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Reminder | null>(null);

  const all = useMemo(
    () => [...pending.data, ...closed.data],
    [pending.data, closed.data],
  );
  const list = useMemo(() => filterReminders(all, view, now), [all, view, now]);
  const count = (v: ReminderView) => filterReminders(pending.data, v, now).length;
  const source = view === "completed" ? closed : pending;

  return (
    <section aria-label="Reminders" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTabs
          label="Reminder views"
          value={view}
          onChange={setView}
          tabs={[
            { key: "upcoming", label: "Upcoming", count: count("upcoming") },
            { key: "due", label: "Due", count: count("due") },
            { key: "past_due", label: "Past due", count: count("past_due") },
            { key: "completed", label: "Completed" },
          ]}
        />
        <Button onClick={() => setCreating(true)}>
          <Plus /> New reminder
        </Button>
      </div>

      {source.error ? (
        <ErrorNotice error={source.error} />
      ) : source.loading ? (
        <ListSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={view === "completed" ? "Nothing here yet" : "All quiet"}
          description="Set a reminder and Kyntra will bring it to you at the right moment."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Set a reminder
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => {
            const state = reminderState(r, now);
            const active = r.status === "pending";
            return (
              <li
                key={r.id}
                id={`reminder-${r.id}`}
                className={cn(
                  "paper hover-lift flex items-center gap-4 p-4",
                  highlight === r.id && "ring-2 ring-terracotta/60",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    state === "past_due"
                      ? "bg-terracotta-soft text-terracotta"
                      : state === "due"
                        ? "bg-terracotta text-primary-foreground"
                        : "bg-sage-soft text-forest",
                  )}
                >
                  {state === "due" ? (
                    <BellRing className="size-4" />
                  ) : (
                    <AlarmClock className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-medium",
                      !active && "text-muted-foreground line-through",
                    )}
                  >
                    {r.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(r.scheduledAt, "EEE, MMM d · h:mm a")}
                    {active &&
                      ` · ${state === "upcoming" ? "in " : ""}${formatDistanceToNow(r.scheduledAt)}${state === "upcoming" ? "" : " ago"}`}
                    {r.note && ` · ${r.note}`}
                  </p>
                </div>
                {active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void actions.complete(r)}
                  >
                    <Check /> Done
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${r.title}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl">
                    {active && (
                      <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Snooze for
                        </DropdownMenuLabel>
                        {(Object.keys(SNOOZE_LABELS) as SnoozeOption[]).map((o) => (
                          <DropdownMenuItem
                            key={o}
                            onSelect={() => void actions.snooze(r, o)}
                          >
                            <AlarmClock /> {SNOOZE_LABELS[o]}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => void actions.dismiss(r)}>
                          Dismiss
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onSelect={() => setEditing(r)}>
                      <Pencil /> {active ? "Edit" : "Reschedule"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleting(r)}
                    >
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}

      <ReminderFormDialog
        open={creating}
        onOpenChange={setCreating}
        tasks={tasks.data}
        onSubmit={(i) => void actions.create(i)}
      />
      <ReminderFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        reminder={editing}
        tasks={tasks.data}
        onSubmit={(i) => editing && void actions.update(editing.id, i)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this reminder?"
        description={`“${deleting?.title ?? ""}” will be removed and won't notify you.`}
        onConfirm={() => deleting && void actions.remove(deleting)}
      />
    </section>
  );
}
