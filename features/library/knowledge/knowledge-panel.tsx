"use client";

import { format } from "date-fns";
import { Bookmark, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorNotice, ListSkeleton } from "@/components/shared/empty-state";
import {
  RecordDialog,
  type FieldDef,
  type Values,
} from "@/components/shared/record-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { resourceRepo } from "@/lib/repositories";
import type { ResourceStatus, SavedResource } from "@/types/domain";

const STATUS: { value: ResourceStatus; label: string }[] = [
  { value: "unread", label: "To read / watch" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const FIELDS: FieldDef[] = [
  { name: "url", label: "Link", type: "url", required: true, placeholder: "https://" },
  {
    name: "title",
    label: "Title",
    type: "text",
    required: true,
    hint: "Entered by you — Kyntra doesn't scrape pages.",
  },
  {
    name: "source",
    label: "Source / platform",
    type: "text",
    placeholder: "Article, YouTube, X, docs…",
  },
  {
    name: "collection",
    label: "Collection",
    type: "text",
    placeholder: "e.g. System design",
  },
  { name: "status", label: "Status", type: "select", options: STATUS },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "tags", label: "Tags", type: "tags" },
];

export function KnowledgePanel() {
  const items = useRepoQuery(resourceRepo, () => [], "all");
  const actions = useCollectionActions(resourceRepo, "the resource");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SavedResource | null>(null);
  const [deleting, setDeleting] = useState<SavedResource | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ResourceStatus | "all">("all");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.data
      .filter((r) => status === "all" || r.status === status)
      .filter(
        (r) =>
          !q ||
          `${r.title} ${r.source ?? ""} ${r.collection ?? ""} ${r.notes ?? ""} ${r.tags.join(" ")}`
            .toLowerCase()
            .includes(q),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [items.data, query, status]);

  const toValues = (r?: SavedResource | null): Values => ({
    url: r?.url ?? "",
    title: r?.title ?? "",
    source: r?.source ?? "",
    collection: r?.collection ?? "",
    status: r?.status ?? "unread",
    notes: r?.notes ?? "",
    tags: r?.tags ?? [],
  });
  const fromValues = (v: Values) => ({
    url: String(v.url).trim(),
    title: String(v.title).trim(),
    source: String(v.source).trim() || undefined,
    collection: String(v.collection).trim() || undefined,
    status: v.status as ResourceStatus,
    notes: String(v.notes).trim() || undefined,
    tags: v.tags as string[],
  });

  return (
    <section aria-label="Knowledge vault" className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search saved resources"
            placeholder="Search your vault"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-40">
          <NativeSelect
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ResourceStatus | "all")}
          >
            <option value="all">All statuses</option>
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus /> Save a link
        </Button>
      </div>

      {items.error ? (
        <ErrorNotice error={items.error} />
      ) : items.loading ? (
        <ListSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Your vault is empty"
          description="Save articles, videos, posts and docs worth coming back to."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Save the first one
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => {
            let host = "";
            try {
              host = new URL(r.url).hostname.replace(/^www\./, "");
            } catch {
              host = "";
            }
            return (
              <li
                key={r.id}
                className="paper hover-lift flex flex-wrap items-center gap-3 p-4"
              >
                <div className="min-w-0 flex-[1_1_100%] sm:flex-1">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-1.5 truncate font-medium hover:underline"
                  >
                    {r.title}{" "}
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                  </a>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span>{r.source || host}</span>
                    {r.collection && <span>{r.collection}</span>}
                    <span>Saved {format(r.createdAt, "MMM d")}</span>
                    {r.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="rounded-md font-normal"
                      >
                        #{t}
                      </Badge>
                    ))}
                  </p>
                </div>
                <div className="w-40">
                  <NativeSelect
                    aria-label={`Status for ${r.title}`}
                    value={r.status}
                    onChange={(e) =>
                      void actions.update(r.id, {
                        status: e.target.value as ResourceStatus,
                      })
                    }
                    className="h-8 text-xs"
                  >
                    {STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${r.title}`}
                  onClick={() => setEditing(r)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${r.title}`}
                  onClick={() => setDeleting(r)}
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <RecordDialog
        open={creating}
        onOpenChange={setCreating}
        title="Save a link"
        fields={FIELDS}
        initial={toValues()}
        onSubmit={(v) => void actions.create(fromValues(v))}
      />
      <RecordDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit saved link"
        fields={FIELDS}
        initial={toValues(editing)}
        onSubmit={(v) => editing && void actions.update(editing.id, fromValues(v))}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Remove from vault?"
        description={`“${deleting?.title ?? ""}” will be permanently removed.`}
        onConfirm={() => deleting && void actions.remove(deleting.id)}
      />
    </section>
  );
}
