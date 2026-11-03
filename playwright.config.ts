import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the Firebase Emulator Suite (auth + firestore), never a real project.
 *   Terminal 1: npm run emulators
 *   Terminal 2: npm run test:e2e
 * The demo- project id guarantees emulators can never touch production data.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:3100", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100/sign-in",
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-kyntra.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-kyntra",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:demo",
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
    },
  },
});
