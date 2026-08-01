import { test, expect } from "@playwright/test";

test.describe("public auth pages", () => {
  test("login page renders with email/password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-pw")).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("login validation blocks empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.click('button[type="submit"]');
    await expect(page.getByText("이메일과 비밀번호를 입력해주세요.")).toBeVisible();
  });

  test("login with bad credentials shows an error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login-email", "nonexistent-e2e-user@example.com");
    await page.fill("#login-pw", "wrong-password-123");
    await page.click('button[type="submit"]');
    await expect(page.locator("form")).toContainText(/./, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("navigates between login, signup, forgot-password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "회원가입" }).click();
    await expect(page).toHaveURL(/\/signup/);
    await page.goto("/login");
    await page.getByRole("link", { name: "비밀번호 찾기" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("language toggle switches login page to English and persists", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Log In" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Log In" })).toBeVisible();
  });
});

test.describe("route protection", () => {
  for (const path of ["/portfolio", "/indices", "/journal", "/news", "/research", "/flow", "/monitor", "/security"]) {
    test(`unauthenticated visit to ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
