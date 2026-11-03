"use client";

import { format } from "date-fns";
import { GraduationCap, Pencil, Plus, Search, Timer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorNotice, ListSkeleton } from "@/components/shared/empty-state";
import {
  RecordDialog,
  type FieldDef,
  type Values,
} from "@/components/shared/record-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { formatDuration, fromDayKey, todayKey } from "@/lib/date-time";
import { learningRepo } from "@/lib/repositories";
import type { LearningItem, LearningStatus } from "@/types/domain";

const STATUS: LearningStatus[] = ["learning", "reviewing", "mastered"];

export function LearningPanel() {
  const items = useRepoQuery(learningRepo, () => [], "all");
  const actions = useCollectionActions(learningRepo, "the learning note");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LearningItem | null>(null);
  const [deleting, setDeleting] = useState<LearningItem | null>(null);
  const [query, setQuery] = useState("");
  const today = todayKey();

  const fields: FieldDef[] = [
    {
      name: "category",
      label: "Topic / category",
      type: "text",
      required: true,
      placeholder: "TypeScript, System design, English vocabulary…",
    },
    { name: "title", label: "Title", type: "text", required: true },
    {
      name: "status",
      label: "Progress",
      type: "select",
      options: STATUS.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
    },
    { name: "nextReviewDate", label: "Next review", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
    { name: "tags", label: "Tags", type: "tags" },
  ];
  const toValues = (i?: LearningItem | null): Values => ({
    category: i?.category ?? "",
    title: i?.title ?? "",
    status: i?.status ?? "learning",
    nextReviewDate: i?.nextReviewDate ?? "",
    notes: i?.notes ?? "",
    tags: i?.tags ?? [],
  });
  const fromValues = (v: Values) => ({
    category: String(v.category).trim(),
    title: String(v.title).trim(),
    status: v.status as LearningStatus,
    nextReviewDate: String(v.nextReviewDate) || undefined,
    notes: String(v.notes).trim() || undefined,
    tags: v.tags as string[],
  });

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.data.filter(
      (i) =>
        !q ||
        `${i.title} ${i.category} ${i.notes ?? ""} ${i.tags.join(" ")}`
          .toLowerCase()
          .includes(q),
    );
    const map = new Map<string, LearningItem[]>();
    for (const i of filtered) map.set(i.category, [...(map.get(i.category) ?? []), i]);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items.data, query]);

  return (
    <section aria-label="Learning center" className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search learning"
            placeholder="Search topics and notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus /> New learning note
        </Button>
      </div>
      {items.error ? (
        <ErrorNotice error={items.error} />
      ) : items.loading ? (
        <ListSkeleton rows={3} />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Start a topic"
          description="Create categories like React, System Design or English, then add notes, sessions and review dates."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Add a note
            </Button>
          }
        />
      ) : (
        grouped.map(([category, list]) => (
          <div key={category} className="space-y-2.5">
            <h3 className="font-serif text-xl">
              {category}{" "}
              <span className="font-sans text-sm text-muted-foreground">
                {list.length}
              </span>
            </h3>
            <ul className="space-y-2.5">
              {list.map((i) => {
                const due =
                  i.nextReviewDate &&
                  i.nextReviewDate <= today &&
                  i.status !== "mastered";
                return (
                  <li
                    key={i.id}
                    className="paper hover-lift flex flex-wrap items-center gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium">
                        {i.title} <StatusBadge label={i.status} />
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        {i.minutesStudied > 0 && (
                          <span>{formatDuration(i.minutesStudied)} studied</span>
                        )}
                        {i.nextReviewDate && (
                          <span className={due ? "font-medium text-terracotta" : ""}>
                            {due ? "Review due · " : "Review "}
                            {format(fromDayKey(i.nextReviewDate), "MMM d")}
                          </span>
                        )}
                        {i.tags.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="rounded-md font-normal"
                          >
                            #{t}
                          </Badge>
                        ))}
                      </p>
                      {i.notes && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                          {i.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void actions.update(i.id, {
                          minutesStudied: i.minutesStudied + 15,
                        })
                      }
                    >
                      <Timer /> +15 min
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${i.title}`}
                      onClick={() => setEditing(i)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${i.title}`}
                      onClick={() => setDeleting(i)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
      <RecordDialog
        open={creating}
        onOpenChange={setCreating}
        title="New learning note"
        fields={fields}
        initial={toValues()}
        onSubmit={(v) => void actions.create({ ...fromValues(v), minutesStudied: 0 })}
      />
      <RecordDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit learning note"
        fields={fields}
        initial={toValues(editing)}
        onSubmit={(v) => editing && void actions.update(editing.id, fromValues(v))}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this note?"
        description={`“${deleting?.title ?? ""}” will be permanently removed.`}
        onConfirm={() => deleting && void actions.remove(deleting.id)}
      />
    </section>
  );
}
