"use client";

import { Link2, Plus } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { formatDuration, formatMinutes } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type { TimeBlock } from "@/types/domain";
import { blockPhase, DAY_MINUTES, findGaps, findOverlaps } from "./planner-logic";

const HOUR_PX = 64;
const PX_PER_MIN = HOUR_PX / 60;
const SNAP = 15;

interface DragState {
  id: string;
  mode: "move" | "resize";
  originY: number;
  start: number;
  end: number;
  delta: number;
  moved: boolean;
}

export function DayTimeline({
  blocks,
  nowMin,
  onCreateAt,
  onEdit,
  onChangeTimes,
}: {
  blocks: TimeBlock[];
  /** null when the viewed day is not today */
  nowMin: number | null;
  onCreateAt: (startMin: number, endMin?: number) => void;
  onEdit: (block: TimeBlock) => void;
  onChangeTimes: (block: TimeBlock, startMin: number, endMin: number) => void;
}) {
  const first = Math.min(6 * 60, ...blocks.map((b) => Math.floor(b.startMin / 60) * 60));
  const last = Math.max(22 * 60, ...blocks.map((b) => Math.ceil(b.endMin / 60) * 60));
  const rangeStart = Math.max(0, first);
  const rangeEnd = Math.min(DAY_MINUTES, last);
  const hours = Array.from(
    { length: (rangeEnd - rangeStart) / 60 + 1 },
    (_, i) => rangeStart + i * 60,
  );
  const top = (min: number) => (min - rangeStart) * PX_PER_MIN;

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const gaps = findGaps(blocks, rangeStart, rangeEnd, 45);

  const begin = (e: PointerEvent, b: TimeBlock, mode: DragState["mode"]) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const s: DragState = {
      id: b.id,
      mode,
      originY: e.clientY,
      start: b.startMin,
      end: b.endMin,
      delta: 0,
      moved: false,
    };
    dragRef.current = s;
    setDrag(s);
  };
  const move = (e: PointerEvent) => {
    const s = dragRef.current;
    if (!s) return;
    const dy = e.clientY - s.originY;
    const delta = Math.round(dy / PX_PER_MIN / SNAP) * SNAP;
    const next = { ...s, delta, moved: s.moved || Math.abs(dy) > 4 };
    dragRef.current = next;
    setDrag(next);
  };
  const finish = (b: TimeBlock) => {
    const s = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!s) return;
    if (!s.moved) return onEdit(b);
    const { start, end } = preview(s, b);
    if (start !== b.startMin || end !== b.endMin) onChangeTimes(b, start, end);
  };

  return (
    <div
      className="paper relative overflow-hidden p-4 pl-16 md:p-6 md:pl-20"
      style={{ height: top(rangeEnd) + 48 }}
    >
      {/* hour grid */}
      {hours.map((h) => (
        <div key={h} className="absolute inset-x-0" style={{ top: top(h) + 24 }}>
          <span className="absolute left-4 -translate-y-1/2 text-[0.7rem] text-muted-foreground tabular-nums md:left-6">
            {h < DAY_MINUTES ? formatMinutes(h) : ""}
          </span>
          <div className="ml-16 border-t border-border/70 md:ml-20" />
        </div>
      ))}

      <div className="absolute inset-y-6 right-4 left-16 md:right-6 md:left-20">
        {/* Empty space is clickable: pointer position → a one-hour block at that time. */}
        <div
          className="absolute inset-0 cursor-cell"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const minutes = rangeStart + (e.clientY - rect.top) / PX_PER_MIN;
            const start = Math.min(
              Math.max(Math.floor(minutes / SNAP) * SNAP, 0),
              DAY_MINUTES - 60,
            );
            onCreateAt(start, start + 60);
          }}
          aria-hidden
        />
        {/* Free-time hints: a quiet pill at the start of each open window. */}
        {gaps.map((g) => (
          <button
            key={g.startMin}
            type="button"
            onClick={() => onCreateAt(g.startMin, Math.min(g.startMin + 60, g.endMin))}
            aria-label={`Free ${formatDuration(g.endMin - g.startMin)} from ${formatMinutes(g.startMin)}. Add a block`}
            className="group absolute left-0 flex h-7 items-center gap-1.5 rounded-full border border-dashed border-sage/60 bg-surface px-3 text-xs text-muted-foreground transition-colors hover:bg-sage-soft hover:text-forest"
            style={{ top: top(g.startMin) + 4 }}
          >
            <Plus className="size-3" />
            Free · {formatDuration(g.endMin - g.startMin)}
          </button>
        ))}

        {blocks.map((b) => {
          const live =
            drag?.id === b.id ? preview(drag, b) : { start: b.startMin, end: b.endMin };
          const phase = blockPhase(b, nowMin ?? -1);
          const conflicting =
            findOverlaps({ id: b.id, startMin: live.start, endMin: live.end }, blocks)
              .length > 0;
          const h = (live.end - live.start) * PX_PER_MIN;
          return (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              aria-label={`${b.title}, ${formatMinutes(live.start)} to ${formatMinutes(live.end)}. Press Enter to edit.`}
              onKeyDown={(e) => e.key === "Enter" && onEdit(b)}
              onPointerDown={(e) => begin(e, b, "move")}
              onPointerMove={move}
              onPointerUp={() => finish(b)}
              className={cn(
                "absolute inset-x-0 cursor-grab touch-none overflow-hidden rounded-xl border px-3 py-1.5 text-left shadow-[var(--shadow-sm)] transition-[box-shadow,background-color] duration-200 outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/60",
                phase === "past" && "border-border bg-muted/80 text-muted-foreground",
                phase === "current" &&
                  "border-forest bg-forest text-primary-foreground shadow-[var(--shadow-md)]",
                phase === "upcoming" && "border-sage/60 bg-sage-soft",
                conflicting && "ring-2 ring-terracotta",
                drag?.id === b.id && "z-20 cursor-grabbing shadow-[var(--shadow-lg)]",
              )}
              style={{ top: top(live.start), height: Math.max(h - 2, 22) }}
            >
              <p className="flex items-center gap-1.5 truncate text-sm leading-tight font-medium">
                {b.taskId && (
                  <Link2
                    className="size-3 shrink-0 opacity-70"
                    aria-label="Linked to a task"
                  />
                )}
                {b.title}
              </p>
              {h > 40 && (
                <p className="mt-0.5 text-xs tabular-nums opacity-75">
                  {formatMinutes(live.start)} – {formatMinutes(live.end)} ·{" "}
                  {formatDuration(live.end - live.start)}
                </p>
              )}
              <div
                onPointerDown={(e) => begin(e, b, "resize")}
                onPointerMove={move}
                onPointerUp={() => finish(b)}
                aria-hidden
                className="absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize items-end justify-center pb-0.5"
              >
                <span className="h-0.5 w-8 rounded-full bg-current opacity-30" />
              </div>
            </div>
          );
        })}

        {nowMin !== null && nowMin >= rangeStart && nowMin <= rangeEnd && (
          <div
            className="pointer-events-none absolute inset-x-0 z-30"
            style={{ top: top(nowMin) }}
            aria-hidden
          >
            <div className="relative h-px bg-terracotta">
              <span className="absolute -left-1 size-2 -translate-y-1/2 rounded-full bg-terracotta" />
              <span className="absolute -top-2.5 -left-14 rounded-md bg-terracotta px-1.5 py-0.5 text-[0.65rem] font-medium text-primary-foreground tabular-nums md:-left-[4.5rem]">
                {formatMinutes(nowMin)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function preview(s: DragState, b: TimeBlock) {
  if (s.mode === "move") {
    const len = b.endMin - b.startMin;
    const start = Math.min(Math.max(s.start + s.delta, 0), DAY_MINUTES - len);
    return { start, end: start + len };
  }
  const end = Math.min(Math.max(s.end + s.delta, b.startMin + SNAP), DAY_MINUTES);
  return { start: b.startMin, end };
}
