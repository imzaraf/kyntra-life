"use client";

import {
  Check,
  Coffee,
  Flame,
  Pencil,
  Plus,
  Repeat,
  SkipForward,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorNotice, ListSkeleton } from "@/components/shared/empty-state";
import {
  RecordDialog,
  type FieldDef,
  type Values,
} from "@/components/shared/record-dialog";
import { Button } from "@/components/ui/button";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { useNow } from "@/hooks/use-now";
import { fromDayKey, todayKey } from "@/lib/date-time";
import { routineRepo } from "@/lib/repositories";
import { cn } from "@/lib/utils";
import type { Routine, RoutineMark } from "@/types/domain";
import { consistency, currentRun, isScheduledOn, lastDays } from "./routine-logic";
import { format } from "date-fns";
import { where } from "firebase/firestore";

export const useRoutines = () =>
  useRepoQuery(routineRepo, () => [where("archived", "==", false)], "active");

const FIELDS: FieldDef[] = [
  {
    name: "title",
    label: "Routine",
    type: "text",
    required: true,
    placeholder: "Read for 20 minutes",
  },
  {
    name: "frequency",
    label: "Frequency",
    type: "select",
    options: [
      { value: "daily", label: "Every day" },
      { value: "weekly", label: "Chosen days" },
    ],
  },
  { name: "days", label: "Days (for chosen days)", type: "weekdays" },
];

export function RoutinesPanel() {
  const now = useNow(60_000);
  const today = todayKey(now);
  const routines = useRoutines();
  const actions = useCollectionActions(routineRepo, "the routine");
  const [editing, setEditing] = useState<Routine | null>(null);
  const [creating, setCreating] = useState(false);

  const mark = (r: Routine, key: string, value: RoutineMark) => {
    const marks = { ...r.marks };
    if (marks[key] === value) delete marks[key];
    else marks[key] = value;
    void actions.update(r.id, { marks });
  };

  const toValues = (r?: Routine | null): Values => ({
    title: r?.title ?? "",
    frequency: r?.frequency ?? "daily",
    days: (r?.days ?? []).map(String),
  });
  const fromValues = (v: Values) => ({
    title: String(v.title).trim(),
    frequency: v.frequency as "daily" | "weekly",
    days: (v.days as string[]).map(Number),
  });

  return (
    <section aria-label="Routines" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="max-w-md text-sm text-muted-foreground">
          Gentle rhythms, not scorecards. Rest and skipped days never count against you.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus /> New routine
        </Button>
      </div>

      {routines.error ? (
        <ErrorNotice error={routines.error} />
      ) : routines.loading ? (
        <ListSkeleton rows={2} />
      ) : routines.data.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No routines yet"
          description="Add a morning stretch, a weekly review, anything you'd like to return to."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Add a routine
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {routines.data.map((r) => {
            const week = lastDays(today, 7);
            const c = consistency(r, today);
            const run = currentRun(r, today);
            const scheduledToday = isScheduledOn(r, today);
            const m = r.marks[today];
            return (
              <li key={r.id} className="paper p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-[1_1_100%] sm:flex-1">
                    <p className="font-medium">{r.title}</p>
                    <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {c.scheduled
                          ? `${c.done} of ${c.scheduled} this week`
                          : "Resting this week"}
                      </span>
                      {run >= 2 && (
                        <span className="flex items-center gap-1 text-terracotta">
                          <Flame className="size-3" />
                          {run} in a row
                        </span>
                      )}
                    </p>
                  </div>
                  <div
                    className="flex gap-1.5"
                    role="group"
                    aria-label={`Mark ${r.title} for today`}
                  >
                    <Button
                      size="sm"
                      variant={m === "done" ? "default" : "outline"}
                      disabled={!scheduledToday}
                      aria-pressed={m === "done"}
                      onClick={() => mark(r, today, "done")}
                    >
                      <Check /> Done
                    </Button>
                    <Button
                      size="icon-sm"
                      variant={m === "skipped" ? "secondary" : "ghost"}
                      aria-label="Skip today"
                      aria-pressed={m === "skipped"}
                      onClick={() => mark(r, today, "skipped")}
                    >
                      <SkipForward />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant={m === "rest" ? "secondary" : "ghost"}
                      aria-label="Rest day"
                      aria-pressed={m === "rest"}
                      onClick={() => mark(r, today, "rest")}
                    >
                      <Coffee />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit routine"
                      onClick={() => setEditing(r)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Archive routine"
                      onClick={() => void actions.update(r.id, { archived: true })}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {week.map((k) => {
                    const mk = r.marks[k];
                    const sched = isScheduledOn(r, k);
                    return (
                      <span
                        key={k}
                        title={`${format(fromDayKey(k), "EEE MMM d")}${mk ? ` · ${mk}` : ""}`}
                        className={cn(
                          "grid h-7 flex-1 place-items-center rounded-lg text-[0.65rem]",
                          !sched
                            ? "text-muted-foreground/40"
                            : mk === "done"
                              ? "bg-forest text-primary-foreground"
                              : mk
                                ? "bg-sage-soft text-forest"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        {format(fromDayKey(k), "EEEEE")}
                      </span>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RecordDialog
        open={creating}
        onOpenChange={setCreating}
        title="New routine"
        fields={FIELDS}
        initial={toValues()}
        onSubmit={(v) =>
          void actions.create({ ...fromValues(v), marks: {}, archived: false })
        }
      />
      <RecordDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit routine"
        fields={FIELDS}
        initial={toValues(editing)}
        onSubmit={(v) => editing && void actions.update(editing.id, fromValues(v))}
      />
    </section>
  );
}
