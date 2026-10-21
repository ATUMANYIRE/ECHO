import { test } from "@playwright/test";
import path from "path";

test.describe("ECHO Workspace Visual Verification", () => {
  test("capture desktop workspace screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3005");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // Allow health check to finish

    await page.screenshot({
      path: path.join(__dirname, "../screenshots/desktop-workspace.png"),
      fullPage: false,
    });
  });

  test("capture mobile workspace screenshot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3005");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(__dirname, "../screenshots/mobile-workspace.png"),
      fullPage: true,
    });
  });
});
