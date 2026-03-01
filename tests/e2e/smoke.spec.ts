import { expect, test } from "@playwright/test";

test("home page renders dashboard title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Gym Dashboard" })).toBeVisible();
});
