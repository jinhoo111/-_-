import { test, expect } from "@playwright/test";

test.describe("authenticated smoke", () => {
  test("portfolio page loads for a logged-in user", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page).toHaveURL(/\/portfolio/);
    await expect(page.getByText("포트폴리오").first()).toBeVisible();
  });

  test("nav links reach each feature page", async ({ page }) => {
    await page.goto("/portfolio");
    for (const [href, marker] of [
      ["/indices", /\/indices/],
      ["/journal", /\/journal/],
      ["/flow", /\/flow/],
      ["/monitor", /\/monitor/],
    ] as const) {
      await page.goto(href);
      await expect(page).toHaveURL(marker);
      await expect(page.locator("body")).not.toContainText("404");
    }
  });

  test("logout returns to login page", async ({ browser }) => {
    // Logs in fresh through the UI in its own context instead of reusing the
    // project-wide user.json storageState — signing out invalidates that
    // session's refresh token, which would otherwise break every other test
    // (in this run and subsequent runs) that loads the same storageState file.
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/login");
    await page.fill("#login-email", email!);
    await page.fill("#login-pw", password!);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/portfolio", { timeout: 15_000 });
    await page.locator('form[action="/auth/signout"] button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/);
    await context.close();
  });

  test("security nav link hidden for non-admin user", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByRole("link", { name: "관리자" })).toHaveCount(0);
  });
});
