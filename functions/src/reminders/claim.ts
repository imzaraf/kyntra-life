/** Pure claim decision for one reminder — the heart of idempotent delivery. */

export const MAX_ATTEMPTS = 5;
/** A claim older than this is considered abandoned (worker crashed) and may be retaken. */
export const CLAIM_TTL_MS = 2 * 60 * 1000;

export interface ReminderState {
  status: string;
  notify: boolean;
  notifyPending: boolean;
  scheduledAtMillis: number;
}

export interface DeliveryState {
  status: "sending" | "sent" | "failed" | "skipped" | "retry";
  attempts: number;
  claimedAtMillis?: number;
}

export type ClaimDecision =
  | { action: "ignore" } // nothing to do, leave untouched
  | { action: "close"; reason: string } // clear notifyPending, record why
  | { action: "claim"; attempts: number };

export function decideClaim(
  reminder: ReminderState,
  delivery: DeliveryState | undefined,
  nowMillis: number,
): ClaimDecision {
  if (!reminder.notifyPending) return { action: "ignore" };
  if (reminder.scheduledAtMillis > nowMillis) return { action: "ignore" }; // snoozed into the future
  if (reminder.status !== "pending")
    return { action: "close", reason: `reminder-${reminder.status}` };
  if (!reminder.notify) return { action: "close", reason: "notifications-off" };

  if (delivery) {
    if (delivery.status === "sent" || delivery.status === "skipped")
      return { action: "close", reason: "already-delivered" };
    if (delivery.status === "failed")
      return { action: "close", reason: "failed-permanently" };
    if (
      delivery.status === "sending" &&
      nowMillis - (delivery.claimedAtMillis ?? 0) < CLAIM_TTL_MS
    )
      return { action: "ignore" }; // another worker is on it
    if (delivery.attempts >= MAX_ATTEMPTS)
      return { action: "close", reason: "max-attempts" };
  }
  return { action: "claim", attempts: (delivery?.attempts ?? 0) + 1 };
}

/** Delivery id is stable per (reminder, scheduled time): a snooze creates a new, separate delivery. */
export const deliveryId = (reminderId: string, scheduledAtMillis: number) =>
  `${reminderId}_${scheduledAtMillis}`;
