# Kyntra --- Staff-Engineer Product & Build Specification

> **Product:** Kyntra\
> **Brand line:** "Kin what belongs to you. Track it."\
> **Public tagline:** "Your life, collected."\
> **Product vision:** A luxurious, personal Life OS: a digital diary,
> planner, reminder system, learning space, and personal knowledge
> library.

# 0. Non-negotiable execution instructions

You are acting as a **staff-level product engineer, architect, and
design-minded frontend engineer**. Build Kyntra from scratch as a
complete, professional, portfolio-quality application.

## Start from scratch --- do not inspect or continue an existing app

- Do **not** inspect, analyze, or attempt to understand the existing
  project implementation before starting.
- Do **not** reuse an existing app architecture or existing product
  code.
- Scaffold a new application from scratch **in the current working
  directory**.
- Do not create a nested `kyntra/` directory or a second repository.
- Create the complete project structure, configuration, dependencies,
  documentation, and application code.
- If the current directory contains files, do not blindly delete
  unrelated user files. Create the new project in the current
  directory and replace only files that must be replaced for the
  scaffold; preserve unrelated files.
- Do not stop after scaffolding or generating a plan. Implement, test,
  and verify the working application.
- Make reasonable engineering decisions independently. Ask only when a
  decision genuinely blocks implementation.

## Quality bar

This is intended to be used daily and showcased publicly on GitHub.
Treat it like a serious product, not a tutorial, prototype, or
disposable demo.

Prioritize: 1. Exceptional luxury visual design and usability. 2.
Reliable reminders, notifications, tasks, and time management. 3. Clear,
scalable architecture and maintainable code. 4. Strict TypeScript,
linting, formatting, testing, security, and documentation. 5. A complete
and coherent product experience rather than disconnected placeholder
screens.

Follow the principles and spirit of Alex Kondov's **The Tao of React**:
https://www.taoofreact.com/ . Apply its principles thoughtfully---clear
component responsibilities, composition, separation of concerns,
predictable state, maintainability, performance awareness, and tests. Do
not cargo-cult patterns or add abstractions without a real need. Do not
reproduce copyrighted book text.

---

# 1. Product vision and experience

Kyntra is a personal home for everything the user wants to remember,
plan, learn, and do.

It combines: - Daily diary and personal journal. - Tasks, todos,
priorities, and deadlines. - Time management, daily planning, and time
blocks. - Reminders with browser and push notifications. - Routines and
habits. - Learning notes and progress. - Saved resources, links,
articles, videos, and social content. - Ideas, goals, future plans, and
travel planning. - Search, templates, reviews, and data portability.

The app should feel like a **premium Mac-inspired digital diary**, not a
generic admin dashboard or a clone of a task manager.

It must be useful from the first launch, support real persistent data,
and have a coherent path for future features.

# 2. Four primary navigation tabs

Keep the main application navigation intentionally simple: **exactly
four primary tabs**.

1.  **Today** --- dashboard, daily overview, quick capture, today's
    tasks, next reminders, and daily reflection.
2.  **Journal** --- daily entries, writing experience, calendar, and
    journal search.
3.  **Plan** --- tasks, todos, time blocks, daily/weekly planner,
    reminders, routines, and goals.
4.  **Library** --- learning, knowledge vault, saved resources, ideas,
    future plans, travel notes, and templates.

Settings, profile/account actions, backup, and notification preferences
should be accessible from a discreet settings/menu entry, not counted as
a fifth primary tab.

On mobile, use a refined bottom navigation or compact mobile navigation.
Do not simply shrink the desktop sidebar.

---

# 3. Complete feature map

Build a well-integrated first release. Prioritize the core features
listed as **Phase 1** below, but establish domain boundaries and
navigation/data foundations that allow the remaining features to be
added cleanly.

## 3.1 Today dashboard --- Phase 1

- Current date and a warm, editorial greeting.
- Today's tasks, completed count, and overdue count.
- Upcoming and due reminders.
- Today's scheduled time blocks and next activity.
- Quick Capture entry point.
- Daily journal prompt / write today's entry action.
- A small recent activity section.
- Useful empty states and onboarding for a new user.
- Dashboard data must come from actual stored records; no fabricated
  metrics or fake activity.

## 3.2 Journal and diary --- Phase 1

