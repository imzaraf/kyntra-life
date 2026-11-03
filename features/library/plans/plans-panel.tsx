"use client";

import { format } from "date-fns";
import {
  Compass,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorNotice, ListSkeleton } from "@/components/shared/empty-state";
import {
  RecordDialog,
  type FieldDef,
  type Values,
} from "@/components/shared/record-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { fromDayKey } from "@/lib/date-time";
import { planRepo } from "@/lib/repositories";
import type { Plan, PlanKind, PlanStatus } from "@/types/domain";

const STATUSES: PlanStatus[] = [
  "considering",
  "planned",
  "active",
  "completed",
  "canceled",
];

const KIND_COPY: Record<
  "goals" | "trips",
  { noun: string; kinds: PlanKind[]; empty: string }
> = {
  goals: {
    noun: "goal or plan",
    kinds: ["goal", "plan", "someday"],
    empty: "Name something you're working toward — or something you might someday.",
  },
  trips: {
    noun: "trip",
    kinds: ["trip"],
    empty:
      "Sketch a destination, rough dates, an itinerary and a budget. No bookings required.",
  },
};

export function PlansPanel({ mode }: { mode: "goals" | "trips" }) {
  const copy = KIND_COPY[mode];
  const plans = useRepoQuery(planRepo, () => [], "all");
  const actions = useCollectionActions(planRepo, `the ${copy.noun}`);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);

  const items = useMemo(
    () =>
      plans.data
        .filter((p) => copy.kinds.includes(p.kind))
        .sort((a, b) => (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999")),
    [plans.data, copy.kinds],
  );

  const fields: FieldDef[] = [
    ...(mode === "goals"
      ? ([
          {
            name: "kind",
            label: "Type",
            type: "select",
            options: [
              { value: "goal", label: "Goal" },
              { value: "plan", label: "Tentative plan" },
              { value: "someday", label: "Someday / maybe" },
            ],
          },
        ] as FieldDef[])
      : []),
    {
      name: "title",
      label: mode === "trips" ? "Trip name" : "Title",
      type: "text",
      required: true,
    },
    ...(mode === "trips"
      ? ([{ name: "destination", label: "Destination", type: "text" }] as FieldDef[])
      : []),
    {
      name: "status",
      label: "Status",
      type: "select",
      options: STATUSES.map((s) => ({
        value: s,
        label: s[0].toUpperCase() + s.slice(1),
      })),
    },
    {
      name: "targetDate",
      label: mode === "trips" ? "Tentative date" : "Target date",
      type: "date",
    },
    {
      name: "notes",
      label: mode === "trips" ? "Itinerary notes" : "Notes",
      type: "textarea",
    },
    ...(mode === "trips"
      ? ([
          { name: "budgetNotes", label: "Budget notes", type: "textarea" },
          { name: "link", label: "Useful link", type: "url", placeholder: "https://" },
        ] as FieldDef[])
      : []),
  ];
  const toValues = (p?: Plan | null): Values => ({
    kind: p?.kind ?? copy.kinds[0],
    title: p?.title ?? "",
    destination: p?.destination ?? "",
    status: p?.status ?? "considering",
    targetDate: p?.targetDate ?? "",
    notes: p?.notes ?? "",
    budgetNotes: p?.budgetNotes ?? "",
    link: p?.links[0] ?? "",
  });
  const fromValues = (v: Values) => ({
    kind: v.kind as PlanKind,
    title: String(v.title).trim(),
    destination: String(v.destination || "").trim() || undefined,
    status: v.status as PlanStatus,
    targetDate: String(v.targetDate) || undefined,
    notes: String(v.notes).trim() || undefined,
    budgetNotes: String(v.budgetNotes || "").trim() || undefined,
    links: v.link ? [String(v.link).trim()] : [],
  });

  return (
    <section
      className="space-y-5"
      aria-label={mode === "trips" ? "Travel planning" : "Goals and plans"}
    >
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus /> New {copy.noun}
        </Button>
      </div>
      {plans.error ? (
        <ErrorNotice error={plans.error} />
      ) : plans.loading ? (
        <ListSkeleton rows={2} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={mode === "trips" ? MapPin : Target}
          title={mode === "trips" ? "No trips yet" : "No goals yet"}
          description={copy.empty}
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Add one
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((p) => (
            <li key={p.id} className="paper hover-lift flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow mb-1">
                    {p.kind === "someday" ? "Someday / maybe" : p.kind}
                  </p>
                  <h3 className="truncate font-serif text-xl">{p.title}</h3>
                  {p.destination && (
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <Compass className="size-3.5" />
                      {p.destination}
                    </p>
                  )}
                </div>
                <StatusBadge label={p.status} />
              </div>
              {p.targetDate && (
                <p className="text-xs text-muted-foreground">
                  {format(fromDayKey(p.targetDate), "MMMM d, yyyy")}
                </p>
              )}
              {p.notes && (
                <p className="line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">
                  {p.notes}
                </p>
              )}
              {p.budgetNotes && (
                <p className="text-xs">
                  <span className="font-medium">Budget:</span> {p.budgetNotes}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <div className="w-36">
                  <NativeSelect
                    aria-label={`Status for ${p.title}`}
                    value={p.status}
                    onChange={(e) =>
                      void actions.update(p.id, { status: e.target.value as PlanStatus })
                    }
                    className="h-8 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex">
                  {p.links[0] && (
                    <Button asChild variant="ghost" size="icon-sm" aria-label="Open link">
                      <a href={p.links[0]} target="_blank" rel="noopener noreferrer">
                        <ExternalLink />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${p.title}`}
                    onClick={() => setEditing(p)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${p.title}`}
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <RecordDialog
        open={creating}
        onOpenChange={setCreating}
        title={`New ${copy.noun}`}
        fields={fields}
        initial={toValues()}
        onSubmit={(v) => void actions.create({ ...fromValues(v) })}
      />
      <RecordDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={`Edit ${copy.noun}`}
        fields={fields}
        initial={toValues(editing)}
        onSubmit={(v) => editing && void actions.update(editing.id, fromValues(v))}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this?"
        description={`“${deleting?.title ?? ""}” will be permanently removed.`}
        onConfirm={() => deleting && void actions.remove(deleting.id)}
      />
    </section>
  );
}
