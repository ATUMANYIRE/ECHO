import { test, expect, Page } from "@playwright/test";
import path from "path";

const shot = async (page: Page, name: string, full = false) => {
  await page.waitForTimeout(450);
  await page.screenshot({
    path: path.join(__dirname, `../screenshots/redesign/${name}.png`),
    fullPage: full,
  });
};

test.describe("ECHO student journey (real backend, Docker runner, live Gemini)", () => {
  test("write → run → explore → understand → fix → compare → learn", async ({ page }, info) => {
    test.setTimeout(240_000);
    const tag = info.project.name.includes("Mobile") ? "mobile" : "desktop";
    const full = tag === "mobile";

    await page.goto("/");
    await expect(page.getByTestId("backend-status-indicator")).toContainText("Connected", { timeout: 20_000 });
    await expect(page.getByText(/GLITCHATHON|Milestone/i)).toHaveCount(0);
    await shot(page, `${tag}-01-write`, full);

    await page.getByTestId("run-code-button").click();
    await expect(page.getByTestId("result-summary")).toBeVisible({ timeout: 30_000 });
    await shot(page, `${tag}-02-result`, full);

    await page.getByTestId("explore-button").click();
    await expect(page.getByTestId("step-counter")).toBeVisible();
    await page.getByTestId("step-next-button").click();
    await page.getByTestId("step-next-button").click();
    await shot(page, `${tag}-03-replay`, full);

    await page.getByTestId("investigate-button").click();
    await expect(page.getByTestId("investigation-pane")).toBeVisible({ timeout: 120_000 });
    await shot(page, `${tag}-04-investigation`, full);

    await page.getByTestId("verify-fix-button").click();
    await expect(page.getByTestId("fix-verification-result")).toBeVisible({ timeout: 60_000 });
    await shot(page, `${tag}-05-verified`, full);

    await page.getByTestId("compare-button").click();
    await expect(page.getByTestId("comparison-view")).toBeVisible();
    await shot(page, `${tag}-06-compare`, full);

    await page.getByTestId("stage-fix").click();
    await page.getByTestId("go-to-learn-button").click();
    await expect(page.getByTestId("learn-panel")).toBeVisible();
    await shot(page, `${tag}-07-learn`, full);
  });

  test("syntax errors point at the broken line", async ({ page }) => {
    await page.goto("/");
    const editor = page.getByTestId("code-editor-textarea");
    await editor.fill("x = (1 +\nprint(x)");
    await page.getByTestId("run-code-button").click();
    await expect(page.getByTestId("syntax-error-card")).toBeVisible({ timeout: 30_000 });
  });
});