- Create, edit, delete, and browse dated journal entries.
- Optional title, date, rich Markdown-capable body, and timestamps.
- Autosave with honest `Saving`, `Saved`, and error states.
- Search entries and browse chronologically or by calendar.
- Distraction-free writing mode.
- Markdown formatting and readable preview.
- Optional mood/energy/focus fields should be unobtrusive and
  skippable.
- Journal content must persist reliably across reloads and offline
  sessions.

## 3.3 Tasks and todos --- Phase 1

- Create, edit, complete, reopen, postpone, archive, and delete tasks.
- Title, optional description, priority, status, due date/time,
  estimated duration, tags, and optional notes.
- Views: Today, Upcoming, All, Completed.
- Filters and sorting by status, priority, and date.
- Overdue, due today, and upcoming visual states.
- Optional subtasks.
- Recurring tasks should be supported if the core task model can
  handle them cleanly; otherwise design for them and document as the
  next increment.
- Completion and edits update all related views immediately.

## 3.4 Time management and planner --- Phase 1

This is a core product feature, not a placeholder.

- Daily planner with a readable vertical timeline.
- Create, edit, move, resize where practical, and delete time blocks.
- Each block includes title, date, start/end time, optional notes, and
  optional linked task.
- Show current time and distinguish past, current, and upcoming
  blocks.
- Display schedule gaps so users can see available time.
- Detect overlapping time blocks and clearly warn the user before
  saving.
- Validate end time is after start time; handle day boundaries and
  local time correctly.
- Provide a "Plan my day" flow using tasks due today.
- Support daily and weekly views; weekly view can be a focused
  follow-up if daily planner quality is stronger.
- Keep planned duration distinct from actual tracked time.
- A focus timer / Pomodoro session is desirable after the planner's
  core flows are reliable.

## 3.5 Reminders and notifications --- Phase 1

Reminders must be real, persistent, and integrated with the planner and
dashboard.

- Create, edit, complete/dismiss, snooze, and delete reminders.
- Title, optional note, scheduled date/time, status, and optional
  linked task or time block.
- Presets: later today, tomorrow, next week, and custom date/time.
- Dedicated reminder views: Upcoming, Due, Completed, and Past due.
- Dashboard shows the next reminders.
- Snooze options such as 10 minutes, 1 hour, later today, and
  tomorrow.
- User-controlled notification preferences and permission flow.
- Request browser notification permission only after a clear user
  action.
- In-app reminders must work even if notification permission is
  denied.
- Recalculate due reminders on app startup, focus/visibility changes,
  and relevant schedule updates. Do not rely solely on in-memory
  timers.
- Handle time zones and daylight-saving changes correctly.

### Notification delivery architecture

Implement a real notification architecture with clearly documented
delivery guarantees.

- Use the browser Notification API for foreground / active-app
  notifications where appropriate.
- Implement **Firebase Cloud Messaging (FCM) web push** for push
  notifications when the app is not in the foreground, subject to
  browser/platform support and permission.
- Configure the required service worker (for example, Firebase
  messaging service worker) correctly. Ensure it does not conflict
  with the PWA service worker; use one coordinated service-worker
  strategy.
- Store each user's FCM registration tokens in Firestore with
  ownership and lifecycle management. Support token refresh, invalid
  token cleanup, and multiple devices.
- A reminder must be stored durably in Firestore with a scheduled
  timestamp and delivery state. Do not rely on a browser `setTimeout`
  to deliver a reminder when the app is closed.
- Implement server-side scheduled delivery using Firebase Cloud
  Functions and a scheduler/queue design appropriate to the scale. A
  scheduled function or Cloud Scheduler-triggered worker should query
  due reminders, claim them safely, send FCM messages, and update
  delivery state.
- Make delivery idempotent: retries must not send duplicate
  notifications. Use a delivery record / status transition /
  transaction or equivalent safe claim mechanism.
- Handle failures, retries, expired tokens, permission denial, and
  already-completed/canceled reminders.
- Notification click should open the correct Kyntra screen and
  relevant reminder/task.
- Include a testable development path and clear Firebase
  setup/deployment instructions.
- Do not claim guaranteed delivery: browser permissions, device
  settings, network, operating system, and Firebase infrastructure
  affect delivery. Explain limitations honestly.

