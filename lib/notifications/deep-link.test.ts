import { describe, expect, it } from "vitest";
import { buildDeepLink, safeInternalPath } from "./deep-link";

describe("deep links", () => {
  it("builds reminder and task links with encoding", () => {
    expect(buildDeepLink({ type: "reminder", reminderId: "a b" })).toBe(
      "/plan?view=reminders&reminder=a%20b",
    );
    expect(buildDeepLink({ type: "task", taskId: "t1" })).toBe(
      "/plan?view=tasks&task=t1",
    );
  });
  it("rejects external or protocol-relative paths", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/today");
    expect(safeInternalPath("//evil.com")).toBe("/today");
    expect(safeInternalPath("/plan?view=reminders")).toBe("/plan?view=reminders");
  });
});
