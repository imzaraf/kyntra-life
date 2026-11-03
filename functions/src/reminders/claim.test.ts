import { describe, expect, it } from "vitest";
import {
  CLAIM_TTL_MS,
  MAX_ATTEMPTS,
  decideClaim,
  deliveryId,
  type ReminderState,
} from "./claim";

const NOW = 1_700_000_000_000;
const due = (over: Partial<ReminderState> = {}): ReminderState => ({
  status: "pending",
  notify: true,
  notifyPending: true,
  scheduledAtMillis: NOW - 1000,
  ...over,
});

describe("decideClaim", () => {
  it("claims a due, pending reminder on first attempt", () => {
    expect(decideClaim(due(), undefined, NOW)).toEqual({ action: "claim", attempts: 1 });
  });
  it("ignores reminders already handled or snoozed into the future", () => {
    expect(decideClaim(due({ notifyPending: false }), undefined, NOW).action).toBe(
      "ignore",
    );
    expect(
      decideClaim(due({ scheduledAtMillis: NOW + 60_000 }), undefined, NOW).action,
    ).toBe("ignore");
  });
  it("closes without sending when completed/dismissed or notifications are off", () => {
    expect(decideClaim(due({ status: "completed" }), undefined, NOW)).toEqual({
      action: "close",
      reason: "reminder-completed",
    });
    expect(decideClaim(due({ notify: false }), undefined, NOW)).toEqual({
      action: "close",
      reason: "notifications-off",
    });
  });
  it("never re-sends an already delivered notification (idempotency)", () => {
    expect(decideClaim(due(), { status: "sent", attempts: 1 }, NOW)).toEqual({
      action: "close",
      reason: "already-delivered",
    });
  });
  it("respects an in-flight claim but retakes an abandoned one", () => {
    expect(
      decideClaim(
        due(),
        { status: "sending", attempts: 1, claimedAtMillis: NOW - 1000 },
        NOW,
      ).action,
    ).toBe("ignore");
    expect(
      decideClaim(
        due(),
        { status: "sending", attempts: 1, claimedAtMillis: NOW - CLAIM_TTL_MS - 1 },
        NOW,
      ),
    ).toEqual({ action: "claim", attempts: 2 });
  });
  it("retries with an incremented attempt count and gives up at the cap", () => {
    expect(decideClaim(due(), { status: "retry", attempts: 2 }, NOW)).toEqual({
      action: "claim",
      attempts: 3,
    });
    expect(decideClaim(due(), { status: "retry", attempts: MAX_ATTEMPTS }, NOW)).toEqual({
      action: "close",
      reason: "max-attempts",
    });
  });
  it("gives a snoozed reminder a separate delivery id", () => {
    expect(deliveryId("r1", 1)).not.toBe(deliveryId("r1", 2));
  });
});
