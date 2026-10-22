import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900, isMobile: false },
  { name: "desktop-1366x768", width: 1366, height: 768, isMobile: false },
  { name: "tablet-768x1024", width: 768, height: 1024, isMobile: true },
  { name: "mobile-390x844", width: 390, height: 844, isMobile: true },
];

test.describe("ECHO — Final Frontend Verification & Responsive Visual Audit", () => {
  test("Complete 13-step user journey with real Docker sandbox & live Gemini AI", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // 1. Open the workspace
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page).toHaveTitle(/ECHO/);
    await expect(page.locator("header")).toContainText("ECHO");
    await expect(page.locator("header")).toContainText("API Online", { timeout: 15000 });

    // 2. Enter / verify buggy Python program
    const editor = page.getByTestId("code-editor-textarea");
    await expect(editor).toBeVisible();
    const initialCode = await editor.inputValue();
    expect(initialCode).toContain("total = score");

    // Check for horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    // 3. Execute inside Docker
    const runBtn = page.getByTestId("run-code-button");
    await expect(runBtn).toBeEnabled();
    await runBtn.click();

    // 4. Inspect the output and trace
    const authBadge = page.getByTestId("authoritative-trace-badge");
    await expect(authBadge).toBeVisible({ timeout: 25000 });
    await expect(authBadge).toContainText("Verified Container Trace");

    const callStack = page.getByTestId("call-stack-view");
    await expect(callStack).toBeVisible();
    await expect(callStack).toContainText("<module>");

    // Output tab inspection
    const outputTab = page.getByTestId("output-tab-button");
    await outputTab.click();
    const outputContent = page.getByTestId("terminal-output-content");
    await expect(outputContent).toBeVisible();
    await expect(outputContent).toContainText("33.333333333333336");

    // Switch back to Trace
    const traceTab = page.getByTestId("tab-timeline-button");
    await traceTab.click();

    // 5. Play and pause execution
    const playPauseBtn = page.getByTestId("replay-play-pause-button");
    await expect(playPauseBtn).toBeVisible();
    await playPauseBtn.click(); // Play
    await page.waitForTimeout(600);
    await playPauseBtn.click(); // Pause

    // 6. Step forward and backward
    const nextBtn = page.getByTestId("step-next-button");
    const prevBtn = page.getByTestId("step-prev-button");
    await nextBtn.click();
    await nextBtn.click();
    await prevBtn.click();

    // 7. Inspect variable histories (Evolution tab)
    const evoTab = page.getByTestId("tab-evolution-button");
    await evoTab.click();
    const evoCard = page.getByTestId("variable-evolution-card");
    await expect(evoCard).toBeVisible();
    await expect(evoCard).toContainText("Causal Variable Evolution");

    const totalNodes = page.locator("[data-testid^='evolution-node-']");
    await expect(totalNodes.first()).toBeVisible();

    // 8. Compare buggy and corrected runs
    // Pin current run as Run A
    const setRunABtn = page.getByRole("button", { name: "Set as Run A" });
    await setRunABtn.click();

    // Apply fix: total += score
    const applyFixPresetBtn = page.getByRole("button", { name: "Apply Fix (+=)" });
    await applyFixPresetBtn.click();
    await expect(editor).toHaveValue(/total \+= score/);

    // Execute corrected program in Docker
    await runBtn.click();
    await expect(authBadge).toBeVisible({ timeout: 25000 });

    // Pin current run as Run B
    const setRunBBtn = page.getByRole("button", { name: "Set as Run B" });
    await setRunBBtn.click();

    // Switch to Compare tab
    const compareTab = page.getByTestId("tab-compare-button");
    await compareTab.click();
    const compView = page.getByTestId("comparison-view");
    await expect(compView).toBeVisible();
    await expect(compView).toContainText("Run A");
    await expect(compView).toContainText("Run B");
    await expect(compView).toContainText("33.333333333333336");
    await expect(compView).toContainText("80.0");
    await expect(compView).toContainText("Variable Trajectory Comparison");

    // Reload initial buggy code for AI investigation
    const presetSelect = page.getByTestId("preset-benchmark-select");
    await presetSelect.selectOption("accumulator");
    await runBtn.click();
    await expect(authBadge).toBeVisible({ timeout: 25000 });

    // 9. Request a real Gemini investigation
    const investigateBtn = page.getByTestId("investigate-button");
    await expect(investigateBtn).toBeVisible();
    await expect(investigateBtn).toBeEnabled();
    await investigateBtn.click();

    // Verify investigation pane and hypothesis
    const pane = page.getByTestId("investigation-pane");
    await expect(pane).toBeVisible({ timeout: 45000 });
    const hypothesisCard = page.getByTestId("root-cause-hypothesis-card");
    await expect(hypothesisCard).toBeVisible({ timeout: 45000 });
    await expect(hypothesisCard).toContainText("Root-Cause Hypothesis");

    // 10. Follow cited trace steps
    const stepCitations = page.locator("[data-testid^='citation-step-']");
    const citationCount = await stepCitations.count();
    expect(citationCount).toBeGreaterThan(0);
    await stepCitations.first().click();

    // 11. Preview suggested correction
    const proposedCard = page.getByTestId("proposed-correction-card");
    await expect(proposedCard).toBeVisible();
    await expect(proposedCard).toContainText("Proposed Correction");

    // 12. Verify the fix inside Docker
    const verifyFixBtn = page.getByTestId("verify-fix-button");
    await expect(verifyFixBtn).toBeVisible();
    await verifyFixBtn.click();

    const verifiedBanner = page.getByTestId("sandbox-verified-banner");
    await expect(verifiedBanner).toBeVisible({ timeout: 35000 });
    await expect(verifiedBanner).toContainText("Correction Verified in Sandbox");
    await expect(page.getByTestId("fix-verification-result")).toContainText(
      "Passing observed checks verifies behavior for tested inputs but does not prove universal algorithm correctness."
    );

    // Apply fix to editor
    const applyToEditorBtn = page.getByTestId("apply-fix-button");
    await applyToEditorBtn.click();
    expect(await editor.inputValue()).toContain("total += score");

    // 13. Complete a learning challenge
    const challengeCard = page.getByTestId("learning-challenges-card");
    if (await challengeCard.isVisible()) {
      const optionBtn = page.locator("[data-testid^='challenge-option-']").first();
      if (await optionBtn.isVisible()) {
        await optionBtn.click();
        const submitChallengeBtn = page.getByTestId("submit-challenge-button");
        await submitChallengeBtn.click();
        await expect(page.getByTestId("challenge-feedback-card")).toBeVisible();
      }
    }
  });

  for (const vp of VIEWPORTS) {
    test(`Visual & usability audit across viewport: ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(page.locator("header")).toContainText("API Online", { timeout: 15000 });

      // Run code to populate active state
      const runBtn = page.getByTestId("run-code-button");
      await expect(runBtn).toBeEnabled();
      await runBtn.click();
      await expect(page.getByTestId("authoritative-trace-badge")).toBeVisible({ timeout: 25000 });

      // Run AI Investigation to populate diagnosis
      const investigateBtn = page.getByTestId("investigate-button");
      await investigateBtn.click();
      await expect(page.getByTestId("root-cause-hypothesis-card")).toBeVisible({ timeout: 45000 });

      // Verify fix to display verified banner
      const verifyFixBtn = page.getByTestId("verify-fix-button");
      await verifyFixBtn.click();
      await expect(page.getByTestId("sandbox-verified-banner")).toBeVisible({ timeout: 35000 });
      await page.waitForTimeout(500);

      // Verify zero horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(hasHorizontalOverflow).toBe(false);

      // Capture screenshot
      const screenshotsDir = path.resolve(process.cwd(), "e2e-screenshots");
      fs.mkdirSync(screenshotsDir, { recursive: true });
      const screenshotPath = path.resolve(screenshotsDir, `${vp.name}-audit.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // Copy to artifacts dir
      const artifactDir = "C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\0432aae0-6b7f-405e-a99a-c0d90fd2408b";
      try {
        fs.copyFileSync(screenshotPath, path.join(artifactDir, `${vp.name}-audit.png`));
        if (vp.name === "desktop-1440x900") {
          fs.copyFileSync(screenshotPath, path.join(artifactDir, "desktop-final-release.png"));
        } else if (vp.name === "mobile-390x844") {
          fs.copyFileSync(screenshotPath, path.join(artifactDir, "mobile-final-release.png"));
        }
      } catch (e) {
        console.warn("Could not copy screenshot to artifact dir:", e);
      }
    });
  }
});
