"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNow } from "@/hooks/use-now";
import { buildDeepLink } from "@/lib/notifications/deep-link";
import { dueReminders } from "./reminder-logic";
import { usePendingReminders, useReminderActions } from "./use-reminders";

/**
 * Surfaces due reminders inside the app. It re-evaluates against the stored
 * schedule on mount, on a short interval, and on focus/visibility changes
 * (via useNow) — it never depends on a long-lived setTimeout.
 * This path works even when notification permission is denied.
 */
export function useReminderWatcher() {
  const now = useNow(15_000);
  const pending = usePendingReminders();
  const actions = useReminderActions();
  const alerted = useRef(new Set<string>());

  useEffect(() => {
    for (const r of dueReminders(pending.data, now)) {
      const key = `${r.id}:${r.scheduledAt.getTime()}`;
      if (alerted.current.has(key)) continue;
      alerted.current.add(key);

      if (document.visibilityState === "visible") {
        toast(r.title, {
          id: key,
          description: r.note || "Reminder",
          duration: 20_000,
          action: { label: "Done", onClick: () => void actions.complete(r) },
          cancel: { label: "Snooze 10m", onClick: () => void actions.snooze(r, "10m") },
        });
      } else if ("Notification" in window && Notification.permission === "granted") {
        // `tag` matches the server push so the OS replaces rather than duplicates.
        const n = new Notification(r.title, { body: r.note, tag: `reminder-${key}` });
        n.onclick = () => {
          window.focus();
          window.location.assign(buildDeepLink({ type: "reminder", reminderId: r.id }));
        };
      }
    }
  }, [pending.data, now, actions]);
}
