# Kyntra initial build (2026-11-03)

**Goal:** Add the chat-log Stop hook to `.claude/`, then build Kyntra from `KYNTRA_LIFE_CLAUDE_BUILD_SPEC.md` on Next.js ≥15 with a luxury premium UI.

## Decisions (and why)
- Next 16.4.4 / React 19.3 (satisfies "15 or above"); `cacheComponents` left off — app is auth-gated and client-driven.
- shadcn re-initialised with `--base radix` (default preset used Base UI and emitted a bogus `cn` package import; replaced with clsx + tailwind-merge).
- Tailwind v4 compiled via `@tailwindcss/turbopack` loader in `next.config.ts` (no PostCSS config).
- Single service worker `public/sw.js` handles caching, data-only FCM push and notification click; FCM `getToken` gets this registration.
- Reminder delivery: `notifyPending` flag + per-(reminder, scheduledAt) delivery ledger + transactional claim; `delivery` is server-only in rules.
- Form dialogs mount their form fresh on open (lint rule forbids setState-in-effect resets).

## Created / changed
- `.claude/hooks/chat-log.sh`, `.claude/settings.json`, `docs/chat-log/`
- `src/` features: auth, today, journal, tasks, planner, reminders, routines, quick-capture, library/*, settings; shared UI; repositories; backup; date-time; notifications
- `functions/` (scheduled `deliverDueReminders`, pure claim/payload logic), `firestore.rules`, `firestore.indexes.json`, `firebase.json`
- Tests: Vitest (40), `tests/rules/` (not run), `e2e/` (4 pass vs Auth emulator), `.github/workflows/ci.yml`
- Docs: README, `docs/ARCHITECTURE|ENVIRONMENT|NOTIFICATIONS|ROADMAP.md`

## Status / results
lint, typecheck, prettier, build, functions build, 40 unit tests, 4 Playwright tests: pass.

## Left
- Rules tests unrun (no Java locally); real FCM push unverified (needs credentials, Blaze, VAPID key).
- Not built: recurring tasks, global search, reviews/insights, focus timer, personal templates.

## Gotchas
- Prettier once reformatted the spec file before it was added to `.prettierignore`.
- One unreproduced dev hydration warning.
- `.env.local` / `.firebaserc` hold `demo-kyntra` placeholders and are git-ignored.

## Follow-ups (same session)
- Flattened project: `src/` removed; `app/`, `components/`, `features/`, `lib/`, `hooks/`, `types/` now at root (updated tsconfig paths, vitest, prettier, eslint, components.json, docs). Gotcha: stale `.next` types referenced `src/` until deleted.
- Real Firebase config (`kyntra-life`) put in git-ignored `.env.local` / `.firebaserc`; Analytics skipped.
- Flaticon: can't be downloaded automatically (account + attribution). Added `AppIcon` (`components/shared/app-icon.tsx`) + `lib/icons/flaticon.ts` slot list + `public/icons/flaticon/README.md`; falls back to Lucide until SVGs are added.
- Renamed brand to "Kyntra Life" (metadata, logo, manifest, offline page, key UI copy). Backup format id stays `kyntra`.
- Improved auth error messages (operation-not-allowed, configuration-not-found, API key, unauthorized domain; unknown codes shown).
- Sign-in blockers were console-side: Authentication "Get started" + Email/Password provider (now working). Current: "Missing or insufficient permissions" = Firestore DB not created / rules not deployed.

## Left now
- User must create Firestore DB and deploy rules+indexes (`npx firebase login` then `npx firebase deploy --only firestore`); CLI not logged in here, nothing deployed.
- Add Flaticon SVGs; VAPID key; Blaze + functions deploy for push.

## Follow-ups (later in session)
- Firestore "Missing or insufficient permissions": console still had default deny-all rules; user must publish `firestore.rules` (console Rules tab or `firebase deploy --only firestore`) and create indexes. CLI not logged in here; nothing deployed by me.
- Added reusable `components/shared/responsive-dialog.tsx` (`ResponsiveDialog` + `SheetFooter`): CSS-switched bottom sheet (<md, drag handle, swipe-to-dismiss, safe-area, dvh) vs centered dialog (≥md); `surface="glass"` for Quick Capture. Migrated all dialogs (task, block, reminder, record, confirm, plan-my-day, quick capture). Added `interactiveWidget: "resizes-content"` viewport. Verified by screenshots + swipe test; 40 unit tests, lint, tsc, build pass.
- Rewrote `README.md` in a personal GitHub voice (placeholder repo URL + screenshots to fill in; author line to confirm; not yet Prettier-formatted).
- Gotchas: user's own `next dev` runs on :3001 (shares `.next`; I ran `npm run build` once, restart if odd). Turbopack rejects symlinked node_modules (used `cp -Rc` for a scratch copy). Dev "1 Issue" badge in my copy was just missing Firestore emulator.

## Left
- Publish Firestore rules/indexes, add Flaticon SVGs, VAPID key, Blaze + functions deploy; run `npm run format`; fill README placeholders.

## Follow-ups (git + brand assets)
- Pushed initial commit `0c586c7` to `git@github.com:imzaraf/kyntra-life.git` (main). Staged set checked: no env/keys. Pre-commit (husky + lint-staged) ran fine. Suggested repo description/topics given.
- Mapped `public/kyntra-life-brand-assets/` (assets' README assumed `src/`, adapted): `pwa/*.png` → `public/icons/`; merged manifest (kept id/shortcuts/categories); `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.png`, `app/twitter-image.png` (Next file conventions); logos/marks → `public/brand/`. Deleted old placeholder icons; `sw.js` paths updated + cache bumped to v2; layout got `metadataBase` (`NEXT_PUBLIC_SITE_URL` in `.env.example`) and OG/Twitter metadata.
- `components/shared/logo.tsx` now renders real logo (variants horizontal/stacked/mark, light+dark via CSS). Stacked logo files had opaque bg rects → used transparent light file and generated `logo-primary-dark-transparent.svg`. Removed duplicate tagline under auth card.
- Verified in production build of scratch copy: 11 manifest icons + favicon/apple/OG/sw resolve; lint, tsc, prettier, 40 tests pass.

## Left
- Commit/push these brand changes (uncommitted); set `NEXT_PUBLIC_SITE_URL` on deploy; consider moving `public/kyntra-life-brand-assets/` out of `public/`; test PWA install on a real device.
- Still open from before: publish Firestore rules/indexes, Flaticon SVGs, VAPID key, Blaze + functions deploy; README placeholders (repo URL, screenshots).

## Gotchas
- Prettier wraps JSX so python string-replace edits can silently miss (logo class fix needed a second pass) — verify with grep.
- `git rm --cached app/favicon.ico` slip untracked it; re-added.
