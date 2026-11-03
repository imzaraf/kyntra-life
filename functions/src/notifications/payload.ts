/** Pure helpers — no firebase imports, so they're unit-testable from the web app's Vitest. */

export interface ReminderForPush {
  id: string;
  title: string;
  note?: string;
  scheduledAtMillis: number;
}

/** Mirrors lib/notifications/deep-link.ts in the web app. */
export function reminderDeepLink(reminderId: string): string {
  return `/plan?view=reminders&reminder=${encodeURIComponent(reminderId)}`;
}

/**
 * `tag` matches the client's in-app/foreground notification tag so the OS
 * replaces rather than stacks duplicates: `reminder-${id}:${scheduledAtMillis}`.
 */
export function reminderTag(
  r: Pick<ReminderForPush, "id" | "scheduledAtMillis">,
): string {
  return `reminder-${r.id}:${r.scheduledAtMillis}`;
}

/**
 * Data-only FCM message: the app's single service worker (public/sw.js) renders it,
 * so Firebase never auto-displays a second notification. Values must be strings.
 */
export function buildPushMessage(token: string, r: ReminderForPush) {
  return {
    token,
    data: {
      title: r.title.slice(0, 120),
      body: (r.note ?? "Reminder").slice(0, 200),
      url: reminderDeepLink(r.id),
      tag: reminderTag(r),
    },
    webpush: { headers: { Urgency: "high", TTL: "3600" } },
  };
}

const PERMANENT_TOKEN_ERRORS = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/** Tokens FCM says will never work again: delete them. */
export const isPermanentTokenError = (code: string | undefined): boolean =>
  !!code && PERMANENT_TOKEN_ERRORS.has(code);
