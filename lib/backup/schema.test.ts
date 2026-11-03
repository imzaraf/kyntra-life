import { describe, expect, it } from "vitest";
import { parseBackup } from "./schema";

const base = (collections: object) =>
  JSON.stringify({
    app: "kyntra",
    version: 1,
    exportedAt: "2026-03-10T10:00:00.000Z",
    collections,
  });

describe("parseBackup", () => {
  it("accepts a valid backup and applies defaults", () => {
    const res = parseBackup(
      base({ tasks: [{ id: "t1", title: "Hi", priority: "low", status: "todo" }] }),
    );
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.backup.collections.tasks[0].tags).toEqual([]);
  });
  it("rejects malformed JSON and foreign files", () => {
    expect(parseBackup("{nope").ok).toBe(false);
    expect(parseBackup(JSON.stringify({ app: "other" })).ok).toBe(false);
  });
  it("rejects unsafe ids and non-http links", () => {
    expect(
      parseBackup(
        base({ tasks: [{ id: "../x", title: "t", priority: "low", status: "todo" }] }),
      ).ok,
    ).toBe(false);
    expect(
      parseBackup(
        base({
          savedResources: [
            { id: "r", url: "javascript:alert(1)", title: "x", status: "unread" },
          ],
        }),
      ).ok,
    ).toBe(false);
  });
  it("rejects time blocks that end before they start", () => {
    expect(
      parseBackup(
        base({
          timeBlocks: [
            { id: "b", title: "x", date: "2026-03-10", startMin: 600, endMin: 540 },
          ],
        }),
      ).ok,
    ).toBe(false);
  });
});
