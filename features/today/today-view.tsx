"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  AlarmClock,
  ArrowRight,
  BookOpenText,
  CalendarClock,
  Check,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ListSkeleton } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { useJournalEntries } from "@/features/journal/use-journal";
import { formatMinutes, greetingFor, minutesOfDay, todayKey } from "@/lib/date-time";
import { nextBlock } from "@/features/planner/planner-logic";
import { useDayBlocks } from "@/features/planner/use-blocks";
import { reminderState } from "@/features/reminders/reminder-logic";
import {
  usePendingReminders,
  useReminderActions,
} from "@/features/reminders/use-reminders";
import { isScheduledOn } from "@/features/routines/routine-logic";
import { useRoutines } from "@/features/routines/routines-panel";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { useNow } from "@/hooks/use-now";
import { routineRepo } from "@/lib/repositories";
import { cn } from "@/lib/utils";
import { countsForDay, filterTasks, sortTasks } from "@/features/tasks/task-logic";
import { TaskFormDialog } from "@/features/tasks/task-form-dialog";
import { useTaskActions } from "@/features/tasks/use-task-actions";
import { useCompletedTasks, useOpenTasks } from "@/features/tasks/use-tasks";
import { promptForDay } from "./journal-prompts";
import { useRecentActivity } from "./use-activity";