**Important billing note:** Some Firebase server-side capabilities,
scheduled jobs, and Cloud Functions deployments may require enabling the
Firebase Blaze billing plan and a Google Cloud billing account. Document
this clearly. Do not silently enable paid services or claim the backend
is free. Design cost-conscious queries, indexes, and scheduling.

## 3.6 Quick Capture --- Phase 1

A fast, globally accessible capture flow for: - Thought / note. -
Journal entry. - Task. - Reminder. - Idea / saved resource (where the
relevant Phase 1 Library capture is available).

Keep capture fast. Avoid forcing a large form for a simple note. Support
keyboard shortcuts where sensible.

## 3.7 Library --- Phase 1 foundation, then expand

Build a useful Library landing screen and implement the following in
coherent increments:

### Learning Center

- User-created learning categories and topics.
- Example categories: Software Engineering, JavaScript/TypeScript,
  React/Next.js, System Design, English, vocabulary, grammar,
  speaking, and general interests.
- Learning notes, sessions, resources, progress/status, and
  next-review date.
- Search and tags.

### Knowledge Vault

- Save URL, title, source/platform, notes, tags, collection, date
  saved, and read/watch status.
- Save articles, videos, social posts, documentation, and useful web
  resources.
- Manual entry must work even when external metadata cannot be
  fetched.
- Do not scrape platforms or claim metadata extraction is guaranteed.

### Ideas

- Quick idea inbox.
- Tags and status: inbox, exploring, planned, in progress, done,
  archived.
- Convert an idea into a task or plan without losing the original
  context.

### Goals and future plans

- Goals, tentative plans, and someday/maybe items.
- Statuses such as considering, planned, active, completed, canceled.
- Optional target dates and notes.

### Travel planning

- Destinations, tentative dates, itinerary notes, links, and budget
  notes.
- No booking or external travel integration required in the first
  release.

### Templates

- Daily journal, morning/evening reflection, weekly review, learning
  note, vocabulary, idea, and trip plan templates.
- Allow creating and editing personal templates in a later increment.

## 3.8 Routines and habits

- Create routines with frequency and schedule.
- Daily/weekly completion tracking.
- Streaks should be optional and not shame-oriented.
- Rest days and skipped states.
- Show routine actions in Today and Plan.

## 3.9 Search, review, and export

- Global search across journal, tasks, reminders, ideas, and saved
  resources.
- Tags, filters, favorites, and collections.
- Daily / weekly / monthly review.
- Insights such as completed tasks, learning time, habit consistency,
  and planned vs completed activity; never fabricate metrics.
- JSON backup/export and safe import with validation.
- Markdown export for journal entries and learning notes; expand to
  ZIP/archive export later.
- Data portability is a product principle. Avoid lock-in.

---

# 4. Visual design --- luxury premium is mandatory

The UI must feel exceptionally polished, like a premium native Mac app
blended with a beautiful editorial diary.

## Art direction

- Quiet luxury, refined editorial design, warm diary atmosphere.
- Mac-inspired application shell and interactions.
- Warm ivory / parchment backgrounds, paper-like content surfaces,
  deep charcoal typography.
- Restrained sage, olive, and muted terracotta accents.
- Elegant serif for selected headings and journal/editorial moments;
  modern readable sans-serif for interface and body copy.
- Generous whitespace and deliberate typographic hierarchy.
- Delicate borders, fine shadows, subtle depth, carefully designed
  hover/focus/pressed states.
- Subtle glassmorphism for floating panels, quick-capture overlays,
  command palette, or selected navigation elements only.
- Keep writing areas and core content surfaces opaque and highly
  readable.
- Refined iconography; use Lucide consistently. Do not use emoji as
  the primary icon system.
- Avoid generic SaaS layouts, loud gradients, excessive cards, random
  colors, and oversized rounded rectangles.
- Every screen must feel like the same carefully art-directed product.

Suggested design tokens: - Background: `#F4F1EA` - Surface: `#FBFAF6` -
Primary text: `#292D2A` - Secondary text: `#77786F` - Deep forest:
`#30382F` - Sage: `#A7AC91` - Terracotta: `#C98468` - Border: `#E5E0D6`

Define colors, spacing, typography, radii, shadows, and motion tokens
centrally using CSS variables / Tailwind theme configuration. Support a
refined dark theme as well as the premium light default.

## Required UI craft

