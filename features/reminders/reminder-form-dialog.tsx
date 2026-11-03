"use client";

import { ResponsiveDialog, SheetFooter } from "@/components/shared/responsive-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Reminder, Task } from "@/types/domain";
import { presetTime, type Preset } from "./reminder-logic";
import type { ReminderInput } from "./use-reminders";

const LOCAL_FMT = "yyyy-MM-dd'T'HH:mm";

const schema = z.object({
  title: z.string().trim().min(1, "What should we remind you about?").max(200),
  note: z.string().max(1000),
  when: z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Pick a date and time."),
  notify: z.boolean(),
  taskId: z.string(),
});
type Values = z.infer<typeof schema>;

const PRESETS: { key: Preset; label: string }[] = [
  { key: "later_today", label: "Later today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "next_week", label: "Next week" },
];

export function ReminderFormDialog({
  open,
  onOpenChange,
  reminder,
  defaults,
  tasks,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reminder?: Reminder | null;
  defaults?: Partial<{ title: string; when: Date }>;
  tasks: Task[];
  onSubmit: (input: ReminderInput) => void;
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={reminder ? "Edit reminder" : "New reminder"}
      size="md"
    >
      <ReminderForm
        reminder={reminder}
        defaults={defaults}
        tasks={tasks}
        onSubmit={onSubmit}
        onClose={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
}

function ReminderForm({
  reminder,
  defaults,
  tasks,
  onSubmit,
  onClose,
}: {
  reminder?: Reminder | null;
  defaults?: Partial<{ title: string; when: Date }>;
  tasks: Task[];
  onSubmit: (input: ReminderInput) => void;
  onClose: () => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: reminder?.title ?? defaults?.title ?? "",
      note: reminder?.note ?? "",
      when: format(
        reminder?.scheduledAt ?? defaults?.when ?? presetTime("later_today", new Date()),
        LOCAL_FMT,
      ),
      notify: reminder?.notify ?? true,
      taskId: reminder?.taskId ?? "",
    },
  });
  const { errors } = form.formState;

  const submit = form.handleSubmit((v) => {
    onSubmit({
      title: v.title.trim(),
      note: v.note.trim() || undefined,
      scheduledAt: new Date(v.when),
      notify: v.notify,
      taskId: v.taskId || undefined,
    });
    onClose();
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormField label="Remind me to" htmlFor="rem-title" error={errors.title?.message}>
        <Input id="rem-title" autoFocus {...form.register("title")} />
      </FormField>
      <FormField label="Note" htmlFor="rem-note">
        <Textarea id="rem-note" rows={2} {...form.register("note")} />
      </FormField>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                form.setValue("when", format(presetTime(p.key, new Date()), LOCAL_FMT), {
                  shouldValidate: true,
                })
              }
            >
              {p.label}
            </Button>
          ))}
        </div>
        <FormField label="Date & time" htmlFor="rem-when" error={errors.when?.message}>
          <Input id="rem-when" type="datetime-local" {...form.register("when")} />
        </FormField>
      </div>
      <FormField label="Linked task" htmlFor="rem-task">
        <NativeSelect id="rem-task" {...form.register("taskId")}>
          <option value="">None</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <Controller
        control={form.control}
        name="notify"
        render={({ field }) => (
          <label className="flex items-center justify-between gap-4 rounded-xl bg-muted/60 p-3.5 text-sm">
            <span>
              <span className="block font-medium">Send a push notification</span>
              <span className="block text-xs text-muted-foreground">
                Needs notifications enabled in Settings. In-app alerts always work.
              </span>
            </span>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </label>
        )}
      />
      <SheetFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{reminder ? "Save changes" : "Set reminder"}</Button>
      </SheetFooter>
    </form>
  );
}
