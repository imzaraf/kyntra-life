"use client";

import { format } from "date-fns";
import { CalendarArrowDown, Archive, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fromDayKey,
  formatDuration,
  timeInputToMinutes,
  formatMinutes,
} from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/domain";
import { dueState } from "./task-logic";

const PRIORITY_DOT: Record<Task["priority"], string> = {
  high: "bg-terracotta",
  medium: "bg-gold",
  low: "bg-sage",
};

export function TaskRow({
  task,
  todayKey,
  onToggle,
  onEdit,
  onPostpone,
  onArchive,
  onDelete,
  highlighted,
}: {
  task: Task;
  todayKey: string;
  onToggle: () => void;
  onEdit: () => void;
  onPostpone: () => void;
  onArchive: () => void;
  onDelete: () => void;
  highlighted?: boolean;
}) {
  const state = dueState(task, todayKey);
  const done = task.status === "done";
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <li
      id={`task-${task.id}`}
      className={cn(
        "paper hover-lift group flex items-start gap-3.5 p-4",
        highlighted && "ring-2 ring-terracotta/60",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={onToggle}
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          done
            ? "border-forest bg-forest text-primary-foreground"
            : "border-input hover:border-forest",
        )}
      >
        {done && (
          <svg
            viewBox="0 0 12 12"
            className="size-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M2.5 6.5l2.2 2.2L9.5 3.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
            title={`${task.priority} priority`}
          />
          <p
            className={cn(
              "truncate text-[0.95rem] font-medium",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {task.dueDate && (
            <span
              className={cn(
                state === "overdue" && "font-medium text-destructive",
                state === "today" && "font-medium text-terracotta",
              )}
            >
              {state === "overdue" ? "Overdue · " : state === "today" ? "Today · " : ""}
              {format(fromDayKey(task.dueDate), "EEE, MMM d")}
              {task.dueTime &&
                ` · ${formatMinutes(timeInputToMinutes(task.dueTime) ?? 0)}`}
            </span>
          )}
          {task.estimateMinutes && <span>{formatDuration(task.estimateMinutes)}</span>}
          {task.subtasks.length > 0 && (
            <span>
              {subDone}/{task.subtasks.length} subtasks
            </span>
          )}
          {task.tags.map((t) => (
            <Badge key={t} variant="secondary" className="rounded-md font-normal">
              #{t}
            </Badge>
          ))}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${task.title}`}
            className="opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil /> Edit
          </DropdownMenuItem>
          {!done && (
            <DropdownMenuItem onSelect={onPostpone}>
              <CalendarArrowDown /> Postpone a day
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={onArchive}>
            <Archive /> Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
