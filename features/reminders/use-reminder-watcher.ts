"use client";

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useNow } from "@/hooks/use-now";
import { playChime } from "@/lib/notifications/chime";
import { buildDeepLink } from "@/lib/notifications/deep-link";
import { dueReminders } from "./reminder-logic";
import { usePendingReminders, useReminderActions } from "./use-reminders";

/** Show a system notification via the service worker (required on Android: `new Notification()` throws). */
async function showSystemNotification(
  title: string,
  body: string | undefined,
  key: string,
  url: string,
) {
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;
  await registration.showNotification(title, {
    body,
    tag: `reminder-${key}`, // matches the server push, so the OS replaces rather than duplicates
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    silent: false,
    vibrate: [200, 100, 200],
    data: { url },
  } as NotificationOptions);
}

/** Keep the installed app's launcher-icon badge in sync (Android Chrome / desktop PWAs). */
function syncAppBadge(count: number) {
  const nav = navigator as Navigator & {
    setAppBadge?: (n?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  if (count > 0) void nav.setAppBadge?.(count).catch(() => undefined);
  else void nav.clearAppBadge?.().catch(() => undefined);
}

/**
 * Surfaces due reminders inside the app and returns how many need attention
 * (due or past due). It re-evaluates against the stored schedule on mount, on a short
 * interval, and on focus/visibility changes (via useNow) — never a long-lived setTimeout.
 * In-app alerts work even when notification permission is denied.
 */
export function useReminderWatcher(): { attentionCount: number } {
  const now = useNow(15_000);
  const pending = usePendingReminders();
  const actions = useReminderActions();
  const alerted = useRef(new Set<string>());

  const due = useMemo(() => dueReminders(pending.data, now), [pending.data, now]);
  const attentionCount = due.length;

  useEffect(() => {
    for (const r of due) {
      const key = `${r.id}:${r.scheduledAt.getTime()}`;
      if (alerted.current.has(key)) continue;
      alerted.current.add(key);

      if (document.visibilityState === "visible") {
        void playChime();
        toast(r.title, {
          id: key,
          description: r.note || "Reminder",
          duration: 20_000,
          action: { label: "Done", onClick: () => void actions.complete(r) },
          cancel: { label: "Snooze 10m", onClick: () => void actions.snooze(r, "10m") },
        });
      } else if ("Notification" in window && Notification.permission === "granted") {
        void showSystemNotification(
          r.title,
          r.note,
          key,
          buildDeepLink({ type: "reminder", reminderId: r.id }),
        ).catch((error) => console.error("Couldn't show notification", error));
      }
    }
  }, [due, actions]);

  useEffect(() => {
    syncAppBadge(attentionCount);
  }, [attentionCount]);

  // The service worker asks any live Kyntra page to chime when a push arrives
  // (a worker itself can't play audio).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "kyntra:chime") void playChime();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  return { attentionCount };
}
