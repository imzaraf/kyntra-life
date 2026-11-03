import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "kyntra-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const meta = () => ({
  schemaVersion: 1,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
const task = (over = {}) => ({
  title: "Write",
  priority: "medium",
  status: "todo",
  tags: [],
  subtasks: [],
  ...meta(),
  ...over,
});
const reminder = (over = {}) => ({
  title: "Call",
  scheduledAt: Timestamp.now(),
  status: "pending",
  notify: true,
  notifyPending: true,
  timeZone: "UTC",
  ...meta(),
  ...over,
});

describe("user isolation", () => {
  it("lets a user write and read their own data", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertSucceeds(setDoc(doc(db, "users/alice/tasks/t1"), task()));
    await assertSucceeds(getDoc(doc(db, "users/alice/tasks/t1")));
  });
  it("blocks reading and writing another user's data", async () => {
    await env.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), "users/alice/tasks/t1"), { title: "secret" }),
    );
    const bob = env.authenticatedContext("bob").firestore();
    await assertFails(getDoc(doc(bob, "users/alice/tasks/t1")));
    await assertFails(setDoc(doc(bob, "users/alice/tasks/t2"), task()));
  });
  it("blocks unauthenticated access", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users/alice/tasks/t1")));
    await assertFails(setDoc(doc(db, "users/alice/tasks/t1"), task()));
  });
  it("denies unknown collections by default", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "users/alice/secrets/s1"), { x: 1 }));
    await assertFails(setDoc(doc(db, "random/doc"), { x: 1 }));
  });
});

describe("validation", () => {
  const alice = () => env.authenticatedContext("alice").firestore();
  it("rejects unknown fields and bad enums", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/tasks/t1"), task({ isAdmin: true })),
    );
    await assertFails(
      setDoc(doc(alice(), "users/alice/tasks/t1"), task({ priority: "urgent" })),
    );
  });
  it("rejects time blocks that end before they start", async () => {
    const base = { title: "x", date: "2026-03-10", ...meta() };
    await assertFails(
      setDoc(doc(alice(), "users/alice/timeBlocks/b1"), {
        ...base,
        startMin: 600,
        endMin: 540,
      }),
    );
    await assertSucceeds(
      setDoc(doc(alice(), "users/alice/timeBlocks/b2"), {
        ...base,
        startMin: 540,
        endMin: 600,
      }),
    );
  });
  it("rejects non-http resource links", async () => {
    const base = { title: "x", status: "unread", tags: [], ...meta() };
    await assertFails(
      setDoc(doc(alice(), "users/alice/savedResources/r1"), {
        ...base,
        url: "javascript:alert(1)",
      }),
    );
    await assertSucceeds(
      setDoc(doc(alice(), "users/alice/savedResources/r2"), {
        ...base,
        url: "https://example.com",
      }),
    );
  });
});

describe("server-owned notification state", () => {
  const alice = () => env.authenticatedContext("alice").firestore();
  it("forbids clients from creating a reminder with delivery state", async () => {
    await assertFails(
      setDoc(
        doc(alice(), "users/alice/reminders/r1"),
        reminder({ delivery: { status: "sent", attempts: 1 } }),
      ),
    );
    await assertSucceeds(setDoc(doc(alice(), "users/alice/reminders/r2"), reminder()));
  });
  it("forbids clients from modifying delivery state", async () => {
    await env.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), "users/alice/reminders/r1"), {
        ...reminder({ updatedAt: Timestamp.now(), createdAt: Timestamp.now() }),
        delivery: { status: "failed", attempts: 5 },
      }),
    );
    await assertFails(
      updateDoc(doc(alice(), "users/alice/reminders/r1"), {
        delivery: { status: "sent", attempts: 1 },
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(alice(), "users/alice/reminders/r1"), {
        title: "Renamed",
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("makes the delivery ledger read-only for clients", async () => {
    await assertFails(
      setDoc(doc(alice(), "users/alice/notificationDeliveries/d1"), { status: "sent" }),
    );
  });
  it("lets a user manage their own device tokens only", async () => {
    await assertSucceeds(
      setDoc(doc(alice(), "users/alice/notificationTokens/k1"), {
        token: "abc",
        ...meta(),
      }),
    );
    const bob = env.authenticatedContext("bob").firestore();
    await assertFails(
      setDoc(doc(bob, "users/alice/notificationTokens/k2"), { token: "abc", ...meta() }),
    );
  });
});
