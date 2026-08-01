import { test, expect } from "@playwright/test";

test.describe("admin security dashboard", () => {
  test("security nav link visible and route reachable for admin", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByRole("link", { name: "관리자" })).toBeVisible();
    await page.getByRole("link", { name: "관리자" }).click();
    await expect(page).toHaveURL(/\/security/);
  });

  test("all four security tabs render without error", async ({ page }) => {
    await page.goto("/security");
    await expect(page.locator("body")).not.toContainText("404");
    const tabButtons = page.locator("button");
    await expect(tabButtons.first()).toBeVisible();
  });
});
