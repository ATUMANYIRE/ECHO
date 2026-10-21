import { test } from "@playwright/test";
import path from "path";

test.describe("ECHO Milestone 2 Visual Verification", () => {
  test("capture desktop workspace screenshot with live execution trace", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3005");
    await page.waitForLoadState("networkidle");

    // Click Run in Sandbox
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();

    // Wait for authoritative badge
    await page.waitForSelector('[data-testid="authoritative-trace-badge"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(__dirname, "../screenshots/desktop-workspace-m2.png"),
      fullPage: false,
    });
  });

  test("capture mobile workspace screenshot with live execution", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3005");
    await page.waitForLoadState("networkidle");

    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();
    await page.waitForSelector('[data-testid="authoritative-trace-badge"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(__dirname, "../screenshots/mobile-workspace-m2.png"),
      fullPage: true,
    });
  });
});
