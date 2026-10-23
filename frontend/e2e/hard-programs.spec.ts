import { test, expect, Page } from "@playwright/test";
import path from "path";

async function runProgram(page: Page, code: string) {
  await page.goto("/");
  await expect(page.getByTestId("backend-status-indicator")).toContainText("Connected", { timeout: 20_000 });
  await page.getByTestId("code-editor-textarea").fill(code);
  await page.getByTestId("run-code-button").click();
}

const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(__dirname, `../screenshots/redesign/hard-${name}.png`) });

test.describe("Harder programs through the real sandbox", () => {
  test.setTimeout(90_000);

  test("class with methods and nested calls replays with a call stack", async ({ page }) => {
    await runProgram(
      page,
      `class Account:
    def __init__(self, balance):
        self.balance = balance
    def withdraw(self, amount):
        self.balance -= amount
        return self.balance

def process(acct, amounts):
    for a in amounts:
        acct.withdraw(a)
    return acct.balance

acct = Account(100)
data = {k: v * 2 for k, v in {"a": 5, "b": 10}.items()}
print(process(acct, list(data.values())))`
    );
    await expect(page.getByTestId("run-status")).toContainText(/ran|finished|completed/i, { timeout: 30_000 });
    await page.getByTestId("explore-button").click();
    await expect(page.getByTestId("step-counter")).toBeVisible();
    await page.getByTestId("replay-scrubber").focus();
    await page.keyboard.press("End");
    await shot(page, "class-replay-end");
  });

  test("exception deep in nested calls can be jumped to", async ({ page }) => {
    await runProgram(
      page,
      `def inner(d, k):
    return d[k]

def middle(d):
    return inner(d, "missing")

def outer():
    return middle({"present": 1})

print(outer())`
    );
    await expect(page.getByTestId("run-status")).toContainText(/error|stopped/i, { timeout: 30_000 });
    await shot(page, "nested-exception-result");
    await page.getByTestId("explore-button").click();
    await page.getByTestId("jump-to-error-button").click();
    await expect(page.getByTestId("current-source-line")).toContainText("return d[k]");
    await shot(page, "nested-exception-replay");
  });

  test("infinite loop is stopped with a friendly message", async ({ page }) => {
    test.setTimeout(120_000);
    await runProgram(page, `n = 0\nwhile True:\n    n += 1`);
    await expect(page.getByTestId("result-summary")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("result-summary")).toContainText(/time limit|long time|stopped|recorded/i);
    await shot(page, "infinite-loop");
  });

  test("long loop is capped but still replayable", async ({ page }) => {
    await runProgram(page, `total = 0\nfor i in range(20000):\n    total += i\nprint(total)`);
    await expect(page.getByTestId("result-summary")).toBeVisible({ timeout: 60_000 });
    await shot(page, "long-loop");
    await page.getByTestId("explore-button").click();
    await expect(page.getByTestId("step-counter")).toBeVisible();
  });

  test("runaway recursion reports RecursionError", async ({ page }) => {
    await runProgram(page, `def f(n):\n    return f(n + 1)\n\nf(0)`);
    await expect(page.getByTestId("result-summary")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("result-summary")).toContainText(/recursion/i);
    await shot(page, "recursion");
  });

  test("heavy output and unicode do not break the layout", async ({ page }) => {
    await runProgram(
      page,
      `for i in range(300):\n    print("línea ñ 🚀", i, "x" * 120)`
    );
    await expect(page.getByTestId("result-summary")).toBeVisible({ timeout: 60_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    await shot(page, "heavy-output");
  });
});
