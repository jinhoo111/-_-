import { test as setup, expect } from "@playwright/test";

const authDir = `${__dirname}/.auth`;

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#login-email", email);
  await page.fill("#login-pw", password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/portfolio", { timeout: 15_000 });
}

setup("authenticate as test user", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  setup.skip(!email || !password, "E2E_TEST_EMAIL/PASSWORD not set — skipping user auth setup");
  await loginAs(page, email!, password!);
  await expect(page).toHaveURL(/\/portfolio/);
  await page.context().storageState({ path: `${authDir}/user.json` });
});

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  setup.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin auth setup");
  await loginAs(page, email!, password!);
  await expect(page).toHaveURL(/\/portfolio/);
  await page.context().storageState({ path: `${authDir}/admin.json` });
});
