import { expect, test, type Page } from "@playwright/test";

async function signUp(page: Page) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/today");
}

test("unauthenticated visitors are sent to sign in", async ({ page }) => {
  await page.goto("/plan");
  await page.waitForURL("**/sign-in");
});

test("the app exposes exactly four primary tabs", async ({ page }) => {
  await signUp(page);
  const nav = page.getByRole("navigation", { name: "Primary" }).first();
  await expect(nav.getByRole("link")).toHaveText(["Today", "Journal", "Plan", "Library"]);
});

test("task, time block and reminder persist across a refresh", async ({ page }) => {
  await signUp(page);

  await page.goto("/plan?view=tasks");
  await page.getByRole("button", { name: "New task" }).click();
  await page.getByLabel("Title").fill("E2E task");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByText("E2E task")).toBeVisible();

  await page.goto("/plan?view=planner");
  await page.getByRole("button", { name: /^Block$/ }).click();
  await page.getByLabel("Title").fill("E2E block");
  await page.getByRole("button", { name: "Add block" }).click();
  await expect(page.getByRole("button", { name: /^E2E block,/ })).toBeVisible();

  await page.goto("/plan?view=reminders");
  await page.getByRole("button", { name: "New reminder" }).first().click();
  await page.getByLabel("Remind me to").fill("E2E reminder");
  await page.getByRole("button", { name: "Set reminder" }).click();
  await expect(page.getByText("E2E reminder")).toBeVisible();

  await page.reload();
  await expect(page.getByText("E2E reminder")).toBeVisible();
  await page.goto("/plan?view=tasks");
  await page.getByRole("tab", { name: /All/ }).click();
  await expect(page.getByText("E2E task")).toBeVisible();
  await page.goto("/plan?view=planner");
  await expect(page.getByRole("button", { name: /^E2E block,/ })).toBeVisible();
});

test("overlapping time blocks warn before saving", async ({ page }) => {
  await signUp(page);
  await page.goto("/plan?view=planner");
  for (const title of ["First", "Second"]) {
    await page.getByRole("button", { name: /^Block$/ }).click();
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Start").fill("10:00");
    await page.getByLabel("End").fill("11:00");
    if (title === "Second")
      await expect(page.getByRole("alert").filter({ hasText: "overlaps" })).toBeVisible();
    await page.getByRole("button", { name: /Add block|Save anyway/ }).click();
    if (title === "Second")
      await page.getByRole("button", { name: "Save anyway" }).click();
  }
});
