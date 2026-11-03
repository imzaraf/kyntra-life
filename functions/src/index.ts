import { initializeApp } from "firebase-admin/app";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { processDueReminders } from "./reminders/process-due.js";

// Application Default Credentials in deployed runtimes — no keys in code or env files.
initializeApp();

/**
 * Runs every minute via Cloud Scheduler. Billing note: scheduled functions require the
 * Firebase Blaze plan. Idle runs cost one indexed query; see docs/NOTIFICATIONS.md.
 */
export const deliverDueReminders = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Etc/UTC",
    retryCount: 0,
    memory: "256MiB",
    timeoutSeconds: 120,
    maxInstances: 1,
  },
  async () => {
    await processDueReminders();
  },
);
