import { test, expect } from "@playwright/test";

test.describe("ECHO Workspace Interface", () => {
  test("loads workspace and displays core panels", async ({ page }) => {
    await page.goto("/");

    // Verify Title & Tagline
    await expect(page).toHaveTitle(/ECHO/);
    await expect(page.locator("header")).toContainText("ECHO");
    await expect(page.locator("header")).toContainText("GLITCHATHON 2026");

    // Verify Editor Pane
    const editor = page.getByTestId("code-editor-textarea");
    await expect(editor).toBeVisible();
    await expect(editor).toHaveValue(/calculate_average/);

    // Verify Expected Behavior Pane
    const intentBox = page.getByTestId("expected-behavior-textarea");
    await expect(intentBox).toBeVisible();

    // Verify Run Controls Disabled
    const runBtn = page.getByTestId("run-code-button");
    await expect(runBtn).toBeDisabled();

    // Verify Timeline Preview
    const badge = page.getByTestId("illustrative-trace-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("Illustrative Preview Only");

    // Verify Step Card
    const stepCard = page.getByTestId("active-step-card");
    await expect(stepCard).toBeVisible();
  });

  test("timeline scrubbing updates step index and line indicator", async ({ page }) => {
    await page.goto("/");

    const nextBtn = page.getByTestId("step-next-button");
    await expect(nextBtn).toBeEnabled();

    // Click next
    await nextBtn.click();
    await expect(page.getByTestId("active-step-card")).toContainText("Step #2");

    // Check variable inspection
    const scoreVar = page.getByTestId("variable-row-scores");
    await expect(scoreVar).toBeVisible();
  });
});
