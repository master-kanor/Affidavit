import { expect, test } from "@playwright/test";

test.describe("public access gateway", () => {
  test("shows a restricted gateway without case disclosure", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "A private portal for controlled case review." })).toBeVisible();
    await expect(page.getByText("Private case materials are not displayed on the public gateway.")).toBeVisible();
    await expect(page.getByText("No public registration")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("AFFIDAVIT OF EVIDENCE");
    await expect(page.locator("body")).not.toContainText("Na ako po ay nagsasalaysay");
  });

  test("exposes manually provisioned sign-in only", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByText("Private access gateway")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByText("No public registration is available.")).toBeVisible();
    await expect(page.getByText("Sign up")).toHaveCount(0);
  });

  test("does not expose source text when a protected route is opened without a session", async ({ page }) => {
    await page.goto("/official");
    await expect(page.locator("body")).not.toContainText("Na ako po ay nagsasalaysay");
    await expect(page.locator("body")).not.toContainText("AFFIDAVIT OF EVIDENCE");
  });
});
