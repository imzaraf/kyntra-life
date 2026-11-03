"use client";

import {
  Bold,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  Maximize2,
  Minimize2,
  PenLine,
  Quote,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MarkdownView } from "@/components/shared/markdown-view";
import { Button } from "@/components/ui/button";
import { fromDayKey } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/types/domain";
import { STATUS_LABEL, useAutosave } from "./use-autosave";
import { useJournalActions, type JournalDraft } from "./use-journal";
import { format } from "date-fns";

const SCALE = [1, 2, 3, 4, 5];

export function JournalEditor({
  id,
  entry,
  initialDate,
  onDelete,
}: {
  id: string;
  /** Present once the entry exists in Firestore; undefined for a fresh draft. */
  entry?: JournalEntry;
  initialDate: string;
  onDelete: (id: string) => void;
}) {
  const actions = useJournalActions();
  const exists = useRef(!!entry);
  const [draft, setDraft] = useState<JournalDraft>({
    title: entry?.title ?? "",
    date: entry?.date ?? initialDate,
    body: entry?.body ?? "",
    mood: entry?.mood,
    energy: entry?.energy,
    focus: entry?.focus,
  });
  const [preview, setPreview] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  const { status, schedule } = useAutosave<JournalDraft>(async (value) => {
    const wasCreated = exists.current;
    exists.current = true;
    try {
      await actions.save(id, value, wasCreated);
    } catch (error) {
      exists.current = wasCreated;
      throw error;
    }
  });

  const change = (patch: Partial<JournalDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    // Don't create empty documents.
    if (exists.current || next.body.trim() || next.title?.trim()) schedule(next);
  };

  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFocusMode(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode]);

  const wrap = (before: string, after = before, placeholder = "text") => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || placeholder;
    change({ body: value.slice(0, s) + before + selected + after + value.slice(e) });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  };
  const linePrefix = (prefix: string) => {
    const el = area.current;
    if (!el) return;
    const s = el.value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    change({ body: el.value.slice(0, s) + prefix + el.value.slice(s) });
    requestAnimationFrame(() => el.focus());
  };

  const words = draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0;

  return (
    <div
      className={cn(
        "flex flex-col",
        focusMode
          ? "fixed inset-0 z-50 overflow-y-auto bg-background px-5 py-8 md:px-0"
          : "paper-raised min-h-[70dvh] p-5 md:p-8",
      )}
    >
      <div
        className={cn("flex w-full flex-1 flex-col", focusMode && "mx-auto max-w-2xl")}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow" aria-live="polite">
            {format(fromDayKey(draft.date), "EEEE, MMMM d, yyyy")}
            <span className="ml-3 tracking-normal normal-case">
              {STATUS_LABEL[status]}
            </span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreview((p) => !p)}
              aria-pressed={preview}
            >
              {preview ? <PenLine /> : <Eye />} {preview ? "Write" : "Preview"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={focusMode ? "Exit focus mode" : "Focus mode"}
              onClick={() => setFocusMode((f) => !f)}
            >
              {focusMode ? <Minimize2 /> : <Maximize2 />}
            </Button>
            {entry && !focusMode && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete entry"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        </div>

        <input
          aria-label="Entry title"
          value={draft.title ?? ""}
          onChange={(e) => change({ title: e.target.value })}
          placeholder="Untitled"
          maxLength={160}
          className="mb-4 w-full bg-transparent font-serif text-4xl leading-tight tracking-tight outline-none placeholder:text-muted-foreground/60 md:text-5xl"
        />

        {!preview && (
          <div
            className="mb-4 flex flex-wrap items-center gap-1 border-y border-border/70 py-1.5"
            role="toolbar"
            aria-label="Formatting"
          >
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Bold"
              onClick={() => wrap("**")}
            >
              <Bold />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Italic"
              onClick={() => wrap("*")}
            >
              <Italic />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Heading"
              onClick={() => linePrefix("## ")}
            >
              <Heading2 />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Bulleted list"
              onClick={() => linePrefix("- ")}
            >
              <List />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Quote"
              onClick={() => linePrefix("> ")}
            >
              <Quote />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Link"
              onClick={() => wrap("[", "](https://)", "link text")}
            >
              <Link2 />
            </Button>
            <input
              type="date"
              aria-label="Entry date"
              value={draft.date}
              onChange={(e) => e.target.value && change({ date: e.target.value })}
              className="ml-auto rounded-lg bg-transparent px-2 py-1 text-xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        )}

        {preview ? (
          draft.body.trim() ? (
            <MarkdownView source={draft.body} className="flex-1" />
          ) : (
            <p className="text-muted-foreground">Nothing to preview yet.</p>
          )
        ) : (
          <textarea
            ref={area}
            aria-label="Journal entry"
            value={draft.body}
            onChange={(e) => change({ body: e.target.value })}
            placeholder="What's on your mind today? Markdown is welcome."
            className="min-h-[40dvh] w-full flex-1 resize-none bg-transparent text-[1.05rem] leading-[1.85] outline-none placeholder:text-muted-foreground/60"
          />
        )}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Scale
              label="Mood"
              value={draft.mood}
              onChange={(v) => change({ mood: v })}
            />
            <Scale
              label="Energy"
              value={draft.energy}
              onChange={(v) => change({ energy: v })}
            />
            <Scale
              label="Focus"
              value={draft.focus}
              onChange={(v) => change({ focus: v })}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {words} words
          </span>
        </footer>
      </div>
    </div>
  );
}

function Scale({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label={`${label} (optional)`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-1">
        {SCALE.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label} ${n} of 5`}
            aria-pressed={value === n}
            onClick={() => onChange(value === n ? undefined : n)}
            className={cn(
              "size-4 rounded-full border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              value !== undefined && n <= value
                ? "border-sage bg-sage"
                : "border-input hover:border-sage",
            )}
          />
        ))}
      </div>
    </div>
  );
}
