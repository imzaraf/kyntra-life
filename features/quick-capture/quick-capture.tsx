"use client";

import {
  Bell,
  BookOpenText,
  Bookmark,
  CheckSquare,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { useAuth } from "@/features/auth/auth-provider";
import {
  presetTime,
  localTimeZone,
  type Preset,
} from "@/features/reminders/reminder-logic";
import { todayKey } from "@/lib/date-time";
import {
  ideaRepo,
  journalRepo,
  reminderRepo,
  resourceRepo,
  taskRepo,
} from "@/lib/repositories";
import { cn } from "@/lib/utils";

type Kind = "thought" | "journal" | "task" | "reminder" | "link";

const KINDS: { key: Kind; label: string; icon: LucideIcon; placeholder: string }[] = [
  {
    key: "thought",
    label: "Thought",
    icon: Lightbulb,
    placeholder: "A thought, an idea, a note to self…",
  },
  {
    key: "journal",
    label: "Journal",
    icon: BookOpenText,
    placeholder: "Write a few lines for today…",
  },
  { key: "task", label: "Task", icon: CheckSquare, placeholder: "What needs doing?" },
  { key: "reminder", label: "Reminder", icon: Bell, placeholder: "Remind me to…" },
  { key: "link", label: "Link", icon: Bookmark, placeholder: "Paste a link to save…" },
];

const REMINDER_PRESETS: { key: Preset; label: string }[] = [
  { key: "later_today", label: "Later today" },
  { key: "tomorrow", label: "Tomorrow 9am" },
  { key: "next_week", label: "Next week" },
];

export function QuickCapture({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const [kind, setKind] = useState<Kind>("thought");
  const [text, setText] = useState("");
  const [dueToday, setDueToday] = useState(true);
  const [preset, setPreset] = useState<Preset>("later_today");
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const meta = KINDS.find((k) => k.key === kind)!;

  const save = async () => {
    const value = text.trim();
    if (!value || !user) return;
    const uid = user.uid;
    setError(null);
    try {
      switch (kind) {
        case "thought":
          ideaRepo.create(uid, {
            title: value.split("\n")[0].slice(0, 200),
            body: value.includes("\n") ? value : undefined,
            status: "inbox",
            tags: [],
          });
          break;
        case "journal":
          journalRepo.create(uid, { date: todayKey(), body: value });
          break;
        case "task":
          taskRepo.create(uid, {
            title: value.slice(0, 200),
            priority: "medium",
            status: "todo",
            tags: [],
            subtasks: [],
            dueDate: dueToday ? todayKey() : undefined,
          });
          break;
        case "reminder":
          reminderRepo.create(uid, {
            title: value.slice(0, 200),
            scheduledAt: presetTime(preset, new Date()),
            status: "pending",
            notify: true,
            notifyPending: true,
            timeZone: localTimeZone(),
          });
          break;
        case "link": {
          let url: URL;
          try {
            url = new URL(value);
            if (!["http:", "https:"].includes(url.protocol)) throw new Error("protocol");
          } catch {
            setError("That doesn't look like a full link. Start with https://");
            return;
          }
          resourceRepo.create(uid, {
            url: url.toString(),
            title: url.hostname.replace(/^www\./, ""),
            status: "unread",
            tags: [],
          });
          break;
        }
      }
      toast.success(`${meta.label} captured`);
      setText("");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      setError("Couldn't save that. Please try again.");
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void save();
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Quick capture"
      description="Save a thought, journal note, task, reminder or link in one step."
      hideHeader
      flush
      surface="glass"
      size="lg"
      className="md:top-[18dvh]"
    >
      <div
        role="radiogroup"
        aria-label="Capture type"
        className="flex [scrollbar-width:none] gap-1 overflow-x-auto p-3 pb-0"
      >
        {KINDS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={kind === key}
            onClick={() => {
              setKind(key);
              setError(null);
              field.current?.focus();
            }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              kind === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/70",
            )}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>
      <textarea
        ref={field}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        autoFocus
        onKeyDown={onKey}
        rows={kind === "journal" ? 5 : 3}
        aria-label={meta.label}
        placeholder={meta.placeholder}
        className="w-full resize-none bg-transparent px-5 py-4 font-serif text-xl leading-snug outline-none placeholder:text-muted-foreground/70"
      />
      {error && (
        <p role="alert" className="px-5 pb-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {kind === "task" && (
            <Button
              type="button"
              size="sm"
              variant={dueToday ? "secondary" : "ghost"}
              aria-pressed={dueToday}
              onClick={() => setDueToday((d) => !d)}
            >
              Due today
            </Button>
          )}
          {kind === "reminder" &&
            REMINDER_PRESETS.map((p) => (
              <Button
                key={p.key}
                type="button"
                size="sm"
                variant={preset === p.key ? "secondary" : "ghost"}
                aria-pressed={preset === p.key}
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ⌘↵ to save
          </span>
          <Button onClick={() => void save()} disabled={!text.trim()}>
            Capture
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