- Design desktop, tablet, and mobile intentionally.
- Use consistent spacing, sizing, typography, controls, dialogs,
  menus, and feedback patterns.
- Provide skeleton/loading, empty, error, success, offline,
  validation, and permission-denied states.
- Make keyboard navigation and focus states excellent.
- Respect `prefers-reduced-motion`.
- Use subtle transitions, not excessive animation.
- Make the planner timeline and journal editor especially beautiful
  and usable.
- Use realistic sample/demo data only in an explicitly labeled demo
  state; never pretend sample data is the user's saved data.
- No dead buttons or decorative controls that imply functionality.

---

# 5. Technology stack and required tooling

Use current stable, mutually compatible versions at implementation time.
Do not install packages blindly; choose and document compatible
versions.

## Frontend

- Next.js (App Router) + React + strict TypeScript.
- Tailwind CSS.
- shadcn/ui as the component foundation, with reusable
  product-specific components.
- Radix UI primitives through shadcn/ui where appropriate.
- Lucide React icons.
- React Hook Form + Zod for substantial forms.
- A robust date/time library (choose one, such as date-fns or Day.js)
  and use it consistently.
- Markdown editor and safe Markdown rendering with sanitization. Never
  render untrusted HTML unsafely.
- A maintained PWA / service-worker setup compatible with the selected
  Next.js version.
- Firebase Web SDK for client authentication, Firestore, and FCM.

## Backend / Firebase

- Firebase Authentication.
- Cloud Firestore.
- Firebase Cloud Messaging.
- Firebase Cloud Functions for server-side notification scheduling and
  delivery.
- Firebase Admin SDK only in trusted server-side function/runtime
  code.
- Cloud Scheduler or an appropriate scheduled-trigger mechanism for
  due reminder processing.
- Firebase Emulator Suite for local development and testing where
  practical.

## Code quality and developer experience

- TypeScript strict mode.
- ESLint with a consistent Next.js / TypeScript configuration and
  rules that catch real defects.
- Prettier with a committed configuration.
- ESLint and Prettier must not fight each other; use compatible
  config/plugins and define clear scripts.
- `lint`, `typecheck`, `format`, `format:check`, `test`, and `build`
  scripts.
- Husky + lint-staged for pre-commit checks if setup remains reliable
  and lightweight.
- Vitest + React Testing Library for unit/component tests.
- Playwright for critical end-to-end journeys.
- Firebase Emulator Suite for auth/firestore/functions testing where
  practical.
- GitHub Actions CI to run install, lint, typecheck, tests, and
  production build on pull requests / pushes.
- A clear README and architecture documentation.

Potential packages (choose only what is justified and compatible): -
`firebase` - `zod` - `react-hook-form` - `@hookform/resolvers` -
`date-fns` - `lucide-react` - `dexie` only if a local cache/offline
layer is genuinely needed alongside Firestore - `vitest` -
`@testing-library/react` - `@testing-library/user-event` -
`@playwright/test` - `prettier` - `eslint` - `husky` - `lint-staged`

Use shadcn/ui CLI to initialize and add only the components actually
needed. Do not install every shadcn component.

---

# 6. Firebase, data architecture, and security

Firebase is part of the intended product architecture. Do not silently
replace it with local-only storage.

## Authentication

- Implement Firebase Authentication with a sensible initial sign-in
  flow (email/password and/or Google sign-in; choose the simplest
  robust option and document setup).
- Include sign-in, sign-up, sign-out, loading, error, and
  unauthenticated states.
- Protect authenticated app routes.
- Do not build a fake authentication UI that does not authenticate.
- Provide a clear first-run experience.

## Firestore data model

Design a clear user-owned data model. A reasonable starting point is:

```text
users/{uid}
users/{uid}/journalEntries/{entryId}
users/{uid}/tasks/{taskId}
users/{uid}/timeBlocks/{blockId}
users/{uid}/reminders/{reminderId}
users/{uid}/routines/{routineId}
users/{uid}/learningItems/{itemId}
users/{uid}/savedResources/{resourceId}
users/{uid}/ideas/{ideaId}
users/{uid}/plans/{planId}
users/{uid}/templates/{templateId}
users/{uid}/notificationTokens/{tokenId}
users/{uid}/notificationDeliveries/{deliveryId}
```

