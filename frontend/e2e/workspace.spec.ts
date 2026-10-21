import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

test.describe("ECHO Workspace — Milestone 4 Evidence-Grounded AI & Time-Travel Debugger", () => {
  test("1. Loads workspace with Milestone 4 header and active controls", async ({ page }) => {
    await page.goto("/");

    // Verify Title & Taglines
    await expect(page).toHaveTitle(/ECHO/);
    await expect(page.locator("header")).toContainText("ECHO");
    await expect(page.locator("header")).toContainText("GLITCHATHON 2026");
    await expect(page.locator("header")).toContainText("Milestone 4");

    // Verify Run button is active
    const runBtn = page.getByTestId("run-code-button");
    await expect(runBtn).toBeVisible();
    await expect(runBtn).toBeEnabled();
    await expect(runBtn).toContainText("Run in Sandbox");
  });

  test("2. Executes acceptance buggy program, steps replay, and tests Evolution & Prediction", async ({
    page,
  }) => {
    await page.goto("/");

    // Click Run in Sandbox
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();

    // Verify authoritative trace badge
    const authBadge = page.getByTestId("authoritative-trace-badge");
    await expect(authBadge).toBeVisible({ timeout: 15000 });
    await expect(authBadge).toContainText("Verified Container Trace");

    // Verify Call Stack view
    const callStack = page.getByTestId("call-stack-view");
    await expect(callStack).toBeVisible();
    await expect(callStack).toContainText("<module>");

    // Step forward using Replay Controls
    const nextBtn = page.getByTestId("step-next-button");
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await nextBtn.click();

    // Verify variable row total exists at this step
    const totalRow = page.getByTestId("variable-row-total");
    await expect(totalRow).toBeVisible();

    // Replay Controls: test Prev button
    const prevBtn = page.getByTestId("step-prev-button");
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();

    // Switch to Evolution tab
    const evoTab = page.getByTestId("tab-evolution-button");
    await evoTab.click();

    const evoCard = page.getByTestId("variable-evolution-card");
    await expect(evoCard).toBeVisible();
    await expect(evoCard).toContainText("Causal Variable Evolution");

    // Verify evolution nodes for 'total' exist
    const totalNodes = page.locator("[data-testid^='evolution-node-']");
    await expect(totalNodes.first()).toBeVisible();

    // Switch to Predict tab
    const predTab = page.getByTestId("tab-predict-button");
    await predTab.click();

    const predCard = page.getByTestId("prediction-challenge-card");
    await expect(predCard).toBeVisible();
    await expect(predCard).toContainText("Prediction Challenge");

    // Click the first prediction option and verify
    const firstOption = page.locator("[data-testid^='prediction-option-']").first();
    await firstOption.click();

    const submitBtn = page.getByTestId("submit-prediction-button");
    await submitBtn.click();

    // Verify feedback is displayed
    const feedback = page.getByTestId("prediction-feedback");
    await expect(feedback).toBeVisible();

    // Switch to Output tab
    const outputTab = page.getByTestId("output-tab-button");
    await outputTab.click();
    const outputContent = page.getByTestId("terminal-output-content");
    await expect(outputContent).toBeVisible();
    await expect(outputContent).toContainText("33.333333333333336");
  });

  test("3. Compares Run A (Buggy) vs Run B (Corrected) side-by-side", async ({ page }) => {
    await page.goto("/");

    // 1. Run buggy code
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();
    await expect(page.getByTestId("authoritative-trace-badge")).toBeVisible({ timeout: 15000 });

    // 2. Apply fix and run corrected code
    const fixBtn = page.getByRole("button", { name: /Apply Fix/i });
    await fixBtn.click();
    await runBtn.click();
    await page.waitForTimeout(500);
    await expect(runBtn).toBeEnabled({ timeout: 15000 });

    // 3. Switch to Compare Tab
    const compareTab = page.getByTestId("tab-compare-button");
    await compareTab.click();

    const compView = page.getByTestId("comparison-view");
    await expect(compView).toBeVisible();

    // Verify Run A and Run B summary cards inside comparison view
    const runACard = page.getByTestId("run-card-run-a");
    await expect(runACard).toBeVisible();
    const runBCard = page.getByTestId("run-card-run-b");
    await expect(runBCard).toBeVisible();

    // Verify Side-by-side run headers
    await expect(compView).toContainText("Run A (Initial)");
    await expect(compView).toContainText("Run B (Modified)");

    // Verify stdout diff shows difference
    await expect(compView).toContainText("33.333333333333336");
    await expect(compView).toContainText("80.0");

    // Verify variable divergence table
    await expect(compView).toContainText("Variable Trajectory Comparison");
    await expect(compView).toContainText("total");
  });

  test("4. Executes Benchmark Preset 2 (Off-by-one Boundary)", async ({ page }) => {
    await page.goto("/");

    // Select preset
    const presetSelect = page.getByTestId("preset-benchmark-select");
    await presetSelect.selectOption("off_by_one");

    // Verify code changed to off-by-one benchmark
    const editor = page.getByTestId("code-editor-textarea");
    await expect(editor).toHaveValue(/for i in range\(len\(items\) \+ 1\):/);

    // Run in Sandbox
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();

    // Verify trace
    const authBadge = page.getByTestId("authoritative-trace-badge");
    await expect(authBadge).toBeVisible({ timeout: 15000 });

    // Output should show items printed before IndexError
    const outputTab = page.getByTestId("output-tab-button");
    await outputTab.click();
    await expect(page.getByTestId("terminal-output-content")).toContainText("Item 0: alpha");
  });

  test("5. Executes Benchmark Preset 3 (Recursive Factorial) and inspects call stack", async ({
    page,
  }) => {
    await page.goto("/");

    // Select preset
    const presetSelect = page.getByTestId("preset-benchmark-select");
    await presetSelect.selectOption("recursion");

    // Run in Sandbox
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();

    // Verify trace
    const authBadge = page.getByTestId("authoritative-trace-badge");
    await expect(authBadge).toBeVisible({ timeout: 15000 });

    // Step into recursive calls
    const nextBtn = page.getByTestId("step-next-button");
    await nextBtn.click();
    await nextBtn.click();
    await nextBtn.click();

    // Call stack should show factorial
    const callStack = page.getByTestId("call-stack-view");
    await expect(callStack).toBeVisible();

    // Output should show 24
    const outputTab = page.getByTestId("output-tab-button");
    await outputTab.click();
    await expect(page.getByTestId("terminal-output-content")).toContainText("24");
  });

  test("6. Milestone 4 Evidence-Grounded AI Investigation: Citations, Fix Verification & Learning", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Run in Sandbox to generate verified trace
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();
    await expect(page.getByTestId("authoritative-trace-badge")).toBeVisible({ timeout: 15000 });

    // 2. Click "Investigate with AI"
    const investigateBtn = page.getByTestId("investigate-button");
    await expect(investigateBtn).toBeVisible();
    await expect(investigateBtn).toBeEnabled();
    await investigateBtn.click();

    // 3. Verify Investigation Pane appears with Hypothesis and Model info
    const pane = page.getByTestId("investigation-pane");
    await expect(pane).toBeVisible({ timeout: 15000 });
    const hypothesisCard = page.getByTestId("root-cause-hypothesis-card");
    await expect(hypothesisCard).toBeVisible({ timeout: 15000 });
    await expect(hypothesisCard).toContainText("Hypothesis");

    // Check AI Model badge
    const modelBadge = page.getByTestId("investigation-model-badge");
    await expect(modelBadge).toBeVisible();

    // 4. Test clicking an evidence citation pill
    const stepCitations = page.locator("[data-testid^='citation-step-']");
    const count = await stepCitations.count();
    expect(count).toBeGreaterThan(0);
    await stepCitations.first().click();

    // 5. Test "Verify Fix in Sandbox"
    const verifyFixBtn = page.getByTestId("verify-fix-button");
    await expect(verifyFixBtn).toBeVisible();
    await verifyFixBtn.click();

    // Wait for sandbox verification banner
    const verifiedBanner = page.getByTestId("sandbox-verified-banner");
    await expect(verifiedBanner).toBeVisible({ timeout: 15000 });
    await expect(verifiedBanner).toContainText("Correction Verified in Sandbox");
    await expect(page.getByTestId("fix-verification-result")).toContainText(
      "Passing observed checks verifies behavior for tested inputs but does not prove universal algorithm correctness."
    );

    // 6. Test "Apply to Editor"
    const applyFixBtn = page.getByTestId("apply-fix-button");
    await expect(applyFixBtn).toBeVisible();
    await applyFixBtn.click();

    // Verify editor has updated code
    const editor = page.getByTestId("code-editor-textarea");
    const newCode = await editor.inputValue();
    expect(newCode).toContain("total += score");

    // 7. Test Learning Challenges (tab switching and interactive option selection)
    const conceptualTab = page.getByTestId("challenge-tab-conceptual");
    if (await conceptualTab.isVisible()) {
      await conceptualTab.click();
      const optionBtn = page.locator("[data-testid^='challenge-option-']").first();
      await optionBtn.click();
      await expect(page.getByTestId("challenge-explanation")).toBeVisible();
    }
  });

  test("7. Responsive Mobile Viewport & Screenshot Capture (M4)", async ({ page }, testInfo) => {
    if (testInfo.project.name === "Mobile Chrome") {
      await page.goto("/");
      await expect(page.getByTestId("run-code-button")).toBeVisible();
      return;
    }

    // Desktop screenshot with M4 AI Diagnosis active
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const runBtn = page.getByTestId("run-code-button");
    await runBtn.click();
    await expect(page.getByTestId("authoritative-trace-badge")).toBeVisible({ timeout: 15000 });

    // Run AI Investigation
    const investigateBtn = page.getByTestId("investigate-button");
    await investigateBtn.click();
    const hypothesisCard = page.getByTestId("root-cause-hypothesis-card");
    await expect(hypothesisCard).toBeVisible({ timeout: 15000 });

    // Verify fix to display verified banner in screenshot
    const verifyFixBtn = page.getByTestId("verify-fix-button");
    await expect(verifyFixBtn).toBeVisible();
    await verifyFixBtn.click();
    await expect(page.getByTestId("sandbox-verified-banner")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);

    const desktopScreenshotPath = path.resolve(
      process.cwd(),
      "e2e-screenshots",
      "desktop-investigation-m4.png"
    );
    fs.mkdirSync(path.dirname(desktopScreenshotPath), { recursive: true });
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });

    // Mobile screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);

    const mobileScreenshotPath = path.resolve(
      process.cwd(),
      "e2e-screenshots",
      "mobile-investigation-m4.png"
    );
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });

    // Copy to brain artifacts
    const artifactDir = "C:\\Users\\HP\\.gemini\\antigravity-cli\\brain\\0432aae0-6b7f-405e-a99a-c0d90fd2408b";
    try {
      fs.copyFileSync(desktopScreenshotPath, path.join(artifactDir, "desktop-investigation-m4.png"));
      fs.copyFileSync(mobileScreenshotPath, path.join(artifactDir, "mobile-investigation-m4.png"));
    } catch (e) {
      console.warn("Could not copy directly to artifact dir:", e);
    }
  });
});
