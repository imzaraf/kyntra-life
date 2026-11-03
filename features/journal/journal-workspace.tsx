"use client";

import { format } from "date-fns";
import { ArrowLeft, BookOpenText, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorNotice, ListSkeleton } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fromDayKey, todayKey } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import { JournalEditor } from "./journal-editor";
import { MonthCalendar } from "./month-calendar";
import { useJournalActions, useJournalEntries } from "./use-journal";

export function JournalWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const entries = useJournalEntries();
  const actions = useJournalActions();
  const today = todayKey();

  const selectedId = params.get("entry");
  const isFresh = params.get("fresh") === "1";
  const [query, setQuery] = useState("");
  const [day, setDay] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const marked = useMemo(() => new Set(entries.data.map((e) => e.date)), [entries.data]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.data.filter(
      (e) =>
        (!day || e.date === day) &&
        (!q || `${e.title ?? ""} ${e.body}`.toLowerCase().includes(q)),
    );
  }, [entries.data, query, day]);

  const selected = entries.data.find((e) => e.id === selectedId);
  const editing = !!selectedId && (!!selected || isFresh);

  const open = (id: string) => router.replace(`/journal?entry=${id}`, { scroll: false });
  const startNew = () =>
    router.replace(`/journal?entry=${actions.newId()}&fresh=1`, { scroll: false });
  const close = () => router.replace("/journal", { scroll: false });

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className={cn("space-y-4", editing && "hidden lg:block")}>
        <Button onClick={startNew} className="w-full" size="lg">
          <Plus /> Write today&apos;s entry
        </Button>
        <MonthCalendar selected={day} marked={marked} today={today} onSelect={setDay} />
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search journal"
            placeholder="Search entries"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {entries.error ? (
          <ErrorNotice error={entries.error} />
        ) : entries.loading ? (
          <ListSkeleton rows={3} />
        ) : visible.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            {entries.data.length === 0
              ? "Your entries will gather here."
              : "No entries match."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {visible.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => open(e.id)}
                  aria-current={e.id === selectedId}
                  className={cn(
                    "w-full rounded-xl px-3.5 py-3 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50",
                    e.id === selectedId && "bg-surface-raised shadow-[var(--shadow-sm)]",
                  )}
                >
                  <span className="eyebrow">
                    {format(fromDayKey(e.date), "EEE, MMM d, yyyy")}
                  </span>
                  <span className="mt-1 block truncate font-serif text-lg">
                    {e.title || "Untitled"}
                  </span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {e.body.replace(/[#*>`_-]/g, "").slice(0, 140)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className={cn("min-w-0", !editing && "hidden lg:block")}>
        {editing && selectedId ? (
          <>
            <Button variant="ghost" size="sm" className="mb-3 lg:hidden" onClick={close}>
              <ArrowLeft /> All entries
            </Button>
            <JournalEditor
              key={selectedId}
              id={selectedId}
              entry={selected}
              initialDate={day ?? today}
              onDelete={setDeleting}
            />
          </>
        ) : (
          <EmptyState
            icon={BookOpenText}
            title="A page, waiting"
            description="Choose an entry to read, or begin a new one. Everything saves as you write."
            action={
              <Button onClick={startNew}>
                <Plus /> New entry
              </Button>
            }
          />
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this entry?"
        description="This journal entry will be permanently removed."
        onConfirm={() => {
          if (deleting) {
            void actions.remove(deleting);
            close();
          }
        }}
      />
    </div>
  );
}