Adjust the model if needed, but keep user data isolated by UID. Use
typed repositories / data-access functions and validated domain inputs.
Avoid components calling Firestore directly throughout the UI.

- Include `createdAt` and `updatedAt` where appropriate.
- Use server timestamps where trustworthy server ordering is required.
- Use stable document IDs.
- Add required Firestore indexes.
- Avoid unbounded collection reads; paginate or query by date/status
  as appropriate.
- Keep queries cost-conscious.
- Handle optimistic updates and rollback/error states carefully.
- Add schema/version strategy for future data migrations.

## Firestore security rules

Security is non-negotiable:

- Deny access by default.
- A user may read/write only their own user document and
  subcollections.
- Validate authenticated UID ownership in rules.
- Validate allowed fields and basic data types where practical.
- Prevent clients from writing privileged notification delivery
  statuses or server-owned fields.
- Notification scheduling/delivery state changes must be performed by
  trusted Cloud Functions.
- Add Firestore rules tests using the Firebase Emulator where
  practical.
- Never rely on frontend route protection as the security boundary.

## Environment variables and secrets --- GitHub-safe

Set up environment configuration professionally from the beginning.

- Commit `.env.example` (or `.env.local.example`) containing variable
  names and safe placeholder values only.
- Add `.env`, `.env.*`, local environment files, Firebase
  service-account JSON files, private keys, credentials, and generated
  secrets to `.gitignore`.
- Keep actual values in `.env.local` for local development; never
  commit it.
- Add environment validation at startup using Zod or an equivalent
  typed validation layer.
- Fail with a clear, actionable error when required variables are
  missing or malformed. Do not silently continue with undefined
  Firebase configuration.
- Separate public client configuration from private server secrets.
- Next.js variables prefixed with `NEXT_PUBLIC_` are bundled into
  browser code. Firebase web app configuration values are
  client-visible by design; do not falsely describe them as private
  secrets. Secure Firebase resources with Auth, Firestore Security
  Rules, App Check where appropriate, and restricted API key settings.
- Never put Firebase Admin private keys, service-account JSON, FCM
  server credentials, or other privileged secrets in `NEXT_PUBLIC_*`
  variables.
- Keep Admin SDK initialization exclusively in Cloud Functions /
  trusted server runtime.
- Use the platform's secret manager / Firebase Functions secrets for
  production secrets, not committed files.
- Provide safe setup documentation and placeholder examples.
- Ensure logs never print tokens, passwords, private keys, or full
  sensitive environment objects.
- Before finalizing, inspect the staged Git changes and verify no real
  `.env`, private key, service-account file, or credential is tracked.
- Include a `.gitignore` appropriate for Next.js, Node, Firebase, test
  output, and local environment files.

Example variable names only (do not invent real credentials):

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_public_web_push_vapid_key

# Server-only values: never prefix these with NEXT_PUBLIC_
# Configure through Firebase Functions secrets / trusted deployment environment.
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Do not require the Admin variables in the browser application. Validate
frontend and server/function environments separately. Prefer application
default credentials in deployed Google Cloud runtimes when possible
instead of manually managing a service-account private key.

## Firebase App Check and abuse protection

- Document App Check and enable it when practical for production.
- Apply sensible rate limits / abuse protections to callable or HTTP
  endpoints.
- Validate all server inputs; never trust client-supplied UID,
  delivery status, or scheduled-send claims.
- Do not expose privileged Cloud Function endpoints unnecessarily.

---

# 7. PWA and offline experience

- Installable PWA with manifest, icons, theme colors, and app
  metadata.
- Cache the application shell and static assets safely.
- Provide an intentional offline state and explain when a feature
  requires network connectivity.
- Use Firestore's supported offline persistence carefully and document
  behavior across browser tabs/devices.
- Do not cache authenticated/private data in a way that leaks it
  between users on a shared device.
- Handle sign-out by clearing user-specific in-memory state and any
  unsafe local caches.
- Coordinate the PWA service worker and Firebase messaging service
  worker; do not register conflicting workers.
- Test installability and service-worker behavior in supported
  browsers.

---

# 8. Architecture and Tao of React standards

Organize the app by product domains and responsibilities. A possible
structure:

