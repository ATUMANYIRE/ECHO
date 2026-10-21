import { test, expect } from "@playwright/test";

test.describe("ECHO Workspace Interface & Milestone 2 Live Execution", () => {
  test("loads workspace and displays active run controls", async ({ page }) => {
    await page.goto("/");

    // Verify Title & Taglines
    await expect(page).toHaveTitle(/ECHO/);
    await expect(page.locator("header")).toContainText("ECHO");
    await expect(page.locator("header")).toContainText("GLITCHATHON 2026");
    await expect(page.locator("header")).toContainText("Milestone 2");

    // Verify Editor Pane contains default acceptance code
    const editor = page.getByTestId("code-editor-textarea");
    await expect(editor).toBeVisible();
    await expect(editor).toHaveValue(/scores = \[60, 80, 100\]/);

    // Verify Run button is ACTIVE in Milestone 2
    const runBtn = page.getByTestId("run-code-button");
    await expect(runBtn).toBeVisible();
    await expect(runBtn).toBeEnabled();
    await expect(runBtn).toContainText("Run in Sandbox");
  });

  test("executes acceptance buggy program in live Docker sandbox and inspects trace", async ({
    page,
  }) => {
    await page.goto("/");

    // Click Run in Sandbox
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();

    // Verify authoritative trace badge appears
    const authBadge = page.getByTestId("authoritative-trace-badge");
    await expect(authBadge).toBeVisible({ timeout: 10000 });
    await expect(authBadge).toContainText("Verified Container Trace");

    // Verify active step card
    const stepCard = page.getByTestId("active-step-card");
    await expect(stepCard).toBeVisible();

    // Step forward to step 2 where total is in scope (Line 3: total = 0)
    const nextBtn = page.getByTestId("step-next-button");
    await nextBtn.click();
    await nextBtn.click();

    // Verify variable row total exists at this step
    const totalRow = page.getByTestId("variable-row-total");
    await expect(totalRow).toBeVisible();

    // Check Output tab
    const outputTab = page.getByTestId("output-tab-button");
    await outputTab.click();
    const outputContent = page.getByTestId("terminal-output-content");
    await expect(outputContent).toBeVisible();
    await expect(outputContent).toContainText("33.333333333333336");
  });

  test("runs corrected program and verifies 80.0 output", async ({ page }) => {
    await page.goto("/");

    // Click Apply Fix button
    const fixBtn = page.getByRole("button", { name: /Apply Fix/i });
    await fixBtn.click();

    // Verify editor has total += score
    const editor = page.getByTestId("code-editor-textarea");
    await expect(editor).toHaveValue(/total \+= score/);

    // Click Run in Sandbox
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();

    // Verify authoritative trace
    const authBadge = page.getByTestId("authoritative-trace-badge");
    await expect(authBadge).toBeVisible({ timeout: 10000 });

    // Verify Output tab shows 80.0
    const outputTab = page.getByTestId("output-tab-button");
    await outputTab.click();
    const outputContent = page.getByTestId("terminal-output-content");
    await expect(outputContent).toContainText("80.0");
  });
});
