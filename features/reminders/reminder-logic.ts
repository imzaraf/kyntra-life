import { addDays, addHours, addMinutes, endOfDay, nextMonday, set } from "date-fns";
import type { Reminder } from "@/types/domain";

export type ReminderView = "upcoming" | "due" | "past_due" | "completed";
export type ReminderState = "completed" | "dismissed" | "due" | "past_due" | "upcoming";

/** "Due" = within the last 30 minutes (still fresh); older unhandled = "past due". */
const FRESH_WINDOW_MS = 30 * 60 * 1000;

export function reminderState(
  r: Pick<Reminder, "status" | "scheduledAt">,
  now: Date,
): ReminderState {
  if (r.status === "completed") return "completed";
  if (r.status === "dismissed") return "dismissed";
  const diff = now.getTime() - r.scheduledAt.getTime();
  if (diff < 0) return "upcoming";
  return diff <= FRESH_WINDOW_MS ? "due" : "past_due";
}

export function filterReminders(
  reminders: Reminder[],
  view: ReminderView,
  now: Date,
): Reminder[] {
  const match = (r: Reminder) => {
    const s = reminderState(r, now);
    if (view === "completed") return s === "completed" || s === "dismissed";
    return s === view;
  };
  const list = reminders.filter(match);
  return list.sort((a, b) =>
    view === "completed"
      ? b.scheduledAt.getTime() - a.scheduledAt.getTime()
      : a.scheduledAt.getTime() - b.scheduledAt.getTime(),
  );
}

export type Preset = "later_today" | "tomorrow" | "next_week";

/** Presets use local wall-clock time, so they remain correct across DST changes. */
export function presetTime(preset: Preset, now: Date): Date {
  switch (preset) {
    case "later_today": {
      const candidate = addHours(now, 3);
      const eod = set(endOfDay(now), {
        hours: 21,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
      return candidate > eod ? addMinutes(now, 30) : roundUp(candidate, 5);
    }
    case "tomorrow":
      return set(addDays(now, 1), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    case "next_week":
      return set(nextMonday(now), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
  }
}

export type SnoozeOption = "10m" | "1h" | "later_today" | "tomorrow";

export const SNOOZE_LABELS: Record<SnoozeOption, string> = {
  "10m": "10 minutes",
  "1h": "1 hour",
  later_today: "Later today",
  tomorrow: "Tomorrow morning",
};

export function snoozeTime(option: SnoozeOption, now: Date): Date {
  switch (option) {
    case "10m":
      return addMinutes(now, 10);
    case "1h":
      return addHours(now, 1);
    case "later_today":
      return presetTime("later_today", now);
    case "tomorrow":
      return presetTime("tomorrow", now);
  }
}

function roundUp(d: Date, step: number): Date {
  const ms = step * 60 * 1000;
  return new Date(Math.ceil(d.getTime() / ms) * ms);
}

/** Reminders that need an in-app prompt right now. */
export const dueReminders = (reminders: Reminder[], now: Date) =>
  reminders.filter(
    (r) => r.status === "pending" && r.scheduledAt.getTime() <= now.getTime(),
  );

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
