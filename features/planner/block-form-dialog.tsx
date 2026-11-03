"use client";

import { ResponsiveDialog, SheetFooter } from "@/components/shared/responsive-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  isValidDayKey,
  minutesToTimeInput,
  timeInputToMinutes,
  formatMinutes,
} from "@/lib/date-time";
import type { Task, TimeBlock } from "@/types/domain";
import { findOverlaps, validateBlockTimes } from "./planner-logic";
import { useDayBlocks, type BlockInput } from "./use-blocks";

const schema = z
  .object({
    title: z.string().trim().min(1, "Name this block.").max(120),
    date: z.string().refine(isValidDayKey, "Pick a date."),
    start: z.string().refine((v) => timeInputToMinutes(v) !== null, "Pick a start time."),
    end: z.string().refine((v) => timeInputToMinutes(v) !== null, "Pick an end time."),
    notes: z.string().max(2000),
    taskId: z.string(),
  })
  .superRefine((v, ctx) => {
    const s = timeInputToMinutes(v.start);
    const e = timeInputToMinutes(v.end);
    if (s === null || e === null) return;
    const res = validateBlockTimes(s, e === 0 ? 1440 : e);
    if (!res.ok) ctx.addIssue({ code: "custom", path: ["end"], message: res.error });
  });
type Values = z.infer<typeof schema>;

export interface BlockDraftInit {
  date: string;
  startMin: number;
  endMin: number;
  title?: string;
  taskId?: string;
}

export function BlockFormDialog({
  open,
  onOpenChange,
  block,
  init,
  tasks,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  block?: TimeBlock | null;
  init: BlockDraftInit;
  tasks: Task[];
  onSubmit: (input: BlockInput) => void;
  onDelete?: (block: TimeBlock) => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={block ? "Edit time block" : "New time block"}
      size="md"
    >
      <BlockForm
        block={block}
        init={init}
        tasks={tasks}
        onSubmit={onSubmit}
        onDelete={onDelete}
        onClose={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
}

function BlockForm({
  block,
  init,
  tasks,
  onSubmit,
  onDelete,
  onClose,
}: {
  block?: TimeBlock | null;
  init: BlockDraftInit;
  tasks: Task[];
  onSubmit: (input: BlockInput) => void;
  onDelete?: (block: TimeBlock) => void;
  onClose: () => void;
}) {
  const source = block ?? init;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: block?.title ?? init.title ?? "",
      date: source.date,
      start: minutesToTimeInput(source.startMin),
      end: minutesToTimeInput(source.endMin === 1440 ? 1439 : source.endMin),
      notes: block?.notes ?? "",
      taskId: block?.taskId ?? init.taskId ?? "",
    },
  });
  // The warning is "acknowledged" only for the exact times the user confirmed.
  const [ackKey, setAckKey] = useState<string | null>(null);
  const { errors } = form.formState;

  const [date, start, end] = useWatch({
    control: form.control,
    name: ["date", "start", "end"],
  });
  const dayBlocks = useDayBlocks(isValidDayKey(date) ? date : init.date);
  const s = timeInputToMinutes(start);
  const e = timeInputToMinutes(end);
  const conflicts =
    s !== null && e !== null && validateBlockTimes(s, e).ok
      ? findOverlaps({ id: block?.id, startMin: s, endMin: e }, dayBlocks.data)
      : [];
  const acknowledged = ackKey === `${date}|${start}|${end}`;

  const submit = form.handleSubmit((v) => {
    if (conflicts.length && !acknowledged) {
      setAckKey(`${v.date}|${v.start}|${v.end}`);
      return;
    }
    const startMin = timeInputToMinutes(v.start) ?? 0;
    const endMin = timeInputToMinutes(v.end) ?? 0;
    onSubmit({
      title: v.title.trim(),
      date: v.date,
      startMin,
      endMin: endMin === 0 ? 1440 : endMin,
      notes: v.notes.trim() || undefined,
      taskId: v.taskId || undefined,
    });
    onClose();
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormField label="Title" htmlFor="block-title" error={errors.title?.message}>
        <Input
          id="block-title"
          autoFocus
          placeholder="Deep work, gym, errands…"
          {...form.register("title")}
        />
      </FormField>
      <FormField label="Date" htmlFor="block-date" error={errors.date?.message}>
        <Input id="block-date" type="date" {...form.register("date")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Start" htmlFor="block-start" error={errors.start?.message}>
          <Input id="block-start" type="time" step={300} {...form.register("start")} />
        </FormField>
        <FormField label="End" htmlFor="block-end" error={errors.end?.message}>
          <Input id="block-end" type="time" step={300} {...form.register("end")} />
        </FormField>
      </div>
      <FormField label="Linked task" htmlFor="block-task">
        <NativeSelect id="block-task" {...form.register("taskId")}>
          <option value="">None</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label="Notes" htmlFor="block-notes">
        <Textarea id="block-notes" rows={2} {...form.register("notes")} />
      </FormField>

      {conflicts.length > 0 && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-xl bg-terracotta-soft p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-terracotta" />
          <div>
            <p className="font-medium">
              This overlaps{" "}
              {conflicts.length === 1 ? "another block" : `${conflicts.length} blocks`}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {conflicts
                .map(
                  (c) =>
                    `${c.title} (${formatMinutes(c.startMin)}–${formatMinutes(c.endMin)})`,
                )
                .join(", ")}
            </p>
            {acknowledged && (
              <p className="mt-1.5 font-medium">Press save again to keep the overlap.</p>
            )}
          </div>
        </div>
      )}

      <SheetFooter className="sm:justify-between">
        {block && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onDelete(block);
              onClose();
            }}
          >
            <Trash2 /> Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button type="submit">
            {conflicts.length && acknowledged
              ? "Save anyway"
              : block
                ? "Save"
                : "Add block"}
          </Button>
        </div>
      </SheetFooter>
    </form>
  );
}
