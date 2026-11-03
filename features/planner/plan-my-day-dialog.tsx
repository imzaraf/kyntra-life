"use client";

import { ResponsiveDialog, SheetFooter } from "@/components/shared/responsive-dialog";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration, formatMinutes } from "@/lib/date-time";
import type { Proposal } from "./planner-logic";

export function PlanMyDayDialog({
  open,
  onOpenChange,
  proposals,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  proposals: Proposal[];
  onAccept: () => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Plan my day"
      description="Tasks due today, placed into your free time — highest priority first. Nothing is saved until you accept."
      size="md"
    >
      {proposals.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          There&apos;s nothing to schedule: either no unscheduled tasks are due today, or
          there&apos;s no free time left.
        </p>
      ) : (
        <ul className="space-y-2">
          {proposals.map((p) => (
            <li
              key={p.task.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-sage-soft/60 px-3.5 py-2.5 text-sm"
            >
              <span className="truncate font-medium">{p.task.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatMinutes(p.startMin)} · {formatDuration(p.endMin - p.startMin)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <SheetFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Not now
        </Button>
        <Button
          disabled={proposals.length === 0}
          onClick={() => {
            onAccept();
            onOpenChange(false);
          }}
        >
          <Sparkles /> Add {proposals.length || ""}{" "}
          {proposals.length === 1 ? "block" : "blocks"}
        </Button>
      </SheetFooter>
    </ResponsiveDialog>
  );
}
