# Environment

Copy `.env.example` to `.env.local` (git‑ignored). `.env.example` contains placeholders only.

| Variable                                   | Where used    | Public? | Notes                                                                                 |
| ------------------------------------------ | ------------- | ------- | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | browser       | Yes     | Identifies your project; **not a secret**. Restrict by HTTP referrer in Google Cloud. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | browser       | Yes     |                                                                                       |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | browser       | Yes     |                                                                                       |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | browser       | Yes     | Optional (Storage unused in v1).                                                      |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | browser       | Yes     |                                                                                       |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | browser       | Yes     |                                                                                       |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY`           | browser (FCM) | Yes     | Public Web Push key. Without it, push is disabled with a clear message.               |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`       | browser       | Yes     | `true` connects Auth (9099) and Firestore (8080) emulators.                           |

## Rules

- Everything `NEXT_PUBLIC_*` is bundled into browser code. Security comes from **Auth + Firestore rules + App Check**, not from hiding these values.
- Validation lives in `lib/firebase/env.ts` (Zod). Missing/invalid values surface as an actionable message in the UI.
- **Server secrets never go in `NEXT_PUBLIC_*` or the repo.** Cloud Functions use Application Default Credentials in deployed runtimes — there is no private key to manage. If a function ever needs a secret, use `firebase functions:secrets:set NAME`.
- `.gitignore` excludes `.env*` (except `.env.example`), service‑account JSON files, private keys and `.firebaserc`.
- Logs never print tokens or environment objects.
