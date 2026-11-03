# Roadmap

## Phase 1 — shipped

- Four‑tab luxury shell (desktop sidebar, mobile bottom bar), light/dark themes
- Firebase Auth (email/password + Google), protected routes, user‑isolated Firestore model + rules
- Today dashboard (real data only), Quick Capture (⌘K)
- Journal: Markdown, autosave with honest status, calendar, search, focus mode
- Tasks: create/edit/complete/postpone/archive/delete, subtasks, tags, priorities, filters, sorting
- Planner: day/week, drag + resize, overlap detection, gaps, “Plan my day”
- Reminders: presets, snooze, views, in‑app delivery, FCM push + scheduled Cloud Function
- Library: Learning, Knowledge vault, Ideas (→ tasks), Trips, Goals/plans, built‑in templates
- Routines with rest/skip and non‑punitive consistency
- Settings: notification opt‑in, theme, JSON backup/import (validated), Markdown export
- PWA manifest + single coordinated service worker; offline page

## Next increments

1. **Recurring tasks** (RRULE‑style on the task model; materialise next occurrence on completion)
2. **Global search** across journal, tasks, reminders, ideas, resources (command palette; Firestore‑side index or lightweight client index)
3. **Reviews & insights** — daily/weekly/monthly (completed tasks, learning time, habit consistency, planned vs completed)
4. **Focus timer / Pomodoro** with tracked time distinct from planned time
5. **Personal templates** (create/edit) and template variables
6. **Favorites & collections** across Library
7. **ZIP export** with per‑entry Markdown files
8. **App Check** enforcement and per‑user rate limits for any callable endpoints
9. **Mobile polish**: swipe actions, haptics where available
