import { defineConfig } from "vitest/config";

// Firestore rules tests need the emulator: run via `npm run test:rules`.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    testTimeout: 20_000,
    fileParallelism: false,
  },
});
