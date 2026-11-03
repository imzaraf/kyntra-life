"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fromDayKey, toDayKey } from "@/lib/date-time";
import { cn } from "@/lib/utils";

export function MonthCalendar({
  selected,
  marked,
  today,
  onSelect,
}: {
  selected: string | null;
  marked: Set<string>;
  today: string;
  onSelect: (dayKey: string | null) => void;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(fromDayKey(selected ?? today)));
  const days = eachDayOfInterval({
    start: startOfWeek(cursor, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });

  return (
    <div className="paper p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg">{format(cursor, "MMMM yyyy")}</h3>
        <div className="flex">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setCursor(addMonths(cursor, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[0.65rem] tracking-wider text-muted-foreground uppercase">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const key = toDayKey(d);
          const isSel = key === selected;
          return (
            <button
              key={key}
              type="button"
              aria-label={
                format(d, "EEEE, MMMM d") + (marked.has(key) ? ", has entries" : "")
              }
              aria-pressed={isSel}
              onClick={() => onSelect(isSel ? null : key)}
              className={cn(
                "relative mx-auto grid size-9 place-items-center rounded-full text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                !isSameMonth(d, cursor) && "text-muted-foreground/40",
                key === today && !isSel && "font-semibold text-terracotta",
                isSel ? "bg-forest text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {d.getDate()}
              {marked.has(key) && (
                <span
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    isSel ? "bg-primary-foreground" : "bg-terracotta",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