export function TodayView() {
  const now = useNow(30_000);
  const today = todayKey(now);
  const { user } = useAuth();
  const open = useOpenTasks();
  const done = useCompletedTasks();
  const reminders = usePendingReminders();
  const blocks = useDayBlocks(today);
  const journal = useJournalEntries();
  const routines = useRoutines();
  const activity = useRecentActivity();
  const taskActions = useTaskActions();
  const reminderActions = useReminderActions();
  const routineActions = useCollectionActions(routineRepo, "the routine");
  const [adding, setAdding] = useState(false);

  const name = user?.displayName?.split(" ")[0];
  const todays = sortTasks(filterTasks(open.data, "today", today), "priority");
  const counts = countsForDay([...open.data, ...done.data], today);
  const nextReminders = reminders.data.slice(0, 3);
  const upNext = nextBlock(blocks.data, minutesOfDay(now));
  const todaysEntry = journal.data.find((e) => e.date === today);
  const routinesToday = routines.data.filter((r) => isScheduledOn(r, today));

  return (
    <>
      <PageHeader
        eyebrow={format(now, "EEEE, MMMM d")}
        title={`${greetingFor(now)}${name ? `, ${name}` : ""}.`}
        description={promptForDay(now)}
        actions={
          <Button asChild variant="secondary">
            <Link href={todaysEntry ? `/journal?entry=${todaysEntry.id}` : "/journal"}>
              <BookOpenText />{" "}
              {todaysEntry ? "Continue today's entry" : "Write today's entry"}
            </Link>
          </Button>
        }
      />

      {activity.isBrandNew && <Onboarding onAddTask={() => setAdding(true)} />}

      <div className="rise grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        <Stat label="Done today" value={counts.done} of={counts.total} />
        <Stat label="Still to do" value={todays.length} />
        <Stat
          label="Overdue"
          value={counts.overdue}
          tone={counts.overdue ? "warn" : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Card
            title="Today's tasks"
            action={
              <Link
                href="/plan?view=tasks"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                All tasks <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            {open.loading ? (
              <ListSkeleton rows={3} />
            ) : todays.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Nothing due today"
                description="A rare, quiet list. Add something or enjoy the space."
                action={
                  <Button variant="outline" onClick={() => setAdding(true)}>
                    <Plus /> Add a task
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-1">
                {todays.slice(0, 6).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={false}
                      aria-label={`Complete ${t.title}`}
                      onClick={() => void taskActions.toggle(t)}
                      className="grid size-5 shrink-0 place-items-center rounded-full border border-input outline-none hover:border-forest focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    {t.dueDate && t.dueDate < today && (
                      <span className="text-xs text-destructive">Overdue</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {todays.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setAdding(true)}
              >
                <Plus /> Add task
              </Button>
            )}
          </Card>

          <Card
            title="Schedule"
            action={
              <Link
                href="/plan?view=planner"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Planner <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            {blocks.loading ? (
              <ListSkeleton rows={2} />
            ) : blocks.data.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="An open day"
                description="Block out time for what matters."
                action={
                  <Button asChild variant="outline">
                    <Link href="/plan?view=planner">Plan my day</Link>
                  </Button>
                }
              />
            ) : (
              <>
                {upNext && (
                  <p className="mb-3 text-sm text-muted-foreground">
                    {upNext.startMin <= minutesOfDay(now) ? "Now" : "Up next"}:{" "}
                    <span className="font-medium text-foreground">{upNext.title}</span> ·{" "}
                    {formatMinutes(upNext.startMin)}
                  </p>
                )}
                <ul className="space-y-1.5">
                  {blocks.data.slice(0, 5).map((b) => (
                    <li
                      key={b.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                        upNext?.id === b.id ? "bg-sage-soft" : "bg-muted/50",
                        minutesOfDay(now) >= b.endMin && "opacity-55",
                      )}
                    >
                      <span className="w-[4.5rem] shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatMinutes(b.startMin)}
                      </span>
                      <span className="truncate">{b.title}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Next reminders"
            action={
              <Link
                href="/plan?view=reminders"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                All <ArrowRight className="size-3.5" />
              </Link>
            }
          >
            {reminders.loading ? (
              <ListSkeleton rows={2} />
            ) : nextReminders.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No upcoming reminders.</p>
            ) : (
              <ul className="space-y-2">
                {nextReminders.map((r) => {
                  const due = reminderState(r, now) !== "upcoming";
                  return (
                    <li key={r.id} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full",
                          due
                            ? "bg-terracotta text-primary-foreground"
                            : "bg-sage-soft text-forest",
                        )}
                      >
                        <AlarmClock className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {r.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {due
                            ? `${formatDistanceToNow(r.scheduledAt)} ago`
                            : format(r.scheduledAt, "EEE h:mm a")}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Complete ${r.title}`}
                        onClick={() => void reminderActions.complete(r)}
                      >
                        <Check />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {routinesToday.length > 0 && (
            <Card
              title="Routines"
              action={
                <Link
                  href="/plan?view=routines"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  All <ArrowRight className="size-3.5" />
                </Link>
              }
            >
              <ul className="space-y-1.5">
                {routinesToday.map((r) => {
                  const m = r.marks[today];
                  return (
                    <li key={r.id} className="flex items-center gap-3">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={m === "done"}
                        aria-label={`Mark ${r.title} done`}
                        onClick={() => {
                          const marks = { ...r.marks };
                          if (m === "done") delete marks[today];
                          else marks[today] = "done";
                          void routineActions.update(r.id, { marks });
                        }}
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          m === "done"
                            ? "border-forest bg-forest text-primary-foreground"
                            : "border-input",
                        )}
                      >
                        {m === "done" && <Check className="size-3" />}
                      </button>
                      <span
                        className={cn(
                          "text-sm",
                          m === "done" && "text-muted-foreground line-through",
                        )}
                      >
                        {r.title}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <Card title="Recently">
            {activity.loading ? (
              <ListSkeleton rows={3} />
            ) : activity.items.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                Activity will appear as you use Kyntra.
              </p>
            ) : (
              <ul className="space-y-1">
                {activity.items.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={a.href}
                      className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                    >
                      <span className="min-w-0 truncate">
                        <span className="text-xs text-muted-foreground">
                          {a.label} ·{" "}
                        </span>
                        {a.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(a.at, { addSuffix: true })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <TaskFormDialog
        open={adding}
        onOpenChange={setAdding}
        defaults={{ dueDate: today }}
        onSubmit={(i) => void taskActions.create(i)}
      />
    </>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="paper rise p-5 md:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  of,
  tone,
}: {
  label: string;
  value: number;
  of?: number;
  tone?: "warn";
}) {
  return (
    <div className="paper p-4 md:p-5">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "mt-2 font-serif text-4xl tabular-nums",
          tone === "warn" && "text-terracotta",
        )}
      >
        {value}
        {of !== undefined && (
          <span className="text-xl text-muted-foreground"> / {of}</span>
        )}
      </p>
    </div>
  );
}

function Onboarding({ onAddTask }: { onAddTask: () => void }) {
  return (
    <section className="glass rise relative mb-6 overflow-hidden rounded-3xl p-6 md:p-8">
      <p className="eyebrow mb-2">Welcome to Kyntra Life</p>
      <h2 className="max-w-lg text-3xl">Kin what belongs to you. Track it.</h2>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Start with one small thing. Everything you add is private to you and appears here.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onAddTask}>
          <Plus /> Add your first task
        </Button>
        <Button asChild variant="outline">
          <Link href="/journal">Write a first entry</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/plan?view=reminders">Set a reminder</Link>
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Tip: press ⌘K anywhere to capture a thought in seconds.
      </p>
    </section>
  );
}
