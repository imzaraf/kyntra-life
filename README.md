# Kyntra Life

> _Kin what belongs to you. Track it._
> **Your life, collected.**

Kyntra Life is the app I wanted for myself: one calm place for my diary, my to-do list, my calendar, my reminders, and all the things I'm learning and saving along the way.

Most productivity tools feel like dashboards. I wanted this one to feel like a nice notebook. It has warm paper tones, a serif headline font, soft shadows, and a layout that feels at home on a Mac or a phone. It's a personal project that I use every day and also treat as a serious piece of engineering.

<!-- Add screenshots here: Today, Planner, Journal, and a mobile bottom sheet.
     Use test data only, never anything personal. -->

## What's inside

The app has exactly four tabs, on purpose.

**Today** is your home screen. It has a greeting, what's due, what's next on your schedule, upcoming reminders, your routines, and a gentle journal prompt. Everything on it comes from what you've actually saved, so there are no made-up stats.

**Journal** is a Markdown diary that saves as you write. It tells you honestly whether it's saving, saved, saved on your device while offline, or failed. There's a calendar, search, a distraction-free focus mode, and optional mood, energy, and focus dots you can ignore.

**Plan** covers the following:

- **Tasks** with priorities, due dates, subtasks, tags, and filters.
- **Planner**, a day and week timeline where you can drag blocks to move them and pull the edge to resize. It warns you about overlaps, shows your free time, and has a "Plan my day" button that fits today's tasks into the gaps.
- **Reminders** with snooze, presets like "tomorrow morning", and real push notifications.
- **Routines** that don't guilt-trip you. Rest days and skipped days never count against you.
- **Goals** and future plans.

**Library** is where the long-term stuff lives: a learning center, a link vault, an ideas inbox (turn any idea into a task with one tap), trip planning, and a handful of built-in templates like weekly review and evening reflection.

Settings (notifications, theme, backup) live in the account menu instead of taking a fifth tab. Press **⌘K** (or **Ctrl+K**) anywhere to capture a thought, task, reminder, or link in a couple of seconds.

## Built with

- **Next.js 16** (App Router) and **React 19**, in strict **TypeScript**
- **Tailwind CSS v4** and **shadcn/ui** (Radix), with Lucide icons
- **Firebase**: Authentication, Firestore, Cloud Messaging, and Cloud Functions
- **React Hook Form** and **Zod** for forms and validation, **date-fns** for dates
- **Vitest**, **Testing Library**, and **Playwright** for tests
- ESLint, Prettier, Husky, and GitHub Actions for keeping things tidy

## Running it yourself

You'll need Node 22+ and a Firebase project. The free Spark plan covers everything except scheduled push notifications.

```bash
git clone <your-repo-url>
cd kyntra-life
npm install
npm run functions:install

cp .env.example .env.local            # then fill in your Firebase web config
cp .firebaserc.example .firebaserc    # set your project id

npm run dev
```

Then open http://localhost:3000.

### Setting up Firebase

1. Create a Firebase project and add a **Web app**. Copy its config values into `.env.local`.
2. In **Authentication**, click _Get started_ and enable **Email/Password** (and **Google** if you want it).
3. In **Firestore Database**, create a database in production mode.
4. Publish the security rules and indexes:
   ```bash
   npx firebase login
   npx firebase deploy --only firestore
   ```
5. Optional, for push notifications: generate a Web Push key under Cloud Messaging, put it in `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, upgrade to the Blaze plan, then run `npx firebase deploy --only functions`.

A note on those `NEXT_PUBLIC_` values: Firebase web config is meant to be visible in the browser. It identifies your project and doesn't protect it. The real protection is Firebase Auth plus the Firestore rules in this repo, which let each person read and write only their own data. Still, keep your `.env.local` out of git. It's already ignored.

### Trying it without touching real data

```bash
npm run emulators                       # Auth, Firestore, Functions (Firestore needs Java 21+)
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true npm run dev
```

Use a project id that starts with `demo-` and the emulators can never reach real data.

## Scripts

| Command                       | What it does                                     |
| ----------------------------- | ------------------------------------------------ |
| `npm run dev`                 | Start the dev server                             |
| `npm run build` / `npm start` | Production build and server                      |
| `npm run lint`                | ESLint                                           |
| `npm run typecheck`           | TypeScript check                                 |
| `npm run format:check`        | Prettier check (`npm run format` to fix)         |
| `npm test`                    | Unit tests                                       |
| `npm run test:rules`          | Firestore security rules tests (needs emulator)  |
| `npm run test:e2e`            | Playwright tests (run `npm run emulators` first) |

## How the code is organized

```
app/          Routes and pages
features/     One folder per product area: journal, tasks, planner, reminders, library...
components/   Shared UI: shadcn primitives, layout, and the responsive bottom sheet
lib/          Firebase setup, data repositories, date helpers, backup, notifications
hooks/        Small reusable hooks
functions/    Cloud Functions (the only place that uses the Firebase Admin SDK)
docs/         Architecture, environment, notifications, roadmap
```

The idea is simple: the tricky logic (overlap detection, reminder timing, notification claiming) lives in small plain functions with tests, and the React components stay thin. More detail is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## A few things I'm proud of

- **Reminders that don't double-fire.** A Cloud Function checks every minute and claims each reminder in a transaction before sending, so a retry never sends the same notification twice.
- **Security by default.** Firestore rules deny everything, then allow only the signed-in owner, with checked fields. Clients can't forge notification delivery state.
- **A responsive sheet.** Every dialog is a bottom sheet on phones (swipe to dismiss) and a centered dialog on desktop, from one component.
- **Privacy on shared devices.** Signing out clears the offline cache so the next person can't see your data.
- **Your data is yours.** Export everything as JSON or Markdown, and import it back with validation.

## Honest limitations

- Push notifications are best-effort. Your browser, operating system, battery settings, and network all affect delivery. On iPhone, the app has to be added to the Home Screen first. They also need a real Firebase project with the Blaze plan.
- The Firestore rules tests and real push delivery need Java and live Firebase credentials, so they only run in CI or on your machine with the emulator.
- Recurring tasks, global search, weekly and monthly reviews, a focus timer, and editable templates aren't built yet. See the [roadmap](docs/ROADMAP.md).
- Exports cover up to 500 items per collection.

## More docs

[Architecture](docs/ARCHITECTURE.md) · [Environment variables](docs/ENVIRONMENT.md) · [Notifications](docs/NOTIFICATIONS.md) · [Roadmap](docs/ROADMAP.md)

## Credits

Icons from [Lucide](https://lucide.dev), and from [Flaticon](https://www.flaticon.com) where used. Credit the Flaticon authors as their licence requires.

---

Built by Ahmad Faraz. If you find it useful or spot a bug, feel free to open an issue.
