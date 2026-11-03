import { describe, expect, it } from "vitest";
import {
  buildPushMessage,
  isPermanentTokenError,
  reminderDeepLink,
  reminderTag,
} from "./payload";

describe("push payload", () => {
  const r = {
    id: "abc",
    title: "Call Sam",
    note: "about the trip",
    scheduledAtMillis: 1234,
  };
  it("builds a data-only message with a safe internal deep link", () => {
    const m = buildPushMessage("tok", r);
    expect(m.data).toEqual({
      title: "Call Sam",
      body: "about the trip",
      url: "/plan?view=reminders&reminder=abc",
      tag: "reminder-abc:1234",
    });
    expect("notification" in m).toBe(false);
    expect(m.data.url.startsWith("/")).toBe(true);
  });
  it("encodes ids and truncates long text", () => {
    expect(reminderDeepLink("a b")).toBe("/plan?view=reminders&reminder=a%20b");
    expect(
      buildPushMessage("t", { ...r, title: "x".repeat(500) }).data.title,
    ).toHaveLength(120);
  });
  it("tag matches the web client's tag format", () => {
    expect(reminderTag(r)).toBe("reminder-abc:1234");
  });
  it("identifies permanent token errors only", () => {
    expect(isPermanentTokenError("messaging/registration-token-not-registered")).toBe(
      true,
    );
    expect(isPermanentTokenError("messaging/internal-error")).toBe(false);
  });
});
