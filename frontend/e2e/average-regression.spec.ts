import { expect, test } from "@playwright/test";

test("Average of scores runs in Docker and replays a real trace", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await expect(page.getByTestId("backend-status-indicator")).toContainText("Connected");
  await expect(page.getByTestId("code-editor-textarea")).toHaveValue(
    "scores = [60, 80, 100]\n" +
      "total = 0\n" +
      "for score in scores:\n" +
      "    total = score\n" +
      "average = total / len(scores)\n" +
      "print(average)",
  );

  await page.getByTestId("run-code-button").click();
  const result = page.getByTestId("result-summary");
  await expect(result).toBeVisible({ timeout: 40_000 });
  await expect(page.getByTestId("run-status")).toHaveText("Finished without errors");
  await expect(result).toContainText(/[1-9]\d* steps recorded/);
  await expect(page.getByTestId("terminal-output-content")).toContainText(
    "33.333333333333336",
  );

  await page.getByTestId("explore-button").click();
  await expect(page.getByTestId("step-counter")).toBeVisible();
});
