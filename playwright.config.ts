import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  timeout: 45_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: { baseURL, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: `pnpm exec next dev -p ${port}`, url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000, env: { NEXT_DIST_DIR: ".next-e2e", GO_API_URL: process.env.GO_API_URL ?? "http://127.0.0.1:8080" } },
});
