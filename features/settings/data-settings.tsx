"use client";

import { Download, FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import {
  backupFilename,
  buildBackup,
  buildMarkdownExport,
  download,
  importBackup,
} from "@/lib/backup/backup-service";
import { parseBackup, type Backup } from "@/lib/backup/schema";

export function DataSettings() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<{ backup: Backup; count: number } | null>(null);

  const run = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    try {
      await fn();
    } catch (error) {
      console.error(error);
      toast.error("That didn't work. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const exportJson = () =>
    run("json", async () => {
      if (!user) return;
      download(
        backupFilename(),
        JSON.stringify(await buildBackup(user.uid), null, 2),
        "application/json",
      );
      toast.success("Backup downloaded");
    });

  const exportMd = () =>
    run("md", async () => {
      if (!user) return;
      download("kyntra-notes.md", await buildMarkdownExport(user.uid), "text/markdown");
      toast.success("Markdown downloaded");
    });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024)
      return void toast.error("That file is too large to be a Kyntra backup.");
    const result = parseBackup(await file.text());
    if (!result.ok) return void toast.error(result.error);
    const count = Object.values(result.backup.collections).reduce(
      (n, list) => n + list.length,
      0,
    );
    setPending({ backup: result.backup, count });
    if (fileRef.current) fileRef.current.value = "";
  };

  const confirmImport = () =>
    run("import", async () => {
      if (!user || !pending) return;
      const n = await importBackup(user.uid, pending.backup);
      toast.success(`Imported ${n} items`);
      setPending(null);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportJson} disabled={!!busy}>
          <Download /> Download backup (JSON)
        </Button>
        <Button variant="outline" onClick={exportMd} disabled={!!busy}>
          <FileText /> Export journal &amp; notes (Markdown)
        </Button>
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={!!busy}
        >
          <Upload /> Import backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Choose backup file"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      {pending && (
        <div
          role="alertdialog"
          aria-label="Confirm import"
          className="rounded-2xl bg-sage-soft/60 p-4 text-sm"
        >
          <p className="font-medium">Ready to import {pending.count} items.</p>
          <p className="mt-1 text-muted-foreground">
            Items are added under their original ids. Re-importing the same file
            won&apos;t create duplicates, but will overwrite items with matching ids. Past
            reminders won&apos;t send notifications.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={confirmImport} disabled={busy === "import"}>
              Import
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Your data is yours. Backups are plain JSON; Markdown export includes journal
        entries and learning notes. Exports cover up to 500 items per collection.
      </p>
    </div>
  );
}
