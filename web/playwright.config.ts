import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

// Playwright's own process doesn't read Next.js's .env.local automatically
// (only `next dev` does) — load it here so E2E_* vars reach auth.setup.ts.
try {
  const envFile = readFileSync(join(__dirname, ".env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
  }
} catch {
  // .env.local is optional (e.g. in CI, vars come from secrets)
}

const PORT = process.env.E2E_PORT || "3100";
const E2E_BASE_URL = process.env.E2E_BASE_URL || undefined;
const BASE_URL = E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    locale: "ko-KR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "public",
      testMatch: /public\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated",
      testMatch: /authed\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: "./e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
    {
      name: "admin",
      testMatch: /admin\/.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: "./e2e/.auth/admin.json" },
      dependencies: ["setup"],
    },
  ],
  // Only spins up a local dev server when no external E2E_BASE_URL was provided
  // (e.g. a Vercel preview URL) — matches the "test against localhost by default" decision.
  webServer: E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
