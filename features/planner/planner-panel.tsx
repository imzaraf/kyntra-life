"use client";

import { format } from "date-fns";
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorNotice } from "@/components/shared/empty-state";
import { SectionTabs } from "@/components/shared/section-tabs";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import {
  formatDuration,
  formatMinutes,
  fromDayKey,
  minutesOfDay,
  shiftDayKey,
  todayKey,
  weekDayKeys,
} from "@/lib/date-time";
import { useOpenTasks } from "@/features/tasks/use-tasks";
import type { TimeBlock } from "@/types/domain";
import { BlockFormDialog, type BlockDraftInit } from "./block-form-dialog";
import { DayTimeline } from "./day-timeline";
import { findOverlaps, nextBlock, planMyDay, plannedMinutes } from "./planner-logic";
import { PlanMyDayDialog } from "./plan-my-day-dialog";
import { useBlockActions, useDayBlocks, useWeekBlocks } from "./use-blocks";

export function PlannerPanel() {
  const now = useNow(30_000);
  const today = todayKey(now);
  const [day, setDay] = useState(today);
  const [mode, setMode] = useState<"day" | "week">("day");
  const isToday = day === today;
  const blocks = useDayBlocks(day);
  const tasks = useOpenTasks();
  const actions = useBlockActions();

  const [dialog, setDialog] = useState<{
    block: TimeBlock | null;
    init: BlockDraftInit;
  } | null>(null);
  const [planning, setPlanning] = useState(false);

  const nowMin = minutesOfDay(now);
  const upNext = isToday ? nextBlock(blocks.data, nowMin) : blocks.data[0];
  const dueToday = useMemo(
    () => tasks.data.filter((t) => t.dueDate === day),
    [tasks.data, day],
  );
  const proposals = useMemo(
    () => (planning ? planMyDay(dueToday, blocks.data, isToday ? nowMin : 6 * 60) : []),
    [planning, dueToday, blocks.data, isToday, nowMin],
  );

  const openCreate = (startMin: number, endMin = startMin + 60) =>
    setDialog({
      block: null,
      init: { date: day, startMin, endMin: Math.min(endMin, 1440) },
    });

  const changeTimes = (b: TimeBlock, startMin: number, endMin: number) => {
    const clash = findOverlaps({ id: b.id, startMin, endMin }, blocks.data);
    void actions.update(b.id, { startMin, endMin });
    if (clash.length)
      toast.warning(
        `Now overlaps “${clash[0].title}”${clash.length > 1 ? ` and ${clash.length - 1} more` : ""}.`,
      );
  };

  const acceptPlan = () => {
    proposals.forEach((p) =>
      actions.create({
        title: p.task.title,
        date: day,
        startMin: p.startMin,
        endMin: p.endMin,
        taskId: p.task.id,
      }),
    );
    toast.success(
      `Added ${proposals.length} ${proposals.length === 1 ? "block" : "blocks"} to your day.`,
    );
  };

  return (
    <section aria-label="Planner" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous day"
            onClick={() => setDay(shiftDayKey(day, mode === "week" ? -7 : -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next day"
            onClick={() => setDay(shiftDayKey(day, mode === "week" ? 7 : 1))}
          >
            <ChevronRight />
          </Button>
          <Button variant="ghost" onClick={() => setDay(today)} disabled={isToday}>
            Today
          </Button>
          <h2 className="ml-2 font-serif text-2xl">
            {format(fromDayKey(day), "EEEE, MMM d")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <SectionTabs
            label="Planner range"
            value={mode}
            onChange={setMode}
            tabs={[
              { key: "day", label: "Day" },
              { key: "week", label: "Week" },
            ]}
          />
          {mode === "day" && (
            <>
              <Button variant="secondary" onClick={() => setPlanning(true)}>
                <Sparkles /> Plan my day
              </Button>
              <Button
                onClick={() => openCreate(isToday ? Math.ceil(nowMin / 15) * 15 : 9 * 60)}
              >
                <Plus /> Block
              </Button>
            </>
          )}
        </div>
      </div>

      {mode === "day" ? (
        <>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground tabular-nums">
                {formatDuration(plannedMinutes(blocks.data))}
              </span>{" "}
              planned
            </span>
            {upNext && (
              <span>
                {isToday && upNext.startMin <= nowMin ? "Now" : "Up next"}:{" "}
                <span className="font-medium text-foreground">{upNext.title}</span> ·{" "}
                {formatMinutes(upNext.startMin)}
              </span>
            )}
          </div>
          {blocks.error ? (
            <ErrorNotice error={blocks.error} />
          ) : (
            <DayTimeline
              blocks={blocks.data}
              nowMin={isToday ? nowMin : null}
              onCreateAt={openCreate}
              onEdit={(b) =>
                setDialog({
                  block: b,
                  init: { date: b.date, startMin: b.startMin, endMin: b.endMin },
                })
              }
              onChangeTimes={changeTimes}
            />
          )}
        </>
      ) : (
        <WeekView
          day={day}
          today={today}
          onPick={(k) => {
            setDay(k);
            setMode("day");
          }}
        />
      )}

      {dialog && (
        <BlockFormDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          block={dialog.block}
          init={dialog.init}
          tasks={tasks.data}
          onSubmit={(input) =>
            dialog.block
              ? void actions.update(dialog.block.id, input)
              : void actions.create(input)
          }
          onDelete={(b) => void actions.remove(b.id)}
        />
      )}
      <PlanMyDayDialog
        open={planning}
        onOpenChange={setPlanning}
        proposals={proposals}
        onAccept={acceptPlan}
      />
    </section>
  );
}

function WeekView({
  day,
  today,
  onPick,
}: {
  day: string;
  today: string;
  onPick: (key: string) => void;
}) {
  const keys = weekDayKeys(day);
  const week = useWeekBlocks(keys);
  if (week.error) return <ErrorNotice error={week.error} />;
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {keys.map((k) => {
        const items = week.data
          .filter((b) => b.date === k)
          .sort((a, b) => a.startMin - b.startMin);
        return (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            className={`paper hover-lift flex min-h-32 flex-col gap-2 p-3 text-left ${k === today ? "ring-2 ring-terracotta/50" : ""}`}
          >
            <span className="eyebrow">{format(fromDayKey(k), "EEE d")}</span>
            {items.length === 0 ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" /> Open
              </span>
            ) : (
              items.slice(0, 4).map((b) => (
                <span
                  key={b.id}
                  className="truncate rounded-lg bg-sage-soft px-2 py-1 text-xs"
                >
                  <span className="tabular-nums opacity-70">
                    {formatMinutes(b.startMin)}
                  </span>{" "}
                  {b.title}
                </span>
              ))
            )}
            {items.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{items.length - 4} more
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
