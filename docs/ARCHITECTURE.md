# Architecture

## Layers

```
app/            Routes only. (auth) and (app) groups. Pages compose features.
features/       Product domains: today, journal, tasks, planner, reminders,
                    routines, quick-capture, library/{learning,knowledge,ideas,plans,templates}, settings, auth
components/     ui/ (shadcn + Kyntra theming) · layout/ (shell, nav) · shared/ (cross-feature)
lib/            firebase/ (env + client) · repositories/ · date-time/ · notifications/ · backup/
hooks/          Generic reusable hooks (live queries, now, online, collection actions)
functions/          Cloud Functions (trusted runtime; Admin SDK lives only here)
public/sw.js        The single service worker
```

Dependency direction: `app → features → (components, hooks, lib)`; `lib` never imports from `features`. Admin SDK is imported only under `functions/`.

## Principles applied (Tao of React spirit)

- **Pure domain logic is separate from UI**: `task-logic`, `planner-logic`, `reminder-logic`, `routine-logic`, `claim.ts`, `payload.ts` are framework‑free and unit‑tested.
- **Components have one job.** Panels orchestrate; rows/dialogs render; hooks fetch.
- **Data access behind repositories.** Components never call Firestore; they use `useRepoQuery` and `use…Actions` hooks.
- **State is local by default**; the only context is Auth. Values are derived, not mirrored.
- **Effects only for external sync** (subscriptions, SW, timers). Form dialogs mount their form fresh on open, so no effect‑based resets (enforced by the React‑hooks lint rule).
- **A generic `RecordDialog`** is used for the five simple Library record types because the duplication was real; complex forms (tasks, blocks, reminders) use React Hook Form + Zod.

## Data model

```
users/{uid}/journalEntries|tasks|timeBlocks|reminders|routines|learningItems|
            savedResources|ideas|plans|notificationTokens|notificationDeliveries
```

- Dates: local calendar days are `yyyy-MM-dd` strings; instants (`scheduledAt`) are Firestore Timestamps with the user's IANA `timeZone` stored. Time blocks store minutes since local midnight (0–1440) and never cross midnight. Presets use local wall‑clock construction, so DST shifts don't break “tomorrow 9:00”.
- Every document has `schemaVersion`, `createdAt`, `updatedAt` (server timestamps). Bump `SCHEMA_VERSION` and add a migration step when shapes change; backups carry their own `version`.
- Queries are bounded (`limit(500)`), filtered by status/date where it matters (open vs completed tasks, one day of blocks, pending vs closed reminders), and the app needs no composite indexes (lists are filtered by one field and sorted client-side); the only declared index is the collection-group one the reminder Cloud Function uses (`firestore.indexes.json`).

## Offline & privacy

Firestore uses a persistent multi‑tab local cache. On sign‑out the app `terminate()`s Firestore, calls `clearIndexedDbPersistence`, and hard‑navigates to `/sign-in`, so a shared device doesn't retain the previous user's data. The service worker never caches HTML or Firestore traffic.

## Security

Rules (`firestore.rules`) deny by default, scope everything to `request.auth.uid`, allow‑list fields per collection, validate enums/types/sizes, and make `delivery` and `notificationDeliveries` server‑only. Route protection in the UI is convenience, not the boundary.

## Notifications

See [NOTIFICATIONS.md](NOTIFICATIONS.md).

## Key decisions

| Decision                                      | Why                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Next 16 + React 19, no `cacheComponents`      | App is auth‑gated and client‑driven; static shell + client Firestore is simpler and safe. |
| Data‑only FCM + own SW push handler           | One coordinated worker; no second auto‑displayed notification.                            |
| Native `<select>` / date inputs, styled       | Best mobile UX and accessibility; consistent with tokens.                                 |
| Optimistic via Firestore latency compensation | Writes appear instantly; failed writes revert via the listener and toast.                 |