```text
src/
  app/
    (auth)/
    (app)/
    api/                  # only if trusted server routes are needed
  components/
    ui/                   # shadcn primitives and small extensions
    layout/               # app shell, navigation, page layout
    shared/               # genuinely cross-feature components
  features/
    today/
    journal/
    tasks/
    planner/
    reminders/
    quick-capture/
    library/
      learning/
      knowledge/
      ideas/
      plans/
      templates/
    routines/
    settings/
  lib/
    firebase/
      client.ts
      admin.ts            # server/functions only; never imported by client
      env.ts
    repositories/
    notifications/
    date-time/
    validation/
    utils/
  hooks/
  types/
  styles/
functions/
  src/
    reminders/
    notifications/
    shared/
  test/
firestore.rules
firestore.indexes.json
firebase.json
.github/
  workflows/
```

Adapt as needed, but preserve clear boundaries.

## Component and state principles

- Components have one clear responsibility and readable render trees.
- Pages compose features; they should not contain all domain logic.
- Prefer composition over complex configurable mega-components.
- Keep state local unless multiple features genuinely need to share
  it.
- Derive values instead of duplicating state.
- Avoid unnecessary `useEffect`; use effects for external
  synchronization, not derived calculations.
- Do not memoize everything. Use memoization only when useful.
- Avoid giant contexts and global stores for unrelated data.
- Use custom hooks for meaningful reusable stateful behavior, not
  trivial wrappers.
- Keep data fetching and persistence out of presentational components.
- Use repositories/services for Firestore access and domain
  operations.
- Avoid circular imports and dependency inversion confusion.
- Use clear names and small cohesive modules.
- Avoid premature abstraction, excessive generic helpers, and
  over-engineering.
- No `any`, `@ts-ignore`, or unsafe type casts as shortcuts.
- No giant components, god hooks, or components with unrelated
  responsibilities.
- Avoid prop drilling through many unrelated layers, but do not
  introduce a global state library without need.
- Use accessible, semantic HTML and stable list keys.

## Reusable components and consistency

Create a consistent design system from shadcn/ui: - Buttons, inputs,
textareas, selects, checkboxes, badges, tooltips. - Dialogs,
drawers/sheets, popovers, dropdowns, command palette. - Calendar/date
picker and time picker patterns. - Tabs, navigation, cards/panels,
separators, skeletons, toasts. - Empty states, error states,
confirmation dialogs. - Reusable page headers, section headers, metadata
labels, and layout primitives.

Customize shadcn components to Kyntra's visual identity. Do not leave
the default shadcn look untouched. Avoid duplicating nearly identical
components across features. Establish shared variants and tokens. Do not
create a design-system abstraction for every one-off element.

---

# 9. Testing, linting, formatting, and CI

Set up these scripts (names can be adapted, but equivalent checks must
exist):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- Configure strict TypeScript.
- Configure ESLint consistently with Next.js and TypeScript.
- Configure Prettier and ensure ESLint/Prettier do not conflict.
- Ignore generated output, build folders, coverage, and generated
  Firebase files as appropriate.
- Use Husky + lint-staged for pre-commit quality checks if reliable.
- Add GitHub Actions CI for install, lint, typecheck, formatting
  check, unit tests, and build.
- Add tests for:
  - Task filtering and completion.
  - Date/time validation.
  - Time-block overlap detection.
  - Reminder due-state and snooze calculation.
  - Notification payload / deep-link construction.
  - Firestore security rules and user isolation.
  - Critical journal/task/reminder flows.
- Use Firebase Emulator Suite for Firestore rules and Functions tests
  where practical.
- Add Playwright tests for sign-in (with test configuration), create
  task, create time block, create reminder, refresh, and verify
  persistence.
- Run all checks and report actual results. Never claim a command
  passed if it was not run.

---

# 10. Build and implementation sequence

Build from scratch in a disciplined order. Continue until a working
first release exists.

1.  Scaffold Next.js App Router + TypeScript in the current directory.
2.  Configure Tailwind, shadcn/ui, Lucide, design tokens, ESLint,
    Prettier, TypeScript strict mode, scripts, and GitHub CI.
3.  Establish Firebase client initialization, environment validation,
    Auth, Firestore repositories, and emulator configuration.
4.  Add Firestore rules, indexes, and security tests before relying on
    client data access.
