"use client";

import { ResponsiveDialog, SheetFooter } from "@/components/shared/responsive-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/shared/form-field";
import { TagInput } from "@/components/shared/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Priority, Task } from "@/types/domain";
import type { TaskInput } from "./use-task-actions";

const schema = z.object({
  title: z.string().trim().min(1, "Give your task a title.").max(200),
  description: z.string().max(2000),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string(),
  dueTime: z.string(),
  estimate: z
    .string()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 1440),
      "Enter minutes, e.g. 45",
    ),
  tags: z.array(z.string()),
  notes: z.string().max(5000),
  subtasks: z.array(z.object({ id: z.string(), title: z.string(), done: z.boolean() })),
});
type Values = z.infer<typeof schema>;

const toValues = (t?: Task | null, defaults?: Partial<Values>): Values => ({
  title: t?.title ?? "",
  description: t?.description ?? "",
  priority: t?.priority ?? "medium",
  dueDate: t?.dueDate ?? "",
  dueTime: t?.dueTime ?? "",
  estimate: t?.estimateMinutes ? String(t.estimateMinutes) : "",
  tags: t?.tags ?? [],
  notes: t?.notes ?? "",
  subtasks: t?.subtasks ?? [],
  ...defaults,
});

export function toTaskInput(v: Values, status: Task["status"] = "todo"): TaskInput {
  return {
    title: v.title.trim(),
    description: v.description.trim() || undefined,
    priority: v.priority as Priority,
    status,
    dueDate: v.dueDate || undefined,
    dueTime: v.dueDate && v.dueTime ? v.dueTime : undefined,
    estimateMinutes: v.estimate ? Number(v.estimate) : undefined,
    tags: v.tags,
    notes: v.notes.trim() || undefined,
    subtasks: v.subtasks
      .filter((s) => s.title.trim())
      .map((s) => ({ ...s, title: s.title.trim() })),
  };
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaults,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaults?: Partial<Values>;
  onSubmit: (input: TaskInput) => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      size="lg"
    >
      {/* Mounted only while open, so the form always starts from fresh defaults. */}
      <TaskForm
        task={task}
        defaults={defaults}
        onSubmit={onSubmit}
        onClose={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
}

function TaskForm({
  task,
  defaults,
  onSubmit,
  onClose,
}: {
  task?: Task | null;
  defaults?: Partial<Values>;
  onSubmit: (input: TaskInput) => void;
  onClose: () => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(task, defaults),
  });
  const subtasks = useFieldArray({ control: form.control, name: "subtasks" });
  const { errors } = form.formState;

  const submit = form.handleSubmit((v) => {
    onSubmit(toTaskInput(v, task?.status ?? "todo"));
    onClose();
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormField label="Title" htmlFor="task-title" error={errors.title?.message}>
        <Input
          id="task-title"
          autoFocus
          placeholder="What needs doing?"
          aria-invalid={!!errors.title}
          {...form.register("title")}
        />
      </FormField>
      <FormField label="Description" htmlFor="task-desc">
        <Textarea id="task-desc" rows={2} {...form.register("description")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Priority" htmlFor="task-priority">
          <NativeSelect id="task-priority" {...form.register("priority")}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </NativeSelect>
        </FormField>
        <FormField
          label="Estimate (minutes)"
          htmlFor="task-est"
          error={errors.estimate?.message}
        >
          <Input
            id="task-est"
            inputMode="numeric"
            placeholder="30"
            {...form.register("estimate")}
          />
        </FormField>
        <FormField label="Due date" htmlFor="task-date">
          <Input id="task-date" type="date" {...form.register("dueDate")} />
        </FormField>
        <FormField label="Due time" htmlFor="task-time">
          <Input id="task-time" type="time" {...form.register("dueTime")} />
        </FormField>
      </div>
      <FormField label="Tags" htmlFor="task-tags">
        <Controller
          control={form.control}
          name="tags"
          render={({ field }) => (
            <TagInput id="task-tags" value={field.value} onChange={field.onChange} />
          )}
        />
      </FormField>
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground">
          Subtasks
        </legend>
        {subtasks.fields.map((f, i) => (
          <div key={f.id} className="flex items-center gap-2">
            <Input
              aria-label={`Subtask ${i + 1}`}
              {...form.register(`subtasks.${i}.title`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove subtask"
              onClick={() => subtasks.remove(i)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            subtasks.append({ id: crypto.randomUUID(), title: "", done: false })
          }
        >
          <Plus /> Add subtask
        </Button>
      </fieldset>
      <FormField label="Notes" htmlFor="task-notes">
        <Textarea id="task-notes" rows={3} {...form.register("notes")} />
      </FormField>
      <SheetFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{task ? "Save changes" : "Add task"}</Button>
      </SheetFooter>
    </form>
  );
}
