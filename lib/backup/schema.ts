import { z } from "zod";

/** Backup file format. Bump `BACKUP_VERSION` with a migration when it changes. */
export const BACKUP_VERSION = 1;

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^\d{2}:\d{2}$/);
const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");
const id = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);
const tags = z.array(z.string().max(60)).max(30).default([]);
const text = (max: number) => z.string().max(max);
const httpUrl = z
  .string()
  .max(2048)
  .refine((u) => /^https?:\/\//i.test(u), "Must be an http(s) link");

export const taskSchema = z.object({
  id,
  title: text(200).min(1),
  description: text(2000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "done", "archived"]),
  dueDate: day.optional(),
  dueTime: time.optional(),
  estimateMinutes: z.number().int().positive().max(1440).optional(),
  tags,
  notes: text(5000).optional(),
  subtasks: z
    .array(z.object({ id: z.string(), title: text(200), done: z.boolean() }))
    .max(100)
    .default([]),
  completedAt: iso.nullish(),
});

export const timeBlockSchema = z
  .object({
    id,
    title: text(120).min(1),
    date: day,
    startMin: z.number().int().min(0).max(1439),
    endMin: z.number().int().min(1).max(1440),
    notes: text(2000).optional(),
    taskId: z.string().optional(),
  })
  .refine((b) => b.endMin > b.startMin, "End must be after start");

export const reminderSchema = z.object({
  id,
  title: text(200).min(1),
  note: text(1000).optional(),
  scheduledAt: iso,
  status: z.enum(["pending", "completed", "dismissed"]),
  notify: z.boolean().default(true),
  timeZone: z.string().max(64).default("UTC"),
  taskId: z.string().optional(),
  blockId: z.string().optional(),
});

export const journalSchema = z.object({
  id,
  title: text(160).optional(),
  date: day,
  body: text(200_000),
  mood: z.number().int().min(1).max(5).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  focus: z.number().int().min(1).max(5).optional(),
});

export const ideaSchema = z.object({
  id,
  title: text(300).min(1),
  body: text(10_000).optional(),
  status: z.enum(["inbox", "exploring", "planned", "in_progress", "done", "archived"]),
  tags,
});

export const resourceSchema = z.object({
  id,
  url: httpUrl,
  title: text(300).min(1),
  source: text(100).optional(),
  notes: text(10_000).optional(),
  tags,
  collection: text(100).optional(),
  status: z.enum(["unread", "in_progress", "done"]),
});

export const learningSchema = z.object({
  id,
  category: text(100).min(1),
  title: text(300).min(1),
  notes: text(50_000).optional(),
  status: z.enum(["learning", "reviewing", "mastered"]),
  tags,
  nextReviewDate: day.optional(),
  minutesStudied: z.number().int().min(0).default(0),
});

export const planSchema = z.object({
  id,
  kind: z.enum(["goal", "plan", "someday", "trip"]),
  title: text(300).min(1),
  status: z.enum(["considering", "planned", "active", "completed", "canceled"]),
  targetDate: day.optional(),
  notes: text(20_000).optional(),
  destination: text(200).optional(),
  budgetNotes: text(5000).optional(),
  links: z.array(httpUrl).max(20).default([]),
});

export const routineSchema = z.object({
  id,
  title: text(200).min(1),
  frequency: z.enum(["daily", "weekly"]),
  days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  marks: z.record(day, z.enum(["done", "skipped", "rest"])).default({}),
  archived: z.boolean().default(false),
});

export const backupSchema = z.object({
  app: z.literal("kyntra"),
  version: z.number().int().min(1).max(BACKUP_VERSION),
  exportedAt: iso,
  collections: z.object({
    tasks: z.array(taskSchema).default([]),
    timeBlocks: z.array(timeBlockSchema).default([]),
    reminders: z.array(reminderSchema).default([]),
    journalEntries: z.array(journalSchema).default([]),
    ideas: z.array(ideaSchema).default([]),
    savedResources: z.array(resourceSchema).default([]),
    learningItems: z.array(learningSchema).default([]),
    plans: z.array(planSchema).default([]),
    routines: z.array(routineSchema).default([]),
  }),
});

export type Backup = z.infer<typeof backupSchema>;
export type BackupCollections = Backup["collections"];

export function parseBackup(
  raw: string,
): { ok: true; backup: Backup } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  const result = backupSchema.safeParse(json);
  if (result.success) return { ok: true, backup: result.data };
  const issue = result.error.issues[0];
  return {
    ok: false,
    error: `Not a valid Kyntra backup (${issue.path.join(".") || "root"}: ${issue.message}).`,
  };
}
