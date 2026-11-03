import {
  getFirestore,
  Timestamp,
  type DocumentReference,
} from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import * as logger from "firebase-functions/logger";
import { buildPushMessage, isPermanentTokenError } from "../notifications/payload.js";
import { decideClaim, deliveryId, type DeliveryState } from "./claim.js";

const BATCH_SIZE = 200;

/**
 * Finds due reminders (cost-conscious: one indexed collection-group query,
 * bounded by BATCH_SIZE) and delivers each at most once per scheduled time.
 */
export async function processDueReminders(
  now = new Date(),
): Promise<{ scanned: number; sent: number }> {
  const db = getFirestore();
  const snap = await db
    .collectionGroup("reminders")
    .where("notifyPending", "==", true)
    .where("scheduledAt", "<=", Timestamp.fromDate(now))
    .limit(BATCH_SIZE)
    .get();

  let sent = 0;
  // Bounded concurrency via simple chunking.
  const refs = snap.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 10) {
    const results = await Promise.all(
      refs.slice(i, i + 10).map((ref) =>
        deliverOne(ref, now).catch((error: unknown) => {
          logger.error("Reminder delivery crashed", {
            reminderPath: ref.path,
            error: String(error),
          });
          return false;
        }),
      ),
    );
    sent += results.filter(Boolean).length;
  }
  logger.info("Processed due reminders", { scanned: snap.size, sent });
  return { scanned: snap.size, sent };
}

async function deliverOne(ref: DocumentReference, now: Date): Promise<boolean> {
  const db = getFirestore();
  const uid = ref.parent.parent?.id;
  if (!uid) return false;
  const nowMillis = now.getTime();

  // 1) Claim in a transaction so concurrent workers/retries can't double-send.
  const claim = await db.runTransaction(async (tx) => {
    const rSnap = await tx.get(ref);
    const r = rSnap.data();
    if (!r) return null;
    const scheduledAtMillis = (r.scheduledAt as Timestamp).toMillis();
    const dRef = db.doc(
      `users/${uid}/notificationDeliveries/${deliveryId(ref.id, scheduledAtMillis)}`,
    );
    const dSnap = await tx.get(dRef);
    const d = dSnap.data();
    const delivery: DeliveryState | undefined = d
      ? {
          status: d.status,
          attempts: d.attempts ?? 0,
          claimedAtMillis: (d.claimedAt as Timestamp | undefined)?.toMillis(),
        }
      : undefined;

    const decision = decideClaim(
      {
        status: r.status,
        notify: !!r.notify,
        notifyPending: !!r.notifyPending,
        scheduledAtMillis,
      },
      delivery,
      nowMillis,
    );
    if (decision.action === "ignore") return null;
    if (decision.action === "close") {
      tx.update(ref, {
        notifyPending: false,
        delivery: {
          status: "skipped",
          attempts: delivery?.attempts ?? 0,
          reason: decision.reason,
          lastAttemptAt: Timestamp.now(),
        },
      });
      return null;
    }
    tx.set(
      dRef,
      {
        reminderId: ref.id,
        scheduledAtMillis,
        status: "sending",
        attempts: decision.attempts,
        claimedAt: Timestamp.now(),
      },
      { merge: true },
    );
    return {
      dRef,
      attempts: decision.attempts,
      title: String(r.title),
      note: r.note as string | undefined,
      scheduledAtMillis,
    };
  });
  if (!claim) return false;

  // 2) Send to every registered device.
  const tokensSnap = await db.collection(`users/${uid}/notificationTokens`).get();
  if (tokensSnap.empty) {
    await finish(ref, claim.dRef, claim.attempts, "skipped", "no-registered-devices");
    return false;
  }
  const tokenDocs = tokensSnap.docs;
  const messages = tokenDocs.map((t) =>
    buildPushMessage(String(t.get("token")), {
      id: ref.id,
      title: claim.title,
      note: claim.note,
      scheduledAtMillis: claim.scheduledAtMillis,
    }),
  );
  const response = await getMessaging().sendEach(messages);

  // 3) Clean up dead tokens; classify the outcome.
  let delivered = 0;
  let retryable = 0;
  await Promise.all(
    response.responses.map(async (res, i) => {
      if (res.success) return void delivered++;
      const code = res.error?.code;
      if (isPermanentTokenError(code)) await tokenDocs[i].ref.delete();
      else retryable++;
      logger.warn("Push send failed", { uid, code }); // never log tokens
    }),
  );

  if (delivered > 0) {
    await finish(ref, claim.dRef, claim.attempts, "sent");
    return true;
  }
  if (retryable > 0 && claim.attempts < 5) {
    await claim.dRef.set(
      { status: "retry", attempts: claim.attempts, lastAttemptAt: Timestamp.now() },
      { merge: true },
    );
    return false; // reminder stays notifyPending; the next run retries
  }
  await finish(
    ref,
    claim.dRef,
    claim.attempts,
    retryable > 0 ? "failed" : "skipped",
    retryable > 0 ? "max-attempts" : "all-tokens-invalid",
  );
  return false;
}

async function finish(
  reminder: DocumentReference,
  deliveryRef: DocumentReference,
  attempts: number,
  status: "sent" | "failed" | "skipped",
  reason?: string,
) {
  const now = Timestamp.now();
  const batch = getFirestore().batch();
  batch.set(
    deliveryRef,
    { status, attempts, reason: reason ?? null, completedAt: now },
    { merge: true },
  );
  batch.update(reminder, {
    notifyPending: false,
    delivery: {
      status,
      attempts,
      lastAttemptAt: now,
      ...(status === "sent" ? { sentAt: now } : {}),
      ...(reason ? { reason } : {}),
    },
  });
  await batch.commit();
}
