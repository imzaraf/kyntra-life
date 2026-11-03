import { format } from "date-fns";
import { getFirebase } from "@/lib/firebase/client";
import {
  ideaRepo,
  journalRepo,
  learningRepo,
  planRepo,
  reminderRepo,
  resourceRepo,
  routineRepo,
  taskRepo,
  timeBlockRepo,
} from "@/lib/repositories";
import { BACKUP_VERSION, type Backup } from "./schema";
import { doc, writeBatch, collection } from "firebase/firestore";
import { SCHEMA_VERSION } from "@/types/domain";
import { serverTimestamp, Timestamp } from "firebase/firestore";

const toIso = (v: unknown) => (v instanceof Date ? v.toISOString() : v);

/** Drop server-owned and bookkeeping fields; serialise dates. */
function clean(
  item: Record<string, unknown>,
  drop: string[] = [],
): Record<string, unknown> {
  const skip = new Set([
    "createdAt",
    "updatedAt",
    "schemaVersion",
    "delivery",
    "notifyPending",
    ...drop,
  ]);
  return Object.fromEntries(
    Object.entries(item)
      .filter(([k, v]) => !skip.has(k) && v !== undefined && v !== null)
      .map(([k, v]) => [k, toIso(v)]),
  );
}

export async function buildBackup(uid: string): Promise<Backup> {
  const [
    tasks,
    timeBlocks,
    reminders,
    journalEntries,
    ideas,
    savedResources,
    learningItems,
    plans,
    routines,
  ] = await Promise.all([
    taskRepo.list(uid),
    timeBlockRepo.list(uid),
    reminderRepo.list(uid),
    journalRepo.list(uid),
    ideaRepo.list(uid),
    resourceRepo.list(uid),
    learningRepo.list(uid),
    planRepo.list(uid),
    routineRepo.list(uid),
  ]);
  const c = (list: object[]) => list.map((i) => clean(i as Record<string, unknown>));
  return {
    app: "kyntra",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    collections: {
      tasks: c(tasks),
      timeBlocks: c(timeBlocks),
      reminders: c(reminders),
      journalEntries: c(journalEntries),
      ideas: c(ideas),
      savedResources: c(savedResources),
      learningItems: c(learningItems),
      plans: c(plans),
      routines: c(routines),
    },
  } as unknown as Backup;
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const backupFilename = () =>
  `kyntra-backup-${format(new Date(), "yyyy-MM-dd")}.json`;

/** Journal + learning notes as Markdown with front matter. */
export async function buildMarkdownExport(uid: string): Promise<string> {
  const [journal, learning] = await Promise.all([
    journalRepo.list(uid),
    learningRepo.list(uid),
  ]);
  const entries = [...journal]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (e) =>
        `---\ndate: ${e.date}\ntitle: ${JSON.stringify(e.title ?? "")}\n${e.mood ? `mood: ${e.mood}\n` : ""}---\n\n${e.title ? `# ${e.title}\n\n` : ""}${e.body}\n`,
    );
  const notes = learning.map(
    (l) =>
      `---\ncategory: ${JSON.stringify(l.category)}\nstatus: ${l.status}\n---\n\n# ${l.title}\n\n${l.notes ?? ""}\n`,
  );
  return `# Kyntra export — ${format(new Date(), "PPP")}\n\n## Journal\n\n${entries.join("\n\n")}\n\n## Learning notes\n\n${notes.join("\n\n")}`;
}

const DATE_FIELDS = new Set(["scheduledAt", "completedAt"]);

/**
 * Import is additive and idempotent: documents are written under their original
 * ids, so re-importing the same file never duplicates. Existing documents with
 * the same id are overwritten. Chunked to stay under Firestore's batch limit.
 */
export async function importBackup(uid: string, backup: Backup): Promise<number> {
  const { db } = getFirebase();
  const ops: { path: string; id: string; data: Record<string, unknown> }[] = [];
  for (const [name, items] of Object.entries(backup.collections)) {
    for (const item of items as Record<string, unknown>[]) {
      const { id, ...rest } = item;
      const data: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (v === undefined || v === null) continue;
        data[k] =
          DATE_FIELDS.has(k) && typeof v === "string"
            ? Timestamp.fromDate(new Date(v))
            : v;
      }
      if (name === "reminders") data.notifyPending = false; // never replay old pushes
      ops.push({ path: name, id: String(id), data });
    }
  }
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) {
      batch.set(doc(collection(db, "users", uid, op.path), op.id), {
        ...op.data,
        schemaVersion: SCHEMA_VERSION,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
  return ops.length;
}
