export type NotificationTarget =
  { type: "reminder"; reminderId: string } | { type: "task"; taskId: string };

/**
 * Where a notification click should land. Shared by the Cloud Function payload
 * builder (duplicated in functions/) and the service worker click handler.
 */
export function buildDeepLink(target: NotificationTarget): string {
  switch (target.type) {
    case "reminder":
      return `/plan?view=reminders&reminder=${encodeURIComponent(target.reminderId)}`;
    case "task":
      return `/plan?view=tasks&task=${encodeURIComponent(target.taskId)}`;
  }
}

/** Only same-origin relative paths are allowed from notification payloads. */
export function safeInternalPath(path: unknown): string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : "/today";
}
