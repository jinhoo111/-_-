import { test, expect } from "@playwright/test";

// Covers the migrated Home dashboard widgets, the news real-time quotes tab, and the
// new settings page. Runs against the authed user storage state (auth.setup.ts).
test.describe("home dashboard widgets", () => {
  test("portfolio shows the tech signal scanner and portfolio-news section", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByText("기술 신호 스캐너")).toBeVisible();
    await expect(page.getByText("보유 종목 최신 소식")).toBeVisible();
  });
});

test.describe("news real-time quotes tab", () => {
  test("quotes tab renders and accepts a symbol", async ({ page }) => {
    await page.goto("/news");
    await page.getByRole("button", { name: "실시간 시세" }).click();
    await expect(page.getByText("* 미국 주식 실시간 · 국내(KS) 15분 딜레이")).toBeVisible();
    await page.getByPlaceholder("티커 (예: NVDA)").fill("MSFT");
    await page.getByRole("button", { name: "추가", exact: true }).click();
    await expect(page.getByText("MSFT")).toBeVisible();
  });
});

test.describe("settings page", () => {
  test("settings page loads for an authed user", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "설정" })).toBeVisible();
  });

  test("settings link is present in the nav", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByRole("link", { name: "설정" })).toHaveCount(1);
  });
});