5.  Build the four-tab application shell and luxury design system.
6.  Implement Today dashboard with real data.
7.  Implement Journal and reliable autosave.
8.  Implement Tasks and todos.
9.  Implement daily Planner and time-block conflict handling.
10. Implement Reminders and in-app due-state logic.
11. Implement FCM web push and trusted server-side scheduled delivery.
12. Implement Quick Capture and Settings / notification preferences /
    export.
13. Implement Library modules in sensible increments: Learning,
    Knowledge Vault, Ideas, Plans/Travel, Templates.
14. Add routines/habits and reviews where feasible after core features.
15. Add PWA/offline support and verify service-worker compatibility with
    FCM.
16. Add tests, accessibility checks, responsive refinements, and error
    handling.
17. Update README and architecture docs.
18. Run lint, format check, typecheck, unit tests, security rules tests,
    end-to-end tests where configured, and production build. Fix issues.

Do not leave critical features as static mockups. If a feature cannot be
completed due to missing external Firebase credentials or deployment
setup, build its real code path, provide emulator-based verification
where possible, and clearly list the exact setup action still required.
Do not fabricate successful push delivery without real credentials and a
deployed scheduler.

---

# 11. Required documentation

Create and maintain:

- `README.md`: product overview, screenshots section, features,
  prerequisites, setup, scripts, Firebase setup, local development,
  deployment, and known limitations.
- `docs/ARCHITECTURE.md`: application layers, feature boundaries, data
  flow, Firebase model, notification architecture, and key decisions.
- `docs/ENVIRONMENT.md`: each environment variable, where it is used,
  whether it is public or secret, and how to configure it safely.
- `docs/NOTIFICATIONS.md`: browser permission, FCM setup, service
  worker, scheduled function, delivery lifecycle, limitations, and
  Firebase billing requirements.
- `docs/ROADMAP.md`: Phase 1 completion and next planned increments.

Never put real credentials, private keys, tokens, or personal data in
documentation or screenshots.

---

# 12. Definition of done

The project is not complete until:

- [ ] A new Next.js + TypeScript project has been created in the
      current directory.
- [ ] The app has exactly four primary navigation tabs: Today,
      Journal, Plan, Library.
- [ ] shadcn/ui is installed and customized into a consistent Kyntra
      design system.
- [ ] UI is exceptionally polished, responsive, accessible, and
      coherent.
- [ ] Firebase Auth works when configured.
- [ ] Firestore persistence works when configured.
- [ ] Firestore rules isolate every user's data.
- [ ] Environment variables are validated and documented.
- [ ] `.env.example` contains placeholders only.
- [ ] `.gitignore` protects local env files and credentials.
- [ ] No private credentials or service-account files are tracked.
- [ ] Journal create/edit/delete/autosave works.
- [ ] Tasks and todos work and persist.
- [ ] Daily planner and time blocks work.
- [ ] Time-block conflicts are detected.
- [ ] Reminders can be created, edited, snoozed, completed, and
      deleted.
- [ ] In-app reminders work.
- [ ] FCM web push code and server-side scheduled delivery are
      implemented and documented.
- [ ] Notification delivery is idempotent and handles invalid
      tokens/failures.
- [ ] Quick Capture works.
- [ ] Library has functional foundations and implemented modules are
      not fake placeholders.
- [ ] PWA installability and service-worker behavior are verified
      where supported.
- [ ] Tests cover core domain logic and important security rules.
- [ ] Lint, formatting check, typecheck, tests, and build have been
      run and results reported accurately.
- [ ] README and supporting docs are complete.
- [ ] No dead buttons, fake data presented as real, or misleading
      feature claims remain.

---

# 13. Final engineering handoff

At the end, report:

1.  What was scaffolded and the exact stack/package choices.
2.  The final folder structure and architectural boundaries.
3.  Which features are fully working.
4.  Which features need Firebase project credentials or deployment
    configuration.
5.  Exact environment setup steps, without exposing secrets.
6.  How to run locally and how to run Firebase emulators.
7.  How to deploy the frontend and Firebase Functions.
8.  Firebase billing implications for scheduled push notifications.
9.  Actual lint, format, typecheck, test, rules-test, and build results.
10. Known limitations and the next roadmap items.

**Final instruction:** Make Kyntra feel like a premium product built by
a thoughtful engineering team. Use strong judgment, maintain
professional standards, and deliver real functionality. Do not trade
security, architecture, or reliability for superficial visual polish.

**App Name: Kyntra Life**
**Tagline:** Your life, collected.
