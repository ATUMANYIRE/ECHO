import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["*.spec.ts"],
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3005",
    channel: "chrome",
    trace: "off",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        channel: "chrome",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "Mobile Chrome",
      use: {
        channel: "chrome",
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
    },
  ],
});
