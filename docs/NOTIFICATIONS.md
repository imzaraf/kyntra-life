# Notifications

Kyntra has **three layers**, each useful on its own:

1. **In‑app reminders** (always work, no permission needed). `useReminderWatcher` re‑evaluates stored reminders on mount, every 15 s, and on focus/visibility changes — never a long‑lived `setTimeout`. Due reminders surface as toasts with _Done_ / _Snooze 10m_.
2. **Browser Notification API** when the page is open but hidden and permission is granted. Uses the same `tag` as the server push so the OS replaces rather than duplicates.
3. **FCM web push** when the app is closed, delivered by a scheduled Cloud Function.

## Flow

```
Reminder doc (Firestore)        scheduledAt, status=pending, notify, notifyPending=true
        │  every minute (Cloud Scheduler → deliverDueReminders)
        ▼
collectionGroup("reminders") where notifyPending==true and scheduledAt<=now   (indexed, limit 200)
        ▼
Transaction: decideClaim() + write notificationDeliveries/{reminderId}_{scheduledAtMillis}=sending
        ▼
FCM sendEach → data-only message → public/sw.js `push` → showNotification
        ▼
Reminder: notifyPending=false, delivery={status,attempts,sentAt}
```

### Idempotency & failures

- The delivery id is `reminderId_scheduledAtMillis`; a **snooze changes `scheduledAt`**, so it is a new delivery.
- `sent`/`skipped` deliveries are never re‑sent. An in‑flight claim blocks other workers for 2 minutes; abandoned claims can be retaken.
- Transient FCM errors retry on the next minute, up to 5 attempts, then `failed`.
- `registration-token-not-registered` / `invalid-registration-token` delete that device token.
- Completed/dismissed/notify‑off reminders are closed with a reason, not sent.
- **Honest limit:** if a worker crashes _after_ FCM accepts the message but _before_ it records `sent`, the claim expires and one duplicate is possible (at‑least‑once in that narrow window).

### Client‑side rules

Clients cannot write `delivery`, the `notificationDeliveries` ledger, or anything outside the field allow‑lists in `firestore.rules`. Clients may set `notifyPending` (to arm a push on create/snooze); a forged `true` can at most re‑evaluate a reminder, and the delivery ledger prevents duplicates.

## One service worker

`public/sw.js` is the only worker. It caches static assets, serves `/offline.html` for failed navigations, renders push, and handles notification clicks. FCM's `getToken` is passed this registration so Firebase never registers its own `firebase-messaging-sw.js`. Firestore/Google traffic is cross‑origin and never intercepted; HTML is never cached, so private data isn't stored by the worker. Clicking a notification focuses/opens `/plan?view=reminders&reminder=<id>` (same‑origin paths only).

The worker suppresses OS notifications while Kyntra is visible (the in‑app UI handles it).

## Setup

1. Firebase console → Cloud Messaging → Web Push certificates → generate key → `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
2. Upgrade the project to **Blaze** (required for scheduled Cloud Functions / Cloud Scheduler).
3. `npm run functions:build && npx firebase deploy --only firestore,functions`.
4. In the app: Settings → _Enable notifications_ (permission is requested only on that click).

## Billing

Scheduled functions need the Blaze (pay‑as‑you‑go) plan and a Google Cloud billing account. Kyntra does not enable anything for you. The job runs once a minute with `maxInstances: 1` and one bounded, indexed query per run; at personal scale this typically stays within free quotas, but check current Firebase pricing and set a budget alert.

## Limitations

Delivery is **best‑effort**, not guaranteed: browser permission, OS focus/battery modes, network, and Firebase infrastructure all affect it. iOS requires the PWA to be added to the Home Screen. The push path was implemented and unit‑tested for its decision logic, but has **not** been verified against a real Firebase project in this repository's CI.
