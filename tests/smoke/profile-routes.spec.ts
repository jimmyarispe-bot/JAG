import { test, expect } from "@playwright/test";

test.describe("Profile route smoke tests", () => {
  test("student profile redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/students/test-student-id");
    await expect(page).toHaveURL(/\/login/);
  });

  test("employee profile redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/hr/employees/test-employee-id");
    await expect(page).toHaveURL(/\/login/);
  });

  test("student profile deep link redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/students/test-student-id?section=timeline");
    await expect(page).toHaveURL(/\/login/);
  });

  test("employee profile legacy tab redirect target requires auth", async ({ page }) => {
    await page.goto("/dashboard/hr/employees/test-employee-id?tab=timeline");
    await expect(page).toHaveURL(/\/login|section=activity/);
  });

  test("family profile redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/families/test-family-id");
    await expect(page).toHaveURL(/\/login/);
  });

  test("family profile deep link redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/families/test-family-id?section=students");
    await expect(page).toHaveURL(/\/login/);
  });

  test("legacy finance family route redirects to family profile tuition section", async ({ page }) => {
    await page.goto("/dashboard/finance/families/test-family-id");
    await expect(page).toHaveURL(/\/login|\/dashboard\/families\/test-family-id\?section=tuition/);
  });

  test("family profile legacy tab redirect target requires auth", async ({ page }) => {
    await page.goto("/dashboard/families/test-family-id?tab=billing");
    await expect(page).toHaveURL(/\/login|section=tuition/);
  });

  test("platform diagnostics redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/platform/diagnostics");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admissions dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/admissions?view=executive");
    await expect(page).toHaveURL(/\/login/);
  });
});
